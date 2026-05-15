import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft,
  Gift,
  ArrowRight,
  Package,
  ShoppingBag,
  Layers,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { discountApi, productApi } from "@/lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// --- SCHEMA ---
const bogoSchema = z.object({
  name: z.string().min(1, "Campaign name required"),
  buyQty: z.number().min(1, "Min 1"),
  buyProductId: z.string().min(1, "Select product"),
  getQty: z.number().min(1, "Min 1"),
  getProductId: z.string().min(1, "Select product"),
  validUntil: z.string().min(1, "Date required"),
});

type BogoFormData = z.infer<typeof bogoSchema>;

export default function AddBogo() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load Products for selection
  const { data: products } = useQuery({
    queryKey: ["products"],
    queryFn: () => productApi.getAll(),
  });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<BogoFormData>({
    resolver: zodResolver(bogoSchema),
    defaultValues: { buyQty: 1, getQty: 1 },
  });

  // --- MUTATION ---
  const mutation = useMutation({
    mutationFn: (data: BogoFormData) => {
      // Backend logic ke hisab se structure adjust karen
      const payload = {
        name: data.name,
        type: "bogo",
        value: 100, // 100% off on the 'Get' item effectively
        config: { ...data }, // Store BOGO logic in a config field or separate logic
        validUntil: data.validUntil,
      };
      return discountApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discounts"] });
      toast({ title: "BOGO Offer Live! 🎁" });
      navigate("/discounts");
    },
    onError: () =>
      toast({ title: "Error creating offer", variant: "destructive" }),
  });

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 font-sans">
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Gift className="h-5 w-5 text-purple-600" /> Buy X Get Y Offer
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6">
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))}>
          {/* CAMPAIGN NAME */}
          <div className="mb-8">
            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Campaign Name
            </Label>
            <Input
              {...register("name")}
              placeholder="e.g. Buy 1 Burger Get 1 Coke Free"
              className="mt-2 h-12 text-lg border-slate-200 shadow-sm"
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
            )}
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-stretch">
            {/* BUY SECTION */}
            <Card className="flex-1 border-0 shadow-lg ring-1 ring-slate-100 bg-white relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500" />
              <CardContent className="p-6 pt-8">
                <div className="flex items-center gap-2 mb-6">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <ShoppingBag className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="font-bold text-lg text-slate-800">
                    Customer Buys
                  </h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-xs text-slate-500">Quantity</Label>
                    <Input
                      type="number"
                      {...register("buyQty", { valueAsNumber: true })}
                      className="mt-1 h-11 border-blue-200 focus-visible:ring-blue-500 font-bold"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">
                      Specific Product
                    </Label>
                    <Select
                      onValueChange={(val) => setValue("buyProductId", val)}
                    >
                      <SelectTrigger className="mt-1 h-11">
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
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ARROW ICON */}
            <div className="flex items-center justify-center">
              <div className="bg-slate-900 text-white p-3 rounded-full shadow-xl z-10">
                <ArrowRight className="h-6 w-6" />
              </div>
            </div>

            {/* GET SECTION */}
            <Card className="flex-1 border-0 shadow-lg ring-1 ring-slate-100 bg-white relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-purple-500" />
              <CardContent className="p-6 pt-8">
                <div className="flex items-center gap-2 mb-6">
                  <div className="bg-purple-100 p-2 rounded-full">
                    <Gift className="h-5 w-5 text-purple-600" />
                  </div>
                  <h3 className="font-bold text-lg text-slate-800">
                    Customer Gets
                  </h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-xs text-slate-500">
                      Quantity (Free)
                    </Label>
                    <Input
                      type="number"
                      {...register("getQty", { valueAsNumber: true })}
                      className="mt-1 h-11 border-purple-200 focus-visible:ring-purple-500 font-bold"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">
                      Reward Product
                    </Label>
                    <Select
                      onValueChange={(val) => setValue("getProductId", val)}
                    >
                      <SelectTrigger className="mt-1 h-11">
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
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* DATE & SUBMIT */}
          <div className="mt-8 flex items-end justify-between gap-4 p-6 bg-slate-100 rounded-xl border border-slate-200">
            <div className="flex-1">
              <Label className="font-bold text-slate-700">Offer Ends On</Label>
              <Input
                type="datetime-local"
                {...register("validUntil")}
                className="mt-2 bg-white border-slate-300 h-11"
              />
            </div>
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="h-11 px-8 bg-purple-600 hover:bg-purple-700 text-white shadow-lg"
            >
              {mutation.isPending ? "Creating..." : "Launch Offer 🚀"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
