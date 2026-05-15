import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft,
  Layers,
  Percent,
  DollarSign,
  Calendar,
  ShoppingBag,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { discountApi, productApi, categoryApi } from "@/lib/api";
import { Separator } from "@/components/ui/separator";

// --- SCHEMA ---
const bulkSchema = z.object({
  name: z.string().min(1, "Campaign name required"),
  minQuantity: z.number().min(2, "Must be at least 2"),
  type: z.enum(["PERCENTAGE", "FIXED"]),
  value: z.number().min(1, "Value required"),
  scope: z.enum(["PRODUCT", "CATEGORY"]),
  targetId: z.string().min(1, "Select target"),
  validUntil: z.string().min(1, "Expiry date required"),
});

type BulkFormData = z.infer<typeof bulkSchema>;

export default function AddBulk() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load Data
  const { data: products } = useQuery({
    queryKey: ["products"],
    queryFn: () => productApi.getAll(),
  });
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoryApi.getAll(),
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BulkFormData>({
    resolver: zodResolver(bulkSchema),
    defaultValues: {
      type: "PERCENTAGE",
      scope: "PRODUCT",
      minQuantity: 5,
    },
  });

  const scope = watch("scope");
  const discountType = watch("type");

  // --- MUTATION (FIXED) ---
  const mutation = useMutation({
    mutationFn: (data: BulkFormData) => {
      // Backend DTO match karne ke liye Payload transformation
      const payload = {
        name: data.name,
        // Unique code generate kar rahe hain taake validation fail na ho
        code: `BULK-${Math.floor(1000 + Math.random() * 9000)}`,
        type: data.type, // UI se jo select hua (PERCENTAGE ya FIXED)
        value: Number(data.value),
        minQuantity: Number(data.minQuantity),
        scope: data.scope,
        // FIX: Backend 'targetIds' array expect karta hai
        targetIds: [data.targetId],
        // FIX: Date to ISO String
        validUntil: new Date(data.validUntil).toISOString(),
      };

      console.log("Sending Payload:", payload); // Debugging ke liye
      return discountApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discounts"] });
      toast({ title: "Bulk Deal Activated! 🚀" });
      navigate("/discounts");
    },
    onError: (error: any) => {
      console.error("API Error Details:", error);
      toast({
        title: "Failed to create deal",
        description: error?.response?.data?.message || "Check your inputs.",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 font-sans">
      {/* HEADER */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-full hover:bg-slate-100"
          >
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Layers className="h-5 w-5 text-blue-600" /> Bulk Quantity Deal
            </h1>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-4xl mx-auto p-6">
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* LEFT: TRIGGER (CONDITION) */}
            <Card className="border-0 shadow-md ring-1 ring-slate-100 overflow-hidden bg-white group hover:shadow-lg transition-all">
              <div className="bg-gradient-to-r from-blue-50 to-white px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                <div className="bg-blue-100 p-1.5 rounded-md">
                  <ShoppingBag className="h-4 w-4 text-blue-600" />
                </div>
                <h2 className="font-semibold text-slate-800">
                  Buying Condition
                </h2>
              </div>
              <CardContent className="p-6 space-y-6">
                {/* Name */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-500 uppercase">
                    Campaign Name
                  </Label>
                  <Input
                    {...register("name")}
                    placeholder="e.g. Buy 10 Get 15% Off"
                    className="h-11 border-slate-200 focus-visible:ring-blue-500"
                  />
                  {errors.name && (
                    <p className="text-xs text-red-500">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                {/* Min Quantity */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-500 uppercase">
                    Minimum Quantity
                  </Label>
                  <div className="relative">
                    <div className="absolute left-3 top-3 h-4 w-4 text-slate-400 font-bold text-xs">
                      MIN
                    </div>
                    <Input
                      type="number"
                      {...register("minQuantity", { valueAsNumber: true })}
                      className="pl-12 h-11 border-slate-200 focus-visible:ring-blue-500 font-mono text-lg font-bold"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Customer must buy at least this many items to trigger
                    discount.
                  </p>
                </div>

                {/* Scope & Target */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-500 uppercase">
                    Applies On
                  </Label>
                  <div className="flex gap-2">
                    <Select
                      onValueChange={(val: any) => setValue("scope", val)}
                      defaultValue="PRODUCT"
                    >
                      <SelectTrigger className="w-[120px] h-11 border-slate-200 bg-slate-50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PRODUCT">Single Product</SelectItem>
                        <SelectItem value="CATEGORY">Whole Category</SelectItem>
                      </SelectContent>
                    </Select>

                    <div className="flex-1">
                      <Select
                        onValueChange={(val) => setValue("targetId", val)}
                      >
                        <SelectTrigger className="h-11 border-slate-200">
                          <SelectValue
                            placeholder={
                              scope === "PRODUCT"
                                ? "Select Product"
                                : "Select Category"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {scope === "PRODUCT"
                            ? products?.data?.map((p: any) => (
                                <SelectItem key={p.id} value={p.id}>
                                  {p.name}
                                </SelectItem>
                              ))
                            : categories?.data?.map((c: any) => (
                                <SelectItem key={c.id} value={c.id}>
                                  {c.name}
                                </SelectItem>
                              ))}
                        </SelectContent>
                      </Select>
                      {errors.targetId && (
                        <p className="text-xs text-red-500 mt-1">
                          {errors.targetId.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* RIGHT: REWARD (DISCOUNT) */}
            <Card className="border-0 shadow-md ring-1 ring-slate-100 overflow-hidden bg-white group hover:shadow-lg transition-all">
              <div className="bg-gradient-to-r from-green-50 to-white px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                <div className="bg-green-100 p-1.5 rounded-md">
                  <Percent className="h-4 w-4 text-green-600" />
                </div>
                <h2 className="font-semibold text-slate-800">Reward</h2>
              </div>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-500 uppercase">
                    Discount Type
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div
                      onClick={() => setValue("type", "PERCENTAGE")}
                      className={`cursor-pointer border rounded-lg p-3 flex flex-col items-center justify-center gap-1 transition-all ${
                        discountType === "PERCENTAGE"
                          ? "bg-green-50 border-green-200 text-green-700"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <Percent className="h-5 w-5" />
                      <span className="text-xs font-bold">Percentage Off</span>
                    </div>
                    <div
                      onClick={() => setValue("type", "FIXED")}
                      className={`cursor-pointer border rounded-lg p-3 flex flex-col items-center justify-center gap-1 transition-all ${
                        discountType === "FIXED"
                          ? "bg-green-50 border-green-200 text-green-700"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <DollarSign className="h-5 w-5" />
                      <span className="text-xs font-bold">
                        Fixed Amount Off
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-500 uppercase">
                    Discount Value
                  </Label>
                  <Input
                    type="number"
                    {...register("value", { valueAsNumber: true })}
                    className="h-11 border-slate-200 focus-visible:ring-green-500 font-bold text-lg"
                    placeholder="0"
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-500 uppercase">
                    Ends On
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      type="datetime-local"
                      {...register("validUntil")}
                      className="pl-10 h-11 border-slate-200"
                    />
                  </div>
                  {errors.validUntil && (
                    <p className="text-xs text-red-500">
                      {errors.validUntil.message}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 flex justify-end">
            <Button
              type="submit"
              size="lg"
              disabled={mutation.isPending}
              className="bg-slate-900 hover:bg-slate-800 text-white h-12 px-8 shadow-xl rounded-xl"
            >
              {mutation.isPending ? "Activating..." : "Activate Bulk Deal 🚀"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
