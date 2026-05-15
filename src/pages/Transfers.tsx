import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Eye,
  Trash2,
  ArrowRight,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Truck,
  Package,
} from "lucide-react";
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  createColumnHelper,
  flexRender,
} from "@tanstack/react-table";

// --- STRICT SHADCN UI IMPORTS ---
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"; // Card UI
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable } from "@/components/ui/data-table"; // <--- Global Data Table
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
} from "@/components/ui/table"; // <--- UI Table Components
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

import { transferApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const columnHelper = createColumnHelper<any>();

export default function Transfers() {
  const navigate = useNavigate();
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [globalFilter, setGlobalFilter] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // --- DATA FETCHING ---
  const { data: transfers, isLoading } = useQuery({
    queryKey: ["transfers"],
    queryFn: () => transferApi.getAll().then((res) => res.data || res),
  });

  // --- MUTATIONS ---
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      transferApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transfers"] });
      toast({ title: "Status updated" });
      setIsViewOpen(false);
    },
    onError: () => toast({ title: "Failed", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: transferApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transfers"] });
      toast({ title: "Deleted successfully" });
      setDeleteId(null);
    },
    onError: () => toast({ title: "Failed to delete", variant: "destructive" }),
  });

  // --- HELPERS ---
  const viewTransfer = (transfer: any) => {
    setSelectedTransfer(transfer);
    setIsViewOpen(true);
  };

  const getStatusColor = (status: string) => {
    const map: Record<string, string> = {
      PENDING:
        "bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-50",
      APPROVED: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50",
      COMPLETED:
        "bg-green-50 text-green-700 border-green-200 hover:bg-green-50",
      REJECTED: "bg-red-50 text-red-700 border-red-200 hover:bg-red-50",
    };
    return map[status] || "bg-secondary";
  };

  const getStatusIcon = (status: string) => {
    const icons: Record<string, any> = {
      PENDING: Clock,
      APPROVED: Truck,
      COMPLETED: CheckCircle,
      REJECTED: XCircle,
    };
    return icons[status] || Clock;
  };

  // --- COLUMNS DEFINITION ---
  const columns = useMemo(
    () => [
      columnHelper.accessor("id", {
        header: "Transfer ID",
        cell: (info) => (
          <span className="font-mono text-xs font-bold">
            #{info.getValue().slice(0, 8)}
          </span>
        ),
      }),
      columnHelper.accessor("createdAt", {
        header: "Date",
        cell: (info) => (
          <span className="text-xs text-muted-foreground">
            {new Date(info.getValue()).toLocaleDateString()}
          </span>
        ),
      }),
      columnHelper.accessor("fromBranch.name", {
        header: "Origin",
        cell: (info) => (
          <Badge variant="outline" className="font-normal text-xs">
            {info.getValue() || "N/A"}
          </Badge>
        ),
      }),
      columnHelper.display({
        id: "arrow",
        cell: () => <ArrowRight className="h-3 w-3 text-muted-foreground" />,
      }),
      columnHelper.accessor("toBranch.name", {
        header: "Destination",
        cell: (info) => (
          <Badge variant="outline" className="font-normal text-xs">
            {info.getValue() || "N/A"}
          </Badge>
        ),
      }),
      columnHelper.accessor("items", {
        header: "Items",
        cell: (info) => (
          <span className="font-medium text-xs">
            {info.getValue()?.length || 0}
          </span>
        ),
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: (info) => {
          const status = info.getValue();
          const Icon = getStatusIcon(status);
          return (
            <Badge
              className={`text-[10px] px-2 py-0.5 pointer-events-none ${getStatusColor(
                status
              )}`}
            >
              <Icon className="h-3 w-3 mr-1" /> {status}
            </Badge>
          );
        },
      }),
      columnHelper.display({
        id: "actions",
        header: "",
        cell: (info) => (
          <div className="flex gap-1 justify-end">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-muted-foreground"
              onClick={() => viewTransfer(info.row.original)}
            >
              <Eye className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-destructive hover:bg-destructive/10"
              disabled={info.row.original.status === "COMPLETED"}
              onClick={() => setDeleteId(info.row.original.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ),
      }),
    ],
    []
  );

  // --- TABLE INSTANCE ---
  const table = useReactTable({
    data: transfers || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    initialState: { pagination: { pageSize: 8 } }, // Set Pagination Size
  });

  return (
    <main className="page-container">
      {/* HEADER */}
      <section className="page-header">
        <div>
          <h2>Transfers</h2>
          <p className="page-description">Track inventory movement.</p>
        </div>
        <Button onClick={() => navigate("/transfers/new")}>
          <Plus className="h-4 w-4 mr-2" /> New Transfer
        </Button>
      </section>

      <Separator className="mb-6" />

      {/* SEARCH */}
      <div className="relative max-w-sm mb-6">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search Transfer ID..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="pl-9 h-9"
        />
      </div>

      {/* MAIN TABLE (Using Reusable DataTable) */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              Loading transfers...
            </div>
          ) : (
            <DataTable table={table} />
          )}
        </CardContent>
      </Card>

      {/* DETAILS DIALOG (Using Shadcn UI only) */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Transfer Details</DialogTitle>
            <DialogDescription>
              Review items and update status.
            </DialogDescription>
          </DialogHeader>

          {selectedTransfer && (
            <div className="space-y-6">
              {/* Info Cards (No raw divs) */}
              <div className="grid grid-cols-3 gap-4">
                <Card className="bg-muted/40 shadow-none border-0">
                  <CardContent className="p-3 space-y-1">
                    <Label className="text-[10px] uppercase text-muted-foreground font-bold">
                      Transfer ID
                    </Label>
                    <p className="font-mono text-sm font-bold">
                      #{selectedTransfer.id.slice(0, 8)}
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-muted/40 shadow-none border-0">
                  <CardContent className="p-3 space-y-1">
                    <Label className="text-[10px] uppercase text-muted-foreground font-bold">
                      Origin
                    </Label>
                    <p className="text-sm font-medium">
                      {selectedTransfer.fromBranch?.name}
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-muted/40 shadow-none border-0">
                  <CardContent className="p-3 space-y-1">
                    <Label className="text-[10px] uppercase text-muted-foreground font-bold">
                      Destination
                    </Label>
                    <p className="text-sm font-medium">
                      {selectedTransfer.toBranch?.name}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Items List (Using UI Table) */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="h-9 text-xs font-bold uppercase">
                        Product
                      </TableHead>
                      <TableHead className="h-9 text-right text-xs font-bold uppercase">
                        Quantity
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedTransfer.items?.map((item: any, i: number) => (
                      <TableRow key={i} className="hover:bg-transparent">
                        <TableCell className="py-2 flex items-center gap-2">
                          <div className="p-1 bg-primary/10 rounded">
                            <Package className="h-3 w-3 text-primary" />
                          </div>
                          <span className="text-sm font-medium">
                            {item.name || item.product?.name}
                          </span>
                        </TableCell>
                        <TableCell className="py-2 text-right font-mono">
                          {item.quantity}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Actions Footer */}
              <DialogFooter>
                {selectedTransfer.status === "PENDING" && (
                  <>
                    <Button
                      variant="outline"
                      className="text-destructive border-destructive/20 hover:bg-destructive/10"
                      onClick={() =>
                        updateStatusMutation.mutate({
                          id: selectedTransfer.id,
                          status: "REJECTED",
                        })
                      }
                    >
                      Reject
                    </Button>
                    <Button
                      onClick={() =>
                        updateStatusMutation.mutate({
                          id: selectedTransfer.id,
                          status: "APPROVED",
                        })
                      }
                    >
                      <Truck className="h-4 w-4 mr-2" /> Approve & Send
                    </Button>
                  </>
                )}
                {selectedTransfer.status === "APPROVED" && (
                  <Button
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={() =>
                      updateStatusMutation.mutate({
                        id: selectedTransfer.id,
                        status: "COMPLETED",
                      })
                    }
                  >
                    <CheckCircle className="h-4 w-4 mr-2" /> Mark Received
                  </Button>
                )}
                {(selectedTransfer.status === "COMPLETED" ||
                  selectedTransfer.status === "REJECTED") && (
                  <Button
                    variant="secondary"
                    disabled
                    className="w-full sm:w-auto"
                  >
                    Action Closed
                  </Button>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* DELETE DIALOG */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Transfer?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
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
