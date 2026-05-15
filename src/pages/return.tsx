import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, RotateCcw, User, FileText, Calendar } from "lucide-react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  createColumnHelper,
  flexRender,
} from "@tanstack/react-table";

// --- UI COMPONENTS ---
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable } from "@/components/ui/data-table"; // Global Table
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"; // For inside dialog
import { Label } from "@/components/ui/label";

import { saleApi, returnApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const columnHelper = createColumnHelper<any>();

export default function Returns() {
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [returnItems, setReturnItems] = useState<any>({});
  const [isReturnOpen, setIsReturnOpen] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // --- QUERIES ---
  const { data: sales } = useQuery({
    queryKey: ["sales"],
    queryFn: () => saleApi.getAll(),
  });

  const { data: returnsData, isLoading } = useQuery({
    queryKey: ["returns"],
    queryFn: () => returnApi.getAll().then((res) => res.data || res),
  });

  // --- MUTATION ---
  const returnMutation = useMutation({
    mutationFn: returnApi.create,
    onSuccess: () => {
      toast({ title: "Return Processed & Stock Restored" });
      setIsReturnOpen(false);
      setReturnItems({});
      queryClient.invalidateQueries({ queryKey: ["returns"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (err: any) =>
      toast({
        title: "Failed",
        description: err.response?.data?.message || "Could not process return",
        variant: "destructive",
      }),
  });

  // --- HANDLERS ---
  const handleSearch = () => {
    if (!sales?.data) return;
    const sale = sales.data.find((s: any) => s.invoiceNo === invoiceSearch);

    if (sale) {
      setSelectedSale(sale);
      setIsReturnOpen(true);
      setReturnItems({});
    } else {
      toast({ title: "Invoice not found", variant: "destructive" });
    }
  };

  const handleQtyChange = (
    productId: string,
    qty: number,
    max: number,
    price: number
  ) => {
    if (qty > max || qty < 0) return;
    setReturnItems((prev: any) => ({
      ...prev,
      [productId]: { quantity: qty, price },
    }));
  };

  const submitReturn = () => {
    const items = Object.entries(returnItems)
      .filter(([_, val]: any) => val.quantity > 0)
      .map(([key, val]: any) => ({
        productId: key,
        quantity: val.quantity,
        price: val.price,
      }));

    if (items.length === 0) {
      toast({ title: "Select items to return", variant: "destructive" });
      return;
    }

    returnMutation.mutate({
      saleId: selectedSale.id,
      reason: "Customer Return / Defect",
      items,
    });
  };

  // --- COLUMNS DEFINITION ---
  const columns = useMemo(
    () => [
      columnHelper.accessor("id", {
        header: "Return ID",
        cell: (info) => (
          <span className="font-mono text-xs font-bold">
            #{info.getValue().slice(0, 8)}
          </span>
        ),
      }),
      columnHelper.accessor("sale.invoiceNo", {
        header: "Original Invoice",
        cell: (info) => (
          <div className="flex items-center gap-2 text-xs">
            <FileText className="h-3 w-3 text-muted-foreground" />
            {info.getValue()}
          </div>
        ),
      }),
      columnHelper.accessor("processedBy.name", {
        header: "Processed By",
        cell: (info) => (
          <Badge
            variant="outline"
            className="font-normal text-xs text-muted-foreground"
          >
            <User className="h-3 w-3 mr-1" /> {info.getValue() || "Admin"}
          </Badge>
        ),
      }),
      columnHelper.accessor("totalRefund", {
        header: "Refund Amount",
        cell: (info) => (
          <span className="font-bold text-red-600">
            -${Number(info.getValue()).toLocaleString()}
          </span>
        ),
      }),
      columnHelper.accessor("returnDate", {
        header: "Date",
        cell: (info) => (
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <Calendar className="h-3 w-3" />
            {new Date(info.getValue()).toLocaleDateString()}
          </div>
        ),
      }),
    ],
    []
  );

  // --- TABLE INSTANCE ---
  const table = useReactTable({
    data: returnsData || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 8 } },
  });

  return (
    <main className="page-container">
      {/* HEADER */}
      <section className="page-header flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2>Sales Return (RMA)</h2>
          <p className="page-description">
            Manage refunds and returned inventory.
          </p>
        </div>

        {/* SEARCH BOX */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Find Invoice (e.g. INV-1005)"
              value={invoiceSearch}
              onChange={(e) => setInvoiceSearch(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          <Button onClick={handleSearch}>Find</Button>
        </div>
      </section>

      <Separator className="mb-6" />

      {/* HISTORY TABLE */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <RotateCcw className="h-4 w-4 text-primary" /> Return History
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full rounded-md" />
              ))}
            </div>
          ) : (
            <DataTable table={table} />
          )}
        </CardContent>
      </Card>

      {/* RETURN DIALOG */}
      <Dialog open={isReturnOpen} onOpenChange={setIsReturnOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Process Return</DialogTitle>
            <DialogDescription>
              Select items from Invoice{" "}
              <strong>{selectedSale?.invoiceNo}</strong> to return.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Info Box */}
            <div className="bg-primary/10 border border-primary/20 p-3 rounded-md text-sm text-primary flex items-center gap-2">
              <RotateCcw className="h-4 w-4" />
              Stock will be restored to{" "}
              <strong>{selectedSale?.branch?.name}</strong>.
            </div>

            {/* Selection Table */}
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Sold Price</TableHead>
                    <TableHead className="text-center">Sold Qty</TableHead>
                    <TableHead className="text-center w-[140px]">
                      Return Qty
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedSale?.items.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium text-sm">
                        {item.product?.name}
                      </TableCell>
                      <TableCell className="text-right text-xs">
                        ${item.unitPrice}
                      </TableCell>
                      <TableCell className="text-center text-xs">
                        {item.quantity}
                      </TableCell>
                      <TableCell className="text-center p-2">
                        <Input
                          type="number"
                          min="0"
                          max={item.quantity}
                          className="h-8 text-center"
                          placeholder="0"
                          onChange={(e) =>
                            handleQtyChange(
                              item.productId,
                              parseInt(e.target.value) || 0,
                              item.quantity,
                              item.unitPrice
                            )
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Actions */}
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setIsReturnOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={submitReturn}
                disabled={returnMutation.isPending}
              >
                {returnMutation.isPending ? "Processing..." : "Confirm Refund"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
