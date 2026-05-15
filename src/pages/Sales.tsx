import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Eye,
  Printer,
  RotateCcw,
  Calendar,
  User,
  CreditCard,
  ShoppingBag,
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card"; // Wrapper
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable } from "@/components/ui/data-table"; // <--- Global Data Table
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { saleApi } from "@/lib/api";

const columnHelper = createColumnHelper<any>();

// --- INVOICE VIEW COMPONENT (Using UI Components) ---
const InvoiceView = ({ sale }: { sale: any }) => {
  if (!sale) return null;

  const refundedAmount =
    sale.returns?.reduce((sum: number, ret: any) => sum + ret.totalRefund, 0) ||
    0;
  const netFinalAmount = sale.finalAmount - refundedAmount;

  return (
    <Card className="border-0 shadow-none">
      <CardContent className="p-6 text-sm space-y-6">
        {/* Header */}
        <div className="text-center space-y-1">
          <h2 className="text-lg font-bold uppercase tracking-wider">
            {sale.branch?.name || "POS System"}
          </h2>
          <p className="text-muted-foreground text-xs">
            Invoice #: {sale.invoiceNo}
          </p>
          <p className="text-muted-foreground text-xs">
            {format(new Date(sale.createdAt), "PPp")}
          </p>
        </div>

        <Separator />

        {/* Customer Info */}
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Customer:</span>
            <span className="font-medium">
              {sale.customerName || "Walk-in"}
            </span>
          </div>
          {sale.customerPhone && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Phone:</span>
              <span>{sale.customerPhone}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Payment:</span>
            <Badge variant="outline" className="text-[10px] h-4 px-1">
              {sale.paymentMethod}
            </Badge>
          </div>
        </div>

        <Separator />

        {/* Items List (Simple Div Layout for Invoice Look) */}
        <div className="space-y-3">
          <div className="flex text-xs font-bold text-muted-foreground border-b pb-2">
            <span className="flex-1">Item</span>
            <span className="w-10 text-center">Qty</span>
            <span className="w-16 text-right">Total</span>
          </div>
          {sale.items.map((item: any) => (
            <div key={item.id} className="flex text-xs py-1">
              <div className="flex-1">
                <p>{item.product?.name}</p>
                <p className="text-[10px] text-muted-foreground">
                  @ ${item.unitPrice}
                </p>
              </div>
              <div className="w-10 text-center">{item.quantity}</div>
              <div className="w-16 text-right">${item.subTotal.toFixed(2)}</div>
            </div>
          ))}
        </div>

        <Separator />

        {/* Totals */}
        <div className="space-y-1 text-right pt-2">
          <div className="flex justify-between text-xs">
            <span>Subtotal:</span>
            <span>${sale.totalAmount.toFixed(2)}</span>
          </div>
          {sale.discountAmount > 0 && (
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Discount:</span>
              <span>-${sale.discountAmount.toFixed(2)}</span>
            </div>
          )}
          {refundedAmount > 0 && (
            <div className="flex justify-between text-xs text-destructive font-medium">
              <span>Refunded:</span>
              <span>-${refundedAmount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-bold pt-2 border-t mt-2">
            <span>Total Paid:</span>
            <span>${netFinalAmount.toFixed(2)}</span>
          </div>
        </div>

        <div className="text-center text-[10px] text-muted-foreground pt-4">
          <p>Thank you for your business!</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default function Sales() {
  const { data: sales, isLoading } = useQuery({
    queryKey: ["sales"],
    queryFn: () => saleApi.getAll().then((res) => res.data || res),
  });

  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");

  const handleViewInvoice = (sale: any) => {
    setSelectedSale(sale);
    setIsInvoiceOpen(true);
  };

  const handlePrint = () => {
    window.print();
  };

  // --- COLUMNS DEFINITION ---
  const columns = useMemo(
    () => [
      // Invoice #
      columnHelper.accessor("invoiceNo", {
        header: "Invoice #",
        cell: (info) => (
          <span className="font-mono text-xs font-bold">{info.getValue()}</span>
        ),
      }),

      // Date
      columnHelper.accessor("createdAt", {
        header: "Date",
        cell: (info) => (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {format(new Date(info.getValue()), "PPp")}
          </div>
        ),
      }),

      // Customer
      columnHelper.accessor("customerName", {
        header: "Customer",
        cell: (info) => (
          <div className="flex flex-col">
            <span className="text-sm font-medium">
              {info.getValue() || "Walk-in"}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {info.row.original.customerPhone}
            </span>
          </div>
        ),
      }),

      // Branch
      columnHelper.accessor("branch.name", {
        header: "Branch",
        cell: (info) => (
          <Badge variant="outline" className="text-[10px] font-normal">
            {info.getValue()}
          </Badge>
        ),
      }),

      // Items Count
      columnHelper.accessor("items", {
        header: "Items",
        cell: (info) => (
          <span className="text-xs">{info.getValue()?.length || 0} items</span>
        ),
      }),

      // Status (Return Logic)
      columnHelper.accessor("status", {
        // Virtual column for status
        header: "Status",
        cell: (info) => {
          const sale = info.row.original;
          const refunded =
            sale.returns?.reduce(
              (sum: number, ret: any) => sum + ret.totalRefund,
              0
            ) || 0;

          if (refunded >= sale.finalAmount)
            return (
              <Badge variant="destructive" className="text-[10px] h-5 px-1.5">
                <RotateCcw className="h-3 w-3 mr-1" /> Returned
              </Badge>
            );
          if (refunded > 0)
            return (
              <Badge
                variant="secondary"
                className="text-yellow-600 bg-yellow-50 border-yellow-200 text-[10px] h-5 px-1.5"
              >
                Partial Return
              </Badge>
            );
          return (
            <Badge
              variant="default"
              className="bg-green-600 hover:bg-green-700 text-[10px] h-5 px-1.5"
            >
              Completed
            </Badge>
          );
        },
      }),

      // Payment Method
      columnHelper.accessor("paymentMethod", {
        header: "Payment",
        cell: (info) => (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CreditCard className="h-3 w-3" />
            {info.getValue()}
          </div>
        ),
      }),

      // Net Total (Bold)
      columnHelper.accessor("finalAmount", {
        header: "Total",
        cell: (info) => {
          const sale = info.row.original;
          const refunded =
            sale.returns?.reduce(
              (sum: number, ret: any) => sum + ret.totalRefund,
              0
            ) || 0;
          const net = sale.finalAmount - refunded;

          return (
            <div className="flex flex-col items-end">
              <span className="font-bold text-sm">${net.toFixed(2)}</span>
              {refunded > 0 && (
                <span className="text-[10px] text-destructive line-through">
                  ${sale.finalAmount}
                </span>
              )}
            </div>
          );
        },
      }),

      // Actions
      columnHelper.display({
        id: "actions",
        header: "",
        cell: (info) => (
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground"
              onClick={() => handleViewInvoice(info.row.original)}
            >
              <Eye className="h-3.5 w-3.5" />
            </Button>
          </div>
        ),
      }),
    ],
    []
  );

  // --- TABLE INSTANCE ---
  const table = useReactTable({
    data: sales || [],
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
          <h2>Sales History</h2>
          <p className="page-description">
            View all transaction records and invoices.
          </p>
        </div>
      </section>

      <Separator className="mb-6" />

      {/* SEARCH */}
      <div className="relative max-w-sm mb-6">
        <ShoppingBag className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search invoice # or customer..."
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

      {/* INVOICE DIALOG */}
      <Dialog open={isInvoiceOpen} onOpenChange={setIsInvoiceOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden bg-muted/10 gap-0">
          <div className="max-h-[80vh] overflow-y-auto p-4">
            <InvoiceView sale={selectedSale} />
          </div>
          <div className="p-4 bg-background border-t flex gap-2 justify-center">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" /> Print
            </Button>
            <Button onClick={() => setIsInvoiceOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
