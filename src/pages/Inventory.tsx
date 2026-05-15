import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  createColumnHelper,
} from "@tanstack/react-table";
import {
  Package,
  History,
  ArrowRightLeft,
  PlusCircle,
  RefreshCcw,
  Search,
} from "lucide-react";

// --- UI COMPONENTS ---
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable } from "@/components/ui/data-table"; // <--- GLOBAL TABLE
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { inventoryApi, productApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { asArray } from "@/lib/utils";

// --- HELPERS ---
const historyColumnHelper = createColumnHelper<any>();
const stockColumnHelper = createColumnHelper<any>();

export default function Inventory() {
  const [activeTab, setActiveTab] = useState<"stock" | "history">("stock");
  const [globalFilter, setGlobalFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");

  // Adjustment States
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [adjustProductId, setAdjustProductId] = useState("");
  const [adjustType, setAdjustType] = useState("MANUAL_ADD");
  const [adjustQty, setAdjustQty] = useState(1);
  const [adjustReason, setAdjustReason] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // --- QUERIES ---
  const {
    data: inventoryData,
    isLoading: isHistoryLoading,
    refetch: refetchHistory,
  } = useQuery({
    queryKey: ["inventory"],
    queryFn: async () => {
      const res = await inventoryApi.getAll();
      return asArray(res.data ?? res);
    },
  });

  const {
    data: productsData,
    isLoading: isStockLoading,
    refetch: refetchStock,
  } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const res = await productApi.getAll();
      return asArray(res.data ?? res);
    },
  });

  const handleRefresh = () => {
    refetchHistory();
    refetchStock();
    toast({ title: "Data refreshed" });
  };

  // --- MUTATION ---
  const adjustMutation = useMutation({
    mutationFn: (data: any) => inventoryApi.adjust(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "Stock adjusted successfully" });
      setIsAdjustOpen(false);
      setAdjustProductId("");
      setAdjustQty(1);
      setAdjustReason("");
    },
    onError: (error: any) => {
      toast({ title: "Adjustment failed", variant: "destructive" });
    },
  });

  const handleAdjustSubmit = () => {
    if (!adjustProductId || adjustQty <= 0) {
      toast({ title: "Invalid input", variant: "destructive" });
      return;
    }
    const selectedProduct = (productsData ?? []).find(
      (p: any) => p.id === adjustProductId
    );
    if (!selectedProduct) return;

    const payload = {
      productId: adjustProductId,
      branchId: selectedProduct.branchId,
      type: adjustType,
      quantity: Number(adjustQty),
      reason: adjustReason || "Manual Adjustment",
      referenceId: "MANUAL",
      createdBy: "Admin",
    };
    adjustMutation.mutate(payload);
  };

  // --- COLUMNS ---
  const stockColumns = useMemo(
    () => [
      stockColumnHelper.accessor("name", {
        header: "Product Name",
        cell: (info) => (
          <div className="flex flex-col">
            <span className="font-medium text-sm">{info.getValue()}</span>
            <span className="text-[10px] text-muted-foreground font-mono">
              {info.row.original.sku}
            </span>
          </div>
        ),
      }),
      stockColumnHelper.accessor("branch.name", {
        header: "Branch",
        cell: (info) => (
          <Badge variant="outline" className="font-normal text-xs">
            {info.getValue() || "N/A"}
          </Badge>
        ),
      }),
      stockColumnHelper.accessor("price", {
        header: "Price",
        cell: (info) => (
          <span className="font-mono text-xs">${info.getValue()}</span>
        ),
      }),
      stockColumnHelper.accessor("stockQuantity", {
        header: "Stock",
        cell: (info) => {
          const qty = info.getValue();
          return (
            <div className="flex items-center gap-2">
              <span
                className={`font-bold text-sm ${
                  qty < 10 ? "text-destructive" : "text-green-600"
                }`}
              >
                {qty}
              </span>
              {qty < 10 && (
                <Badge variant="destructive" className="text-[10px] h-4 px-1">
                  Low
                </Badge>
              )}
            </div>
          );
        },
      }),
      stockColumnHelper.accessor("id", {
        // Total Value Virtual Column
        header: "Value",
        cell: (info) => {
          const total =
            info.row.original.price * info.row.original.stockQuantity;
          return (
            <span className="font-bold text-xs text-muted-foreground">
              ${total.toLocaleString()}
            </span>
          );
        },
      }),
    ],
    []
  );

  const historyColumns = useMemo(
    () => [
      historyColumnHelper.accessor("product.name", {
        header: "Product",
        cell: (info) => (
          <span className="font-medium text-sm">
            {info.getValue() || "Unknown"}
          </span>
        ),
      }),
      historyColumnHelper.accessor("branch.name", {
        header: "Branch",
        cell: (info) => (
          <Badge variant="secondary" className="font-normal text-xs">
            {info.getValue() || "N/A"}
          </Badge>
        ),
      }),
      historyColumnHelper.accessor("type", {
        header: "Type",
        cell: (info) => {
          const type = info.getValue();
          let color = "bg-secondary";
          if (["PURCHASE", "MANUAL_ADD", "TRANSFER_IN"].includes(type))
            color = "bg-green-100 text-green-800 border-green-200";
          if (["SALE", "MANUAL_REMOVE", "TRANSFER_OUT"].includes(type))
            color = "bg-red-100 text-red-800 border-red-200";
          return (
            <Badge variant="outline" className={`text-[10px] ${color}`}>
              {type.replace("_", " ")}
            </Badge>
          );
        },
      }),
      historyColumnHelper.accessor("quantity", {
        header: "Qty",
        cell: (info) => {
          const qty = info.getValue();
          const type = info.row.original.type;
          const isPositive = [
            "PURCHASE",
            "TRANSFER_IN",
            "RETURN",
            "MANUAL_ADD",
          ].includes(type);
          return (
            <span
              className={`font-bold text-xs ${
                isPositive ? "text-green-600" : "text-red-600"
              }`}
            >
              {isPositive ? "+" : "-"}
              {Math.abs(qty)}
            </span>
          );
        },
      }),
      historyColumnHelper.accessor("notes", {
        header: "Reason",
        cell: (info) => (
          <span
            className="text-xs text-muted-foreground truncate max-w-[150px] block"
            title={info.row.original.reason}
          >
            {info.row.original.reason || info.getValue() || "-"}
          </span>
        ),
      }),
      historyColumnHelper.accessor("createdAt", {
        header: "Date",
        cell: (info) => (
          <span className="text-xs text-muted-foreground">
            {new Date(info.getValue()).toLocaleString()}
          </span>
        ),
      }),
    ],
    []
  );

  // --- TABLES ---
  const stockTable = useReactTable({
    data: productsData ?? [],
    columns: stockColumns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    initialState: { pagination: { pageSize: 8 } },
  });

  const historyTable = useReactTable({
    data:
      (inventoryData ?? []).filter(
        (item: any) => typeFilter === "ALL" || item.type === typeFilter
      ),
    columns: historyColumns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 8 } },
  });

  return (
    <main className="page-container">
      {/* HEADER */}
      <section className="page-header flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h2>Inventory System</h2>
          <p className="page-description">Track stock levels and movements.</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            title="Refresh Data"
          >
            <RefreshCcw className="h-4 w-4" />
          </Button>
          <Dialog open={isAdjustOpen} onOpenChange={setIsAdjustOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" /> Adjust Stock
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Manual Adjustment</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Product</Label>
                  <Select
                    value={adjustProductId}
                    onValueChange={setAdjustProductId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Product" />
                    </SelectTrigger>
                    <SelectContent>
                      {(productsData ?? []).map((p: any) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} (Qty: {p.stockQuantity})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Action</Label>
                    <Select value={adjustType} onValueChange={setAdjustType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MANUAL_ADD">Add (+)</SelectItem>
                        <SelectItem value="MANUAL_REMOVE">
                          Remove (-)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      min="1"
                      value={adjustQty}
                      onChange={(e) => setAdjustQty(Number(e.target.value))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Reason</Label>
                  <Textarea
                    placeholder="e.g. Damaged goods..."
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={handleAdjustSubmit}
                  disabled={adjustMutation.isPending}
                >
                  {adjustMutation.isPending ? "Processing..." : "Confirm"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </section>

      <Separator className="mb-6" />

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[
          {
            label: "Total Products",
            val: (productsData ?? []).length,
            icon: Package,
            color: "text-primary",
          },
          {
            label: "Low Stock",
            val: (productsData ?? []).filter((p: any) => p.stockQuantity < 10)
              .length,
            icon: ArrowRightLeft,
            color: "text-destructive",
          },
          {
            label: "Movements",
            val: (inventoryData ?? []).length,
            icon: History,
            color: "text-blue-600",
          },
        ].map((stat, i) => (
          <Card key={i}>
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">
                  {stat.label}
                </p>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.val}</p>
              </div>
              <stat.icon className={`h-8 w-8 opacity-20 ${stat.color}`} />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* TABS & FILTERS */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
        <div className="flex bg-muted p-1 rounded-lg">
          <Button
            variant={activeTab === "stock" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("stock")}
            className="text-xs"
          >
            <Package className="mr-2 h-3.5 w-3.5" /> Stock Levels
          </Button>
          <Button
            variant={activeTab === "history" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("history")}
            className="text-xs"
          >
            <History className="mr-2 h-3.5 w-3.5" /> History
          </Button>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="pl-9 h-9"
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
            />
          </div>
          {activeTab === "history" && (
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px] h-9">
                <SelectValue placeholder="Filter Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
                <SelectItem value="PURCHASE">Purchases</SelectItem>
                <SelectItem value="SALE">Sales</SelectItem>
                <SelectItem value="TRANSFER_IN">Transfers</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* TABLE */}
      <Card>
        <CardContent className="p-0">
          {(activeTab === "stock" ? isStockLoading : isHistoryLoading) ? (
            <div className="p-8 space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-full rounded-md" />
              ))}
            </div>
          ) : (
            <DataTable
              table={activeTab === "stock" ? stockTable : historyTable}
            />
          )}
        </CardContent>
      </Card>
    </main>
  );
}
