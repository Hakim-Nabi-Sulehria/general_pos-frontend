import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft,
  Ticket,
  Wand2,
  Calendar,
  Percent,
  DollarSign,
  Save,
  Users,
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
import { discountApi } from "@/lib/api";

const couponSchema = z.object({
  code: z.string().min(3, "Code must be at least 3 chars").toUpperCase(),
  type: z.enum(["percentage", "fixed"]),
  value: z.number().min(1, "Value required"),
  usageLimit: z.number().optional(),
  validUntil: z.string().min(1, "Expiry date is required"),
});

type CouponFormData = z.infer<typeof couponSchema>;

export default function AddCoupon() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CouponFormData>({
    resolver: zodResolver(couponSchema),
    defaultValues: {
      type: "percentage",
      value: 0,
    },
  });

  const discountType = watch("type");

  const generateCode = () => {
    const randomString = Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase();
    setValue("code", `SAVE-${randomString}`);
  };

  // --- FIXED MUTATION ---
  const mutation = useMutation({
    mutationFn: (data: CouponFormData) => {
      const payload = {
        name: data.code, // Coupon Code hi Name banega
        code: data.code,
        // FIX 1: Enums to Uppercase
        type: data.type.toUpperCase(), // "percentage" -> "PERCENTAGE"
        scope: "GLOBAL", // Coupons usually Global hote hain
        value: Number(data.value), // Ensure Number
        usageLimit: data.usageLimit ? Number(data.usageLimit) : undefined,
        // FIX 2: Date to ISO String
        validUntil: new Date(data.validUntil).toISOString(),
        targetIds: [], // Global scope ke liye empty array
      };
      return discountApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discounts"] });
      toast({ title: "Coupon Created Successfully" });
      navigate("/discounts");
    },
    onError: (error: any) => {
      console.error(error); // Debugging ke liye
      toast({
        title: "Failed to create coupon",
        description: error?.response?.data?.message || "Check inputs",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
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
          <div>
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              Create Coupon
            </h1>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/discounts")}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit((data) => mutation.mutate(data))}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Saving..." : "Save Coupon"}
          </Button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-6 space-y-6">
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))}>
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-50/50 px-6 py-3 border-b border-slate-100 flex items-center gap-2">
              <Ticket className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-semibold text-slate-700">
                Coupon Information
              </span>
            </div>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <Label>
                  Coupon Code <span className="text-red-600">*</span>
                </Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Ticket className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      {...register("code")}
                      placeholder="e.g. SUMMER2025"
                      className="pl-9 uppercase font-mono"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={generateCode}
                  >
                    <Wand2 className="h-4 w-4 mr-2" /> Generate
                  </Button>
                </div>
                {errors.code && (
                  <p className="text-xs text-red-600">{errors.code.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Discount Type</Label>
                  <Select
                    onValueChange={(val: any) => setValue("type", val)}
                    defaultValue="percentage"
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>
                    Value <span className="text-red-600">*</span>
                  </Label>
                  <div className="relative">
                    <div className="absolute left-3 top-2.5 h-4 w-4 text-slate-400">
                      {discountType === "percentage" ? (
                        <Percent className="h-4 w-4" />
                      ) : (
                        <DollarSign className="h-4 w-4" />
                      )}
                    </div>
                    <Input
                      type="number"
                      {...register("value", { valueAsNumber: true })}
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Usage Limit</Label>
                  <div className="relative">
                    <Users className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      type="number"
                      {...register("usageLimit", { valueAsNumber: true })}
                      placeholder="Unlimited"
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>
                    Valid Until <span className="text-red-600">*</span>
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      type="datetime-local"
                      {...register("validUntil")}
                      className="pl-9 block"
                    />
                  </div>
                  {errors.validUntil && (
                    <p className="text-xs text-red-600">
                      {errors.validUntil.message}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}
