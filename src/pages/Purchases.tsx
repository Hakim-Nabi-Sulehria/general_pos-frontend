import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Trash2,
  FileText,
  Pencil,
  Send,
  CheckCircle2,
  Clock,
  Search,
  Truck,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
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
import { DataTable } from "@/components/ui/data-table"; // <--- GLOBAL TABLE
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { purchaseApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const columnHelper = createColumnHelper<any>();

export default function Purchases() {
  const navigate = useNavigate();
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [postId, setPostId] = useState<string | null>(null);
  const [globalFilter, setGlobalFilter] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // --- 1. DATA FETCHING ---
  const { data: purchases, isLoading } = useQuery({
    queryKey: ["purchases"],
    queryFn: () => purchaseApi.getAll().then((res) => res.data || res),
  });

  // --- 2. MUTATIONS ---
  const deleteMutation = useMutation({
    mutationFn: purchaseApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
      toast({ title: "Purchase deleted successfully" });
      setDeleteId(null);
    },
    onError: () => toast({ title: "Failed to delete", variant: "destructive" }),
  });

  const postMutation = useMutation({
    mutationFn: (id: string) => purchaseApi.update(id, { status: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
      toast({
        title: "Purchase Posted Successfully",
        description: "Stock updated.",
      });
      setPostId(null);
    },
    onError: (error: any) =>
      toast({ title: "Failed to post", variant: "destructive" }),
  });

  const viewPurchase = (purchase: any) => {
    setSelectedPurchase(purchase);
    setIsViewOpen(true);
  };

  // --- 3. COLUMNS ---
  const columns = useMemo(
    () => [
      // Reference #
      columnHelper.accessor("referenceNo", {
        header: "Ref #",
        cell: (info) => (
          <span className="font-mono text-xs font-bold">
            #{info.getValue() || info.row.original.id.slice(0, 8)}
          </span>
        ),
      }),

      // Date
      columnHelper.accessor("createdAt", {
        header: "Date",
        cell: (info) => (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {new Date(info.getValue()).toLocaleDateString()}
          </div>
        ),
      }),

      // Supplier
      columnHelper.accessor("supplier.name", {
        header: "Supplier",
        cell: (info) => (
          <span className="font-medium text-sm">
            {info.getValue() || "N/A"}
          </span>
        ),
      }),

      // Branch
      columnHelper.accessor("branch.name", {
        header: "Branch",
        cell: (info) => (
          <Badge variant="outline" className="font-normal text-xs">
            {info.getValue() || "Global"}
          </Badge>
        ),
      }),

      // Amount
      columnHelper.accessor("totalAmount", {
        header: "Amount",
        cell: (info) => (
          <span className="font-bold text-primary">
            ${info.getValue()?.toFixed(2)}
          </span>
        ),
      }),

      // Status
      columnHelper.accessor("status", {
        header: "Status",
        cell: (info) => {
          const isPosted = info.getValue() === true;
          return (
            <Badge
              className={`text-[10px] px-2 py-0.5 pointer-events-none ${
                isPosted
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary"
              }`}
            >
              {isPosted ? (
                <CheckCircle2 className="h-3 w-3 mr-1" />
              ) : (
                <Clock className="h-3 w-3 mr-1" />
              )}
              {isPosted ? "Posted" : "Draft"}
            </Badge>
          );
        },
      }),

      // Actions
      columnHelper.display({
        id: "actions",
        header: "Actions",
        cell: (info) => {
          const isPosted = info.row.original.status === true;
          return (
            <div className="flex gap-1 justify-end">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-blue-600"
                      onClick={() => viewPurchase(info.row.original)}
                    >
                      <FileText className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>View Invoice</TooltipContent>
                </Tooltip>

                {!isPosted && (
                  <>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground"
                          onClick={() =>
                            navigate(`/purchases/edit/${info.row.original.id}`)
                          }
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Edit</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-green-600"
                          onClick={() => setPostId(info.row.original.id)}
                        >
                          <Send className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Post (Finalize)</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive"
                          onClick={() => setDeleteId(info.row.original.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Delete</TooltipContent>
                    </Tooltip>
                  </>
                )}
              </TooltipProvider>
            </div>
          );
        },
      }),
    ],
    [navigate]
  );

  // --- 4. TABLE INSTANCE ---
  const table = useReactTable({
    data: purchases || [],
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
      {/* HEADER */}
      <section className="page-header">
        <div>
          <h2>Purchase Orders</h2>
          <p className="page-description">
            Manage supplier orders and stock intake.
          </p>
        </div>
        <Button onClick={() => navigate("/purchases/new")}>
          <Plus className="h-4 w-4 mr-2" /> New Purchase
        </Button>
      </section>

      <Separator className="mb-6" />

      {/* SEARCH */}
      <div className="relative max-w-sm mb-6">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search Ref # or Supplier..."
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
                <Skeleton key={i} className="h-12 w-full rounded-md" />
              ))}
            </div>
          ) : (
            <DataTable table={table} />
          )}
        </CardContent>
      </Card>

      {/* VIEW DIALOG */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Purchase Details</DialogTitle>
          </DialogHeader>

          {selectedPurchase && (
            <div className="space-y-6">
              {/* Header Info */}
              <div className="flex justify-between items-center bg-muted/30 p-4 rounded-lg border">
                <div>
                  <h4 className="font-bold text-lg">
                    {selectedPurchase.supplier?.name}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Reference: #{selectedPurchase.referenceNo}
                  </p>
                </div>
                <div className="text-right">
                  <Badge
                    className={
                      selectedPurchase.status ? "bg-green-600" : "bg-secondary"
                    }
                  >
                    {selectedPurchase.status ? "POSTED" : "DRAFT"}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(selectedPurchase.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Items Table (Using UI Table) */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="h-9 font-bold text-xs uppercase">
                        Product
                      </TableHead>
                      <TableHead className="h-9 text-center font-bold text-xs uppercase">
                        Qty
                      </TableHead>
                      <TableHead className="h-9 text-right font-bold text-xs uppercase">
                        Cost
                      </TableHead>
                      <TableHead className="h-9 text-right font-bold text-xs uppercase">
                        Total
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedPurchase.items?.map((item: any, i: number) => (
                      <TableRow key={i}>
                        <TableCell className="py-2 text-sm">
                          {item.product?.name}
                        </TableCell>
                        <TableCell className="py-2 text-center">
                          {item.quantity}
                        </TableCell>
                        <TableCell className="py-2 text-right">
                          ${item.costPrice?.toFixed(2)}
                        </TableCell>
                        <TableCell className="py-2 text-right font-bold">
                          ${item.total?.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Total Footer */}
              <div className="flex justify-end border-t pt-4">
                <div className="flex gap-8 items-center">
                  <span className="text-muted-foreground text-sm uppercase font-bold">
                    Total Amount
                  </span>
                  <span className="text-2xl font-bold text-primary">
                    ${selectedPurchase.totalAmount?.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* CONFIRMATION DIALOGS */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Draft?</AlertDialogTitle>
            <AlertDialogDescription>
              Action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!postId} onOpenChange={() => setPostId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Post Purchase?</AlertDialogTitle>
            <AlertDialogDescription>
              This will update inventory stocks. You cannot edit it afterwards.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => postId && postMutation.mutate(postId)}
              className="bg-green-600 hover:bg-green-700"
            >
              Confirm Post
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
