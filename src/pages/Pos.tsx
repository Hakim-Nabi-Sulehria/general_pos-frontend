import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  ShoppingCart,
  Minus,
  Plus,
  Trash2,
  Printer,
  Store,
  LayoutGrid,
  ChevronRight,
  ShoppingBag,
  ScanLine,
  TicketPercent, // Coupon Icon
  X,
  Loader2,
  AlertTriangle,
  DollarSign,
} from "lucide-react";
import {
  productApi,
  branchApi,
  organizationApi,
  discountApi,
  saleApi,
  cashRequestApi,
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn, asArray } from "@/lib/utils";
import { Card } from "@/components/ui/card";

// --- 1. RECEIPT TEMPLATE (Includes Coupon/Discount details) ---
export const InvoiceTemplate = ({ sale }: { sale: any }) => {
  if (!sale) return null;

  return (
    <div className="bg-white text-slate-900 font-mono text-sm max-w-[380px] mx-auto relative overflow-hidden">
      <div className="h-2 bg-slate-900 w-full" />
      <div className="p-6 pb-2">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center h-12 w-12 bg-slate-900 text-white rounded-full mb-3 shadow-xl">
            <Store className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tighter leading-none">
            {sale.branch?.name || "POS STORE"}
          </h2>
          <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest">
            Official Receipt
          </p>
        </div>

        {/* Info Grid */}
        <div className="border-y-2 border-slate-100 py-3 mb-4 space-y-1">
          <div className="flex justify-between text-[11px]">
            <span className="text-slate-400">INVOICE NO</span>
            <span className="font-bold font-mono">#{sale.invoiceNo}</span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span className="text-slate-400">DATE</span>
            <span className="font-bold">
              {new Date(sale.createdAt).toLocaleDateString()}{" "}
              {new Date(sale.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-4">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-dashed border-slate-200">
                <th className="text-left py-1 font-normal w-[50%]">ITEM</th>
                <th className="text-center py-1 font-normal w-[20%]">QTY</th>
                <th className="text-right py-1 font-normal w-[30%]">AMT</th>
              </tr>
            </thead>
            <tbody className="font-medium">
              {sale.items.map((item: any) => (
                <tr key={item.id}>
                  <td className="py-2 pr-1 align-top">
                    <div className="leading-tight">
                      {item.product?.name || item.productName}
                    </div>
                  </td>
                  <td className="text-center py-2 align-top text-slate-500">
                    x{item.quantity}
                  </td>
                  <td className="text-right py-2 align-top font-bold">
                    ${item.subTotal.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-slate-50 p-6 pt-4">
        <div className="space-y-1 mb-4">
          <div className="flex justify-between text-xs text-slate-500">
            <span>Subtotal</span>
            <span>${sale.totalAmount.toFixed(2)}</span>
          </div>

          {/* Discounts/Coupons in Receipt */}
          {sale.discountAmount > 0 && (
            <div className="flex justify-between text-xs text-slate-500">
              <span>Auto Discount</span>
              <span>-${sale.discountAmount.toFixed(2)}</span>
            </div>
          )}

          {sale.couponDiscount > 0 && (
            <div className="flex justify-between text-xs text-slate-500">
              <span>Coupon ({sale.couponCode})</span>
              <span>-${sale.couponDiscount.toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between items-center text-lg font-black border-t-2 border-slate-900 pt-2 mt-2">
            <span>TOTAL</span>
            <span>${sale.finalAmount.toFixed(2)}</span>
          </div>

          {/* Cash Details */}
          {sale.paymentMethod === "CASH" && (
            <div className="pt-2 mt-2 border-t border-dashed border-slate-300 space-y-1">
              <div className="flex justify-between text-xs font-bold text-slate-600">
                <span>CASH RECEIVED</span>
                <span>${Number(sale.amountReceived || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-black text-slate-800">
                <span>CHANGE DUE</span>
                <span>${Number(sale.changeAmount || 0).toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>

        <div className="text-center opacity-70 mt-6">
          <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">
            Thank you for shopping!
          </p>
          <ScanLine className="h-8 w-full text-slate-800" />
        </div>
      </div>
    </div>
  );
};

// --- 2. POS COMPONENT ---
export default function POS() {
  // Basic States
  const [selectedOrg, setSelectedOrg] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<any[]>([]);

  // --- DISCOUNT & COUPON STATES (Preserved) ---
  const [applyDiscount, setApplyDiscount] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Checkout States
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [lastSale, setLastSale] = useState<any>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");

  // Cash Calculation States
  const [cashReceived, setCashReceived] = useState("");
  const [changeAmount, setChangeAmount] = useState(0);

  // Request Modal States
  const [isRequestCashOpen, setIsRequestCashOpen] = useState(false);
  const [requestAmount, setRequestAmount] = useState("");
  const [requestReason, setRequestReason] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // --- QUERIES ---
  const { data: orgs } = useQuery({
    queryKey: ["organizations"],
    queryFn: async () => {
      const res = await organizationApi.getAll();
      return asArray(res.data ?? res);
    },
  });
  const { data: branches } = useQuery({
    queryKey: ["branches"],
    queryFn: async () => {
      const res = await branchApi.getAll();
      return asArray(res.data ?? res);
    },
  });
  const { data: products } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const res = await productApi.getAll();
      return asArray(res.data ?? res);
    },
  });
  const { data: activeDiscounts } = useQuery({
    queryKey: ["activeDiscounts"],
    queryFn: async () => {
      const res = await discountApi.getActive();
      return asArray(res.data ?? res);
    },
  });

  // Get Drawer Balance
  const { data: currentBranchData } = useQuery({
    queryKey: ["branch-details", selectedBranch],
    queryFn: () => branchApi.getById(selectedBranch),
    enabled: !!selectedBranch,
  });
  const branchBalance = currentBranchData?.data?.cashBalance || 0;

  // --- FILTER & CALCULATIONS ---
  const filteredProducts = useMemo(() => {
    if (!selectedBranch) return [];
    const list = asArray<Record<string, unknown>>(products);
    return list.filter((p: any) => {
      const isLinkedToBranch = p.branchId === selectedBranch;
      const matchesSearch = (p.name ?? "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      return isLinkedToBranch && matchesSearch && p.stockQuantity > 0;
    });
  }, [products, selectedBranch, searchQuery]);

  const cartSummary = useMemo(() => {
    let subtotal = 0,
      autoDiscountTotal = 0;
    const itemsWithCalc = cart.map((item) => {
      const price = Number(item.price) || 0;
      const quantity = Number(item.quantity) || 0;
      const itemTotal = price * quantity;
      subtotal += itemTotal;

      // Auto Discount Logic
      let itemDiscount = 0;
      if (applyDiscount && activeDiscounts?.length) {
        const applicable = activeDiscounts.find(
          (d: any) =>
            d.scope === "GLOBAL" ||
            d.products?.some((p: any) => p.id === item.id)
        );
        if (applicable) {
          itemDiscount =
            applicable.type === "PERCENTAGE"
              ? (itemTotal * applicable.value) / 100
              : applicable.value * quantity;
        }
      }
      autoDiscountTotal += itemDiscount;
      return { ...item, lineTotal: itemTotal, lineDiscount: itemDiscount };
    });

    // Coupon Logic
    let couponDiscount = 0;
    const taxableAmount = Math.max(0, subtotal - autoDiscountTotal);
    if (appliedCoupon) {
      couponDiscount =
        appliedCoupon.type === "PERCENTAGE"
          ? (taxableAmount * appliedCoupon.value) / 100
          : appliedCoupon.value;
      if (couponDiscount > taxableAmount) couponDiscount = taxableAmount;
    }

    const finalTotal = Math.max(
      0,
      subtotal - autoDiscountTotal - couponDiscount
    );
    return {
      items: itemsWithCalc,
      subtotal,
      autoDiscountTotal,
      couponDiscount,
      finalTotal,
    };
  }, [cart, applyDiscount, activeDiscounts, appliedCoupon]);

  // Calculate Change
  useEffect(() => {
    if (paymentMethod === "CASH" && cashReceived) {
      const received = Number(cashReceived);
      setChangeAmount(received - cartSummary.finalTotal);
    } else {
      setChangeAmount(0);
    }
  }, [cashReceived, cartSummary.finalTotal, paymentMethod]);

  // --- HANDLERS ---
  const addToCart = (product: any) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stockQuantity) return prev; // Limit check
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        { ...product, price: Number(product.price) || 0, quantity: 1 },
      ];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item
      )
    );
  };
  const removeFromCart = (id: string) =>
    setCart((prev) => prev.filter((item) => item.id !== id));

  // --- COUPON HANDLERS ---
  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    setIsValidating(true);
    try {
      const response = await discountApi.validate(couponCode);
      if (response.data && response.data.success) {
        setAppliedCoupon(response.data.data);
        toast({ title: "Coupon Applied!" });
      }
    } catch (error: any) {
      toast({ title: "Invalid Coupon", variant: "destructive" });
      setAppliedCoupon(null);
    } finally {
      setIsValidating(false);
    }
  };
  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
  };

  // --- CHECKOUT LOGIC WITH DRAWER CHECK ---
  const handleConfirmPayment = () => {
    // Logic: Agar Cash hai aur Change dena hai, to Drawer check hoga.
    if (paymentMethod === "CASH") {
      const received = Number(cashReceived);

      // 1. Customer ne paise kam diye
      if (received < cartSummary.finalTotal) {
        toast({ title: "Insufficient Payment", variant: "destructive" });
        return;
      }

      // 2. DRAWER CHECK (Strict)
      // Agar Change (Baqaya) dena hai, aur wo Branch Balance se zyada hai
      // Example: Bill 200, Given 1000, Change 800. Drawer has 500. -> BLOCKED.
      if (changeAmount > 0 && changeAmount > branchBalance) {
        toast({
          title: "Drawer Empty / Low Funds!",
          description: `Cannot return $${changeAmount}. Drawer only has $${branchBalance}.`,
          variant: "destructive",
        });
        setIsRequestCashOpen(true); // Open Request Modal
        return; // STOP EXECUTION
      }
    }

    // Proceed if all checks pass
    checkoutMutation.mutate({
      branchId: selectedBranch,
      customerName: customerName || "Walk-in Customer",
      customerPhone,
      totalAmount: cartSummary.subtotal,
      discountAmount: cartSummary.autoDiscountTotal,
      couponCode: appliedCoupon ? appliedCoupon.code : null,
      couponDiscount: cartSummary.couponDiscount,
      finalAmount: cartSummary.finalTotal,
      paymentMethod,
      items: cartSummary.items.map((item) => ({
        productId: item.id,
        quantity: item.quantity,
        unitPrice: item.price,
        subTotal: item.lineTotal - item.lineDiscount,
      })),
    });
  };

  const checkoutMutation = useMutation({
    mutationFn: saleApi.create,
    onSuccess: (response) => {
      toast({ title: "Order Placed! 🚀" });
      const saleData = response.data || response;

      // Receipt Data Preparation
      setLastSale({
        ...saleData,
        amountReceived: paymentMethod === "CASH" ? Number(cashReceived) : 0,
        changeAmount: paymentMethod === "CASH" ? changeAmount : 0,
      });

      // Reset UI
      setCart([]);
      setApplyDiscount(false);
      setAppliedCoupon(null);
      setCouponCode("");
      setCustomerName("");
      setCustomerPhone("");
      setPaymentMethod("CASH");
      setCashReceived("");
      setChangeAmount(0);

      // Refresh Balance & Products
      queryClient.invalidateQueries({ queryKey: ["branch-details"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });

      setIsCheckoutOpen(false);
      setIsInvoiceOpen(true);
    },
    onError: () => toast({ title: "Failed", variant: "destructive" }),
  });

  const requestCashMutation = useMutation({
    mutationFn: cashRequestApi.create,
    onSuccess: () => {
      toast({ title: "Request Sent" });
      setIsRequestCashOpen(false);
      setRequestAmount("");
      setRequestReason("");
    },
  });

  return (
    <div className="h-screen w-full bg-slate-100 font-sans flex flex-col overflow-hidden">
      {/* HEADER */}
      <header className="flex-none bg-white border-b px-4 py-2 flex justify-between items-center h-14 shadow-sm z-30">
        <div className="flex items-center gap-3">
          <div className="bg-slate-900 p-1.5 rounded-lg text-white">
            <LayoutGrid className="h-5 w-5" />
          </div>
          <h1 className="text-lg font-black text-slate-800">POS</h1>
        </div>
        <div className="flex items-center gap-4">
          {/* DRAWER BALANCE */}
          {selectedBranch && (
            <div
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-md border text-xs font-bold",
                branchBalance <= 100
                  ? "bg-red-50 border-red-200 text-red-700"
                  : "bg-emerald-50 border-emerald-200 text-emerald-700"
              )}
            >
              <DollarSign className="h-3.5 w-3.5" />
              <span>Drawer: ${branchBalance.toLocaleString()}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 ml-1"
                onClick={() => setIsRequestCashOpen(true)}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          )}
          <div className="flex gap-2">
            <Select value={selectedOrg} onValueChange={setSelectedOrg}>
              <SelectTrigger className="w-[140px] h-9 text-xs">
                <SelectValue placeholder="Org" />
              </SelectTrigger>
              <SelectContent>
                {(orgs ?? []).map((o: any) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={selectedBranch}
              onValueChange={setSelectedBranch}
              disabled={!selectedOrg}
            >
              <SelectTrigger className="w-[140px] h-9 text-xs">
                <SelectValue placeholder="Branch" />
              </SelectTrigger>
              <SelectContent>
                {(branches ?? [])
                  .filter(
                    (b: any) =>
                      !selectedOrg || b.organizationId === selectedOrg
                  )
                  .map((b: any) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      {/* BODY */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT: PRODUCTS */}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
          <div className="p-4 border-b bg-white z-20">
            <div className="relative max-w-xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search items..."
                className="pl-10 h-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 pb-20">
              {filteredProducts.map((product: any) => (
                <Card
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="cursor-pointer hover:shadow-lg transition-all p-3 border-0 shadow-sm bg-white"
                >
                  <div className="text-center py-4 text-3xl">📦</div>
                  <h3 className="font-bold text-sm truncate">{product.name}</h3>
                  <div className="flex justify-between mt-2 font-black text-slate-800">
                    <span>${Number(product.price).toFixed(2)}</span>
                    <Plus className="h-4 w-4 bg-slate-100 rounded-full p-0.5" />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: CART & DISCOUNTS */}
        <div className="w-[380px] bg-white border-l flex flex-col shadow-xl z-30 h-full">
          <div className="p-3 bg-slate-900 text-white flex justify-between items-center">
            <span className="font-bold flex gap-2">
              <ShoppingCart className="h-4 w-4" /> Sale
            </span>
            <Badge className="bg-white/20 text-[10px]">
              {cart.length} Items
            </Badge>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-slate-50">
            {cartSummary.items.map((item) => (
              <div
                key={item.id}
                className="bg-white p-2 rounded border flex justify-between"
              >
                <div>
                  <p className="font-bold text-xs">{item.name}</p>
                  <p className="text-[10px] text-slate-500">
                    ${item.price} x {item.quantity}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm">
                    ${(item.lineTotal - item.lineDiscount).toFixed(2)}
                  </p>
                  <div className="flex gap-1 mt-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-5 w-5"
                      onClick={() => updateQty(item.id, -1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-5 w-5"
                      onClick={() => updateQty(item.id, 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-5 w-5 text-red-500"
                      onClick={() => removeFromCart(item.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* CART FOOTER WITH COUPON/DISCOUNT INPUTS */}
          <div className="p-3 bg-white border-t space-y-3 shadow-[0_-5px_10px_rgba(0,0,0,0.05)] z-20">
            <div className="space-y-2 text-xs">
              {/* Auto Discount Checkbox */}
              <div className="flex items-center gap-2">
                <Checkbox
                  id="ad"
                  checked={applyDiscount}
                  onCheckedChange={(c) => setApplyDiscount(!!c)}
                />
                <Label htmlFor="ad" className="cursor-pointer">
                  Apply Auto-Discounts
                </Label>
              </div>

              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${cartSummary.subtotal.toFixed(2)}</span>
              </div>
              {cartSummary.autoDiscountTotal > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Auto Disc</span>
                  <span>-${cartSummary.autoDiscountTotal.toFixed(2)}</span>
                </div>
              )}
              {cartSummary.couponDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Coupon</span>
                  <span>-${cartSummary.couponDiscount.toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* Coupon Input */}
            <div className="flex gap-2">
              {appliedCoupon ? (
                <div className="flex items-center justify-between w-full bg-green-50 p-2 rounded border border-green-200">
                  <span className="text-xs font-bold text-green-700">
                    {appliedCoupon.code}
                  </span>
                  <X
                    className="h-4 w-4 cursor-pointer text-green-700"
                    onClick={removeCoupon}
                  />
                </div>
              ) : (
                <>
                  <Input
                    placeholder="PROMO CODE"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="h-9 text-xs uppercase"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9"
                    onClick={handleApplyCoupon}
                    disabled={isValidating}
                  >
                    {isValidating ? (
                      <Loader2 className="animate-spin h-3 w-3" />
                    ) : (
                      "APPLY"
                    )}
                  </Button>
                </>
              )}
            </div>

            <div className="flex justify-between text-xl font-black text-slate-900">
              <span>Total</span>
              <span>${cartSummary.finalTotal.toFixed(2)}</span>
            </div>

            <Button
              className="w-full bg-slate-900 h-12 text-lg hover:bg-slate-800"
              disabled={cart.length === 0}
              onClick={() => setIsCheckoutOpen(true)}
            >
              Checkout <ChevronRight className="ml-1" />
            </Button>
          </div>
        </div>
      </div>

      {/* --- CHECKOUT MODAL --- */}
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Confirm Payment</DialogTitle>
            <DialogDescription>
              Total:{" "}
              <span className="font-bold text-slate-900">
                ${cartSummary.finalTotal.toFixed(2)}
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="flex gap-2">
              <Button
                variant={paymentMethod === "CASH" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setPaymentMethod("CASH")}
              >
                Cash
              </Button>
              <Button
                variant={paymentMethod === "CARD" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setPaymentMethod("CARD")}
              >
                Card
              </Button>
            </div>

            {/* CASH INPUT & DRAWER CHECK */}
            {paymentMethod === "CASH" && (
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
                <div className="space-y-1">
                  <Label>Cash Received</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      type="number"
                      autoFocus
                      className="pl-9 h-12 text-lg font-bold"
                      value={cashReceived}
                      onChange={(e) => setCashReceived(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-dashed">
                  <span className="font-bold text-sm">Change:</span>
                  <span
                    className={cn(
                      "text-xl font-black",
                      changeAmount < 0 ? "text-red-500" : "text-green-600"
                    )}
                  >
                    ${changeAmount >= 0 ? changeAmount.toFixed(2) : "0.00"}
                  </span>
                </div>

                {/* Insufficient Drawer Warning UI */}
                {changeAmount > 0 && changeAmount > branchBalance && (
                  <div className="bg-red-50 border border-red-200 rounded p-2 flex items-start gap-2 text-red-600 text-xs">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Drawer Funds Insufficient!</p>
                      <p>
                        Available: ${branchBalance}. Change Needed: $
                        {changeAmount}.
                      </p>
                      <p
                        className="mt-1 underline cursor-pointer"
                        onClick={() => setIsRequestCashOpen(true)}
                      >
                        Request Cash Now
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <Input
              placeholder="Customer Name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </div>

          <DialogFooter>
            {/* BLOCK BUTTON IF DRAWER EMPTY */}
            <Button
              onClick={handleConfirmPayment}
              disabled={
                checkoutMutation.isPending ||
                (paymentMethod === "CASH" &&
                  changeAmount > branchBalance &&
                  changeAmount > 0)
              }
              className="w-full bg-green-600 hover:bg-green-700 h-12"
            >
              {checkoutMutation.isPending ? "Processing..." : "Complete Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- REQUEST FUNDS MODAL --- */}
      <Dialog open={isRequestCashOpen} onOpenChange={setIsRequestCashOpen}>
        <DialogContent className="border-red-100">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex gap-2">
              <AlertTriangle /> Insufficient Funds
            </DialogTitle>
            <DialogDescription>
              Request funds from manager to proceed.
            </DialogDescription>
          </DialogHeader>
          <Input
            placeholder="Amount"
            type="number"
            value={requestAmount}
            onChange={(e) => setRequestAmount(e.target.value)}
          />
          <Input
            placeholder="Reason"
            value={requestReason}
            onChange={(e) => setRequestReason(e.target.value)}
          />
          <DialogFooter>
            <Button
              onClick={() =>
                requestCashMutation.mutate({
                  amount: Number(requestAmount),
                  reason: requestReason,
                })
              }
            >
              Send Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- INVOICE PRINT MODAL --- */}
      <Dialog open={isInvoiceOpen} onOpenChange={setIsInvoiceOpen}>
        <DialogContent className="max-w-[400px] bg-slate-800 border-none p-0">
          <div className="max-h-[80vh] overflow-y-auto p-4 custom-scrollbar bg-slate-800">
            <InvoiceTemplate sale={lastSale} />
          </div>
          <div className="p-4 pt-0">
            <Button
              onClick={() => window.print()}
              className="w-full bg-white text-slate-900 hover:bg-slate-200"
            >
              <Printer className="mr-2 h-4 w-4" /> Print
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
