import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Pencil,
  Trash2,
  Tag,
  Calendar,
  Search,
  CheckCircle,
  XCircle,
  TicketPercent,
  Gift,
  Layers,
} from "lucide-react";
import { format } from "date-fns";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  createColumnHelper,
} from "@tanstack/react-table";

// --- UI COMPONENTS ---
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable } from "@/components/ui/data-table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { discountApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const columnHelper = createColumnHelper<any>();

export default function Discounts() {
  const navigate = useNavigate();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // --- 1. DATA FETCHING ---
  const { data: discountsData, isLoading } = useQuery({
    queryKey: ["discounts"],
    queryFn: () => discountApi.getAll().then((res) => res.data || res),
  });

  // --- 2. DELETE MUTATION ---
  const deleteMutation = useMutation({
    mutationFn: discountApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discounts"] });
      toast({ title: "Discount deleted successfully" });
      setDeleteId(null);
    },
    onError: () => toast({ title: "Failed to delete", variant: "destructive" }),
  });

  // --- 3. COLUMNS DEFINITION ---
  const columns = useMemo(
    () => [
      // NAME
      columnHelper.accessor("name", {
        header: "Discount Name",
        cell: (info) => (
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 rounded-md text-primary">
              {info.row.original.type === "BOGO" ? (
                <Gift className="h-3.5 w-3.5" />
              ) : info.row.original.type === "BULK" ? (
                <Layers className="h-3.5 w-3.5" />
              ) : info.row.original.code ? (
                <TicketPercent className="h-3.5 w-3.5" />
              ) : (
                <Tag className="h-3.5 w-3.5" />
              )}
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-sm">{info.getValue()}</span>
              {info.row.original.code && (
                <span className="text-[10px] text-muted-foreground font-mono">
                  Code: {info.row.original.code}
                </span>
              )}
            </div>
          </div>
        ),
      }),

      // TYPE
      columnHelper.accessor("type", {
        header: "Type",
        cell: (info) => (
          <Badge
            variant="outline"
            className="text-[10px] uppercase font-normal"
          >
            {info.getValue()}
          </Badge>
        ),
      }),

      // VALUE
      columnHelper.accessor("value", {
        header: "Value",
        cell: (info) => {
          const type = info.row.original.type;
          if (type === "BOGO")
            return <span className="font-bold text-sm">Buy X Get Y</span>;
          return (
            <span className="font-bold text-sm">
              {type === "PERCENTAGE"
                ? `${info.getValue()}%`
                : `$${info.getValue()}`}
            </span>
          );
        },
      }),

      // SCOPE
      columnHelper.accessor("scope", {
        header: "Scope",
        cell: (info) => (
          <Badge
            variant="secondary"
            className="text-[10px] font-normal capitalize"
          >
            {info.getValue()}
          </Badge>
        ),
      }),

      // VALID UNTIL
      columnHelper.accessor("validUntil", {
        header: "Valid Until",
        cell: (info) => (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {format(new Date(info.getValue()), "MMM dd, yyyy")}
          </div>
        ),
      }),

      // STATUS
      columnHelper.accessor("validUntil", {
        id: "status",
        header: "Status",
        cell: (info) => {
          const isValid = new Date(info.getValue()) > new Date();
          return (
            <Badge
              className={`text-[10px] px-2 py-0.5 pointer-events-none ${
                isValid
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-destructive hover:bg-destructive/90"
              }`}
            >
              {isValid ? (
                <CheckCircle className="h-3 w-3 mr-1" />
              ) : (
                <XCircle className="h-3 w-3 mr-1" />
              )}
              {isValid ? "Active" : "Expired"}
            </Badge>
          );
        },
      }),

      // ACTIONS
      columnHelper.display({
        id: "actions",
        header: "",
        cell: (info) => (
          <div className="flex gap-1 justify-end">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() =>
                navigate(`/discounts/edit/${info.row.original.id}`)
              }
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-destructive hover:bg-destructive/10"
              onClick={() => setDeleteId(info.row.original.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ),
      }),
    ],
    [navigate]
  );

  // --- 4. TABLE INSTANCE ---
  const table = useReactTable({
    data: discountsData || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    initialState: { pagination: { pageSize: 8 } },
  });

  return (
    <main className="page-container">
      {/* HEADER WITH BUTTONS */}
      <section className="page-header flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2>Discounts</h2>
          <p className="page-description">
            Manage promotions, coupons, and seasonal offers.
          </p>
        </div>

        {/* Actions Buttons Group */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={() => navigate("/discounts/create-coupon")}
          >
            <TicketPercent className="h-4 w-4 mr-2" />
            Coupon
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/discounts/create-bogo")}
          >
            <Gift className="h-4 w-4 mr-2" />
            BOGO
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/discounts/create-bulk")}
          >
            <Layers className="h-4 w-4 mr-2" />
            Bulk
          </Button>
          <Button onClick={() => navigate("/discounts/new")}>
            <Plus className="h-4 w-4 mr-2" />
            Standard
          </Button>
        </div>
      </section>

      <Separator className="mb-6" />

      {/* SEARCH */}
      <div className="relative max-w-sm mb-6">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search discounts..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="pl-9 h-9"
        />
      </div>

      {/* TABLE CONTENT */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-10 w-10 rounded-md" />
                  <div className="space-y-2 w-full">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-4 w-[150px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <DataTable table={table} />
          )}
        </CardContent>
      </Card>

      {/* DELETE DIALOG */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              discount.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
