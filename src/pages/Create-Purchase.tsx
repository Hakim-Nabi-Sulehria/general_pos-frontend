import { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  Box,
  Truck,
  FileText,
  User,
  Building2,
  Trash2,
  Plus,
  Check,
  MoreVertical,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { purchaseApi, supplierApi, branchApi, productApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

// --- Types ---
interface PurchaseItem {
  productId: string;
  productName?: string;
  quantity: number;
  costprice: number;
  Discount: number;
  discountType: "percentage" | "fixed";
}

export default function CreatePurchase() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // --- Form State ---
  const [supplierId, setSupplierId] = useState("");
  const [branchIds, setBranchIds] = useState<string[]>([]);
  const [status, setStatus] = useState("received");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [notes, setNotes] = useState("");

  // Financials
  const [shippingCost, setShippingCost] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);

  // UI State
  const [branchOpen, setBranchOpen] = useState(false);
  const [items, setItems] = useState<PurchaseItem[]>([]);

  // --- Data Fetching ---
  const { data: suppliers } = useQuery({
    queryKey: ["suppliers"],
    queryFn: supplierApi.getAll,
  });
  const { data: branches } = useQuery({
    queryKey: ["branches"],
    queryFn: branchApi.getAll,
  });
  const { data: products } = useQuery({
    queryKey: ["products"],
    queryFn: productApi.getAll,
  });

  // --- Mutation ---
  const createMutation = useMutation({
    mutationFn: purchaseApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
      toast({
        title: "Invoice Saved",
        description: "System generated timestamp automatically.",
      });
      navigate("/purchases");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to save.",
        variant: "destructive",
      });
    },
  });

  // --- Logic ---
  const addItem = () => {
    setItems([
      ...items,
      {
        productId: "",
        quantity: 1,
        costprice: 0,
        Discount: 0,
        discountType: "percentage",
      },
    ]);
  };

  const removeItem = (index: number) =>
    setItems(items.filter((_, i) => i !== index));

  const updateItem = (index: number, field: keyof PurchaseItem, value: any) => {
    const newItems = [...items];
    if (field === "productId") {
      const product = products?.data?.find((p: any) => p.id === value);
      if (product) {
        newItems[index].productName = product.name;
        newItems[index].costprice = product.cost || 0;
      }
    }
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const calculations = useMemo(() => {
    let subtotal = 0;
    let totalDiscount = 0;
    items.forEach((item) => {
      const lineTotal = item.quantity * item.costprice;
      subtotal += lineTotal;
      totalDiscount +=
        item.discountType === "percentage"
          ? (lineTotal * item.Discount) / 100
          : item.Discount;
    });
    const grandTotal = subtotal - totalDiscount + shippingCost + taxAmount;
    return { subtotal, totalDiscount, grandTotal };
  }, [items, shippingCost, taxAmount]);

  const handleSubmit = () => {
    if (
      !supplierId ||
      branchIds.length === 0 ||
      items.length === 0 ||
      !invoiceNo
    ) {
      toast({
        title: "Incomplete Data",
        description: "Supplier, Branch, Invoice # and Items are required.",
        variant: "destructive",
      });
      return;
    }

    // AUTOMATIC DATE GENERATION HERE
    const currentDate = new Date();

    createMutation.mutate({
      supplierId,
      branchIds,
      status: status === "received",
      referenceNo: invoiceNo,
      orderDate: currentDate, // Automatic Date
      expectedDate: currentDate, // Same date or handle in backend
      notes,
      shippingCost,
      tax: taxAmount,
      items: items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        costprice: i.costprice,
        Discount:
          i.discountType === "percentage" ? i.Discount / 100 : i.Discount,
      })),
    });
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* --- TOP BAR --- */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-full hover:bg-slate-100"
          >
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </Button>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              Record Supplier Invoice
            </h1>
            <p className="text-xs text-slate-500">
              Date & Time will be recorded automatically upon saving.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="hidden sm:flex"
            onClick={() => navigate("/purchases")}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 px-6"
          >
            {createMutation.isPending ? "Saving..." : "Generate & Save"}
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* --- SECTION 1: GENERAL INFO (Full Width Now) --- */}
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-slate-50/50 px-6 py-3 border-b border-slate-100 flex items-center gap-2">
            <FileText className="h-4 w-4 text-slate-500" />
            <span className="text-sm font-semibold text-slate-700">
              Invoice General Info
            </span>
          </div>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Supplier */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Supplier <span className="text-red-600">*</span>
                </Label>
                <Select value={supplierId} onValueChange={setSupplierId}>
                  <SelectTrigger className="bg-slate-50 border-slate-200 h-10">
                    <SelectValue placeholder="Select Supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers?.data?.map((s: any) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Branch */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Branch (Stock In) <span className="text-red-600">*</span>
                </Label>
                <Popover open={branchOpen} onOpenChange={setBranchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between h-10 bg-slate-50 border-slate-200 text-slate-700 font-normal"
                    >
                      {branchIds.length > 0
                        ? `${branchIds.length} Selected`
                        : "Select Branches"}
                      <MoreVertical className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0">
                    <Command>
                      <CommandInput placeholder="Search branch..." />
                      <CommandList>
                        <CommandEmpty>No branch found.</CommandEmpty>
                        <CommandGroup>
                          {branches?.data?.map((branch: any) => {
                            const isSelected = branchIds.includes(branch.id);
                            return (
                              <CommandItem
                                key={branch.id}
                                value={branch.name}
                                onSelect={() =>
                                  setBranchIds((prev) =>
                                    isSelected
                                      ? prev.filter((id) => id !== branch.id)
                                      : [...prev, branch.id]
                                  )
                                }
                              >
                                <div
                                  className={cn(
                                    "mr-2 flex h-4 w-4 items-center justify-center border rounded-sm",
                                    isSelected
                                      ? "bg-blue-600 border-blue-600 text-white"
                                      : "opacity-50"
                                  )}
                                >
                                  <Check className="h-3 w-3" />
                                </div>
                                {branch.name}
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Invoice No */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Supplier Invoice # <span className="text-red-600">*</span>
                </Label>
                <Input
                  placeholder="e.g. INV-8829"
                  className="bg-slate-50 border-slate-200"
                  value={invoiceNo}
                  onChange={(e) => setInvoiceNo(e.target.value)}
                />
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Payment Status
                </Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="bg-slate-50 border-slate-200 h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="received">Received / Unpaid</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="partially_paid">
                      Partially Paid
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* --- SECTION 2: ITEMS TABLE --- */}
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-white px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Box className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-slate-800">
                Billed Items
              </h3>
            </div>
            <Button
              size="sm"
              onClick={addItem}
              className="bg-slate-900 text-white hover:bg-slate-800"
            >
              <Plus className="h-4 w-4 mr-2" /> Add Item
            </Button>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="w-[50px] text-center">#</TableHead>
                  <TableHead className="w-[30%]">Product</TableHead>
                  <TableHead className="w-[15%]">Billed Qty</TableHead>
                  <TableHead className="w-[15%]">Unit Cost</TableHead>
                  <TableHead className="w-[20%]">Discount</TableHead>
                  <TableHead className="w-[15%] text-right pr-6">
                    Total
                  </TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="h-32 text-center text-muted-foreground"
                    >
                      No items entered. Refer to the invoice and add items.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item, index) => {
                    const lineTotal =
                      item.quantity * item.costprice -
                      (item.discountType === "percentage"
                        ? (item.quantity * item.costprice * item.Discount) / 100
                        : item.Discount);
                    return (
                      <TableRow
                        key={index}
                        className="hover:bg-slate-50/50 group"
                      >
                        <TableCell className="text-center text-xs text-slate-400">
                          {index + 1}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={item.productId}
                            onValueChange={(val) =>
                              updateItem(index, "productId", val)
                            }
                          >
                            <SelectTrigger className="border-transparent hover:border-slate-200 bg-transparent h-auto py-2 px-2 font-medium">
                              <SelectValue placeholder="Select Product" />
                            </SelectTrigger>
                            <SelectContent>
                              {products?.data?.map((p: any) => (
                                <SelectItem key={p.id} value={p.id}>
                                  {p.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="1"
                            className="h-8 w-24 mx-auto text-center"
                            value={item.quantity}
                            onChange={(e) =>
                              updateItem(
                                index,
                                "quantity",
                                parseInt(e.target.value) || 0
                              )
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            className="h-8 w-28"
                            value={item.costprice}
                            onChange={(e) =>
                              updateItem(
                                index,
                                "costprice",
                                parseFloat(e.target.value) || 0
                              )
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              className="h-8 w-20"
                              placeholder="0"
                              value={item.Discount}
                              onChange={(e) =>
                                updateItem(
                                  index,
                                  "Discount",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-2"
                              onClick={() =>
                                updateItem(
                                  index,
                                  "discountType",
                                  item.discountType === "percentage"
                                    ? "fixed"
                                    : "percentage"
                                )
                              }
                            >
                              {item.discountType === "percentage" ? "%" : "$"}
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-right pr-6 font-semibold text-slate-700">
                          ${lineTotal.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-red-600"
                            onClick={() => removeItem(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* --- SECTION 3: INVOICE FOOTER (TAX & TOTALS) --- */}
        <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
          {/* Notes / Remarks */}
          <div className="w-full lg:w-1/2">
            <Label className="text-xs text-slate-500 mb-2 block">
              Remarks / Notes
            </Label>
            <Textarea
              placeholder="Enter any extra details mentioned on the invoice..."
              className="bg-white border-slate-200 resize-none h-[150px]"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Calculation Box */}
          <div className="w-full lg:w-1/3 bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-3">
            <div className="flex justify-between text-sm text-slate-600">
              <span>Subtotal</span>
              <span>${calculations.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-600">
              <span>Total Discount</span>
              <span className="text-red-500">
                - ${calculations.totalDiscount.toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between items-center text-sm text-slate-600">
              <span>Tax / VAT</span>
              <div className="w-24">
                <Input
                  type="number"
                  className="h-8 text-right bg-slate-50 border-slate-200"
                  value={taxAmount}
                  onChange={(e) =>
                    setTaxAmount(parseFloat(e.target.value) || 0)
                  }
                />
              </div>
            </div>

            <div className="flex justify-between items-center text-sm text-slate-600">
              <span>Shipping</span>
              <div className="w-24">
                <Input
                  type="number"
                  className="h-8 text-right bg-slate-50 border-slate-200"
                  value={shippingCost}
                  onChange={(e) =>
                    setShippingCost(parseFloat(e.target.value) || 0)
                  }
                />
              </div>
            </div>

            <Separator />

            <div className="flex justify-between items-center pt-2">
              <span className="font-bold text-lg text-slate-800">
                Invoice Total
              </span>
              <span className="font-bold text-2xl text-blue-600">
                ${calculations.grandTotal.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
