import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Package,
  AlertCircle,
} from "lucide-react";
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  createColumnHelper,
} from "@tanstack/react-table";

// --- UI COMPONENTS ---
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable } from "@/components/ui/data-table"; // <--- REUSABLE COMPONENT
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

import { productApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const columnHelper = createColumnHelper<any>();

export default function Products() {
  const navigate = useNavigate();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // --- 1. DATA FETCHING ---
  const { data: products, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: () => productApi.getAll().then((res) => res.data || res),
  });

  // --- 2. DELETE MUTATION ---
  const deleteMutation = useMutation({
    mutationFn: productApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "Product deleted successfully" });
      setDeleteId(null);
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  // --- 3. COLUMNS DEFINITION ---
  const columns = useMemo(
    () => [
      // Product Name with Icon
      columnHelper.accessor("name", {
        header: "Product Name",
        cell: (info) => (
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center text-primary">
              <Package className="h-4 w-4" />
            </div>
            <span className="font-medium text-sm">{info.getValue()}</span>
          </div>
        ),
      }),

      // SKU
      columnHelper.accessor("sku", {
        header: "SKU",
        cell: (info) => (
          <span className="font-mono text-xs text-muted-foreground">
            {info.getValue()}
          </span>
        ),
      }),

      // Category
      columnHelper.accessor("category.name", {
        header: "Category",
        cell: (info) => (
          <Badge
            variant="outline"
            className="font-normal text-xs text-muted-foreground"
          >
            {info.getValue() || "Uncategorized"}
          </Badge>
        ),
      }),

      // Branches
      columnHelper.accessor("branches", {
        header: "Branches",
        cell: (info) => {
          const val = info.row.original.branches || info.row.original.branch;
          const list = Array.isArray(val) ? val : val ? [val] : [];

          if (list.length === 0)
            return (
              <span className="text-muted-foreground text-xs italic">None</span>
            );

          return (
            <div className="flex flex-wrap gap-1 max-w-[200px]">
              {list.slice(0, 2).map((b: any, i: number) => (
                <Badge
                  key={i}
                  variant="secondary"
                  className="text-[10px] px-1.5 h-5"
                >
                  {b.name}
                </Badge>
              ))}
              {list.length > 2 && (
                <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                  +{list.length - 2}
                </Badge>
              )}
            </div>
          );
        },
      }),

      // Price
      columnHelper.accessor("price", {
        header: "Price",
        cell: (info) => (
          <span className="font-bold text-sm">
            ${Number(info.getValue()).toFixed(2)}
          </span>
        ),
      }),

      // Stock Status
      columnHelper.accessor("stockQuantity", {
        header: "Stock",
        cell: (info) => {
          const stock = info.getValue() || 0;
          const isLow = stock < 10;
          return (
            <div
              className={`flex items-center gap-1.5 ${
                isLow ? "text-destructive font-medium" : "text-muted-foreground"
              }`}
            >
              {isLow && <AlertCircle className="h-3.5 w-3.5" />}
              <span className="text-sm">{stock} units</span>
            </div>
          );
        },
      }),

      // Actions
      columnHelper.display({
        id: "actions",
        header: "",
        cell: (info) => (
          <div className="flex gap-1 justify-end">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => navigate(`/products/edit/${info.row.original.id}`)}
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
    data: products || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    initialState: { pagination: { pageSize: 8 } }, // Set Default Page Size
  });

  return (
    <main className="page-container">
      {/* HEADER */}
      <section className="page-header">
        <div>
          <h2>Products</h2>
          <p className="page-description">Manage your inventory catalog.</p>
        </div>
        <Button onClick={() => navigate("/products/new")}>
          <Plus className="h-4 w-4 mr-2" /> Add Product
        </Button>
      </section>

      <Separator className="mb-6" />

      {/* SEARCH BAR */}
      <div className="relative max-w-sm mb-6">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search products..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="pl-9 h-9"
        />
      </div>

      {/* CONTENT: SKELETON OR DATA TABLE */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        // --- USING THE REUSABLE DATA TABLE COMPONENT ---
        // Ye component khud Table render karega aur Pagination bhi layega
        <DataTable table={table} />
      )}

      {/* DELETE DIALOG */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              product.
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
