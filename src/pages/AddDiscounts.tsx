import { useEffect, useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft,
  Search,
  Check,
  Tag,
  Percent,
  Calendar,
  Layers,
  Package,
  TicketPercent,
  DollarSign,
  Target,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { discountApi, productApi, categoryApi } from "@/lib/api";
import { cn } from "@/lib/utils";

// --- TYPES & INTERFACES ---
interface Product {
  id: string;
  name: string;
  price: number;
}

interface Category {
  id: string;
  name: string;
}

interface Discount {
  id: string;
  name: string;
  type: "percentage" | "fixed";
  value: number;
  scope: "product" | "category";
  validUntil: string;
  isActive: boolean;
  products?: Product[];
  categories?: Category[];
  targetIds?: string[];
}

// --- SCHEMA ---
const discountSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["percentage", "fixed"]),
  value: z.number().min(0.01, "Value must be positive"),
  scope: z.enum(["product", "category"]),
  targetIds: z.array(z.string()).min(1, "Select at least one item"),
  validUntil: z.string().min(1, "Expiry date is required"),
  isActive: z.boolean().optional(),
});

type DiscountFormData = z.infer<typeof discountSchema>;

export default function AddDiscount() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // --- POPUP STATE ---
  const [isTargetOpen, setIsTargetOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // --- QUERIES ---
  const { data: productsData } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const res = await productApi.getAll();
      return res.data as Product[];
    },
  });

  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await categoryApi.getAll();
      return res.data as Category[];
    },
  });

  const { data: editData, isLoading: isLoadingEdit } = useQuery({
    queryKey: ["discount", id],
    queryFn: async () => {
      const res = await discountApi.getById(id!);
      return res.data as Discount;
    },
    enabled: isEditMode,
  });

  // --- FORM SETUP ---
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<DiscountFormData>({
    resolver: zodResolver(discountSchema),
    defaultValues: {
      name: "",
      type: "percentage",
      value: 0,
      scope: "product",
      targetIds: [],
      validUntil: "",
      isActive: true,
    },
  });

  const scope = watch("scope");
  const discountType = watch("type");
  const selectedTargetIds = watch("targetIds");

  // --- LOAD DATA FOR EDIT ---
  useEffect(() => {
    if (editData) {
      let currentTargetIds: string[] = [];

      // Logic to extract IDs depending on API response structure
      if (editData.scope === "product" && editData.products) {
        currentTargetIds = editData.products.map((p) => p.id);
      } else if (editData.scope === "category" && editData.categories) {
        currentTargetIds = editData.categories.map((c) => c.id);
      } else if (editData.targetIds) {
        currentTargetIds = editData.targetIds;
      }

      // Convert ISO date to Input friendly format (yyyy-MM-ddThh:mm)
      let localISOTime = "";
      if (editData.validUntil) {
        const dateObj = new Date(editData.validUntil);
        const offset = dateObj.getTimezoneOffset() * 60000;
        localISOTime = new Date(dateObj.getTime() - offset)
          .toISOString()
          .slice(0, 16);
      }

      reset({
        name: editData.name,
        type: editData.type,
        value: editData.value,
        scope: editData.scope,
        targetIds: currentTargetIds,
        validUntil: localISOTime,
        isActive: editData.isActive,
      });
    }
  }, [editData, reset]);

  // --- FILTER TARGETS ---
  const targetList = useMemo(() => {
    const list = scope === "product" ? productsData : (categoriesData as any[]); // generic handling due to different shapes
    if (!list) return [];

    return list.filter((item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [scope, productsData, categoriesData, searchQuery]);

  const targetLabel = scope === "product" ? "Products" : "Categories";

  // --- MUTATION ---
  const mutation = useMutation({
    mutationFn: (data: DiscountFormData) => {
      const payload = {
        ...data,
        validUntil: new Date(data.validUntil).toISOString(),
      };
      if (isEditMode && id) {
        return discountApi.update(id, payload);
      }
      return discountApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discounts"] });
      toast({
        title: isEditMode ? "Discount updated!" : "Discount created!",
      });
      navigate("/discounts");
    },
    onError: (error: any) => {
      toast({
        title: error?.response?.data?.message || "Operation failed",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: DiscountFormData) => {
    mutation.mutate(data);
  };

  const toggleSelection = (itemId: string) => {
    const current = selectedTargetIds || [];
    const newSelection = current.includes(itemId)
      ? current.filter((id) => id !== itemId)
      : [...current, itemId];
    setValue("targetIds", newSelection, { shouldValidate: true });
  };

  if (isEditMode && isLoadingEdit)
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        Loading discount details...
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* --- TOP BAR (Sticky & Blurry) --- */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/discounts")}
            className="rounded-full hover:bg-slate-100"
          >
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </Button>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              {isEditMode ? "Edit Discount" : "New Discount"}
            </h1>
            <p className="text-xs text-slate-500">
              {isEditMode
                ? "Manage promotion details and validity."
                : "Create a new promotional campaign."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="hidden sm:flex"
            onClick={() => navigate("/discounts")}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            disabled={mutation.isPending}
            className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 px-6"
          >
            {mutation.isPending ? "Saving..." : "Save Discount"}
          </Button>
        </div>
      </div>

      {/* --- CONTENT AREA --- */}
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <form onSubmit={handleSubmit(onSubmit)}>
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            {/* Card Header Style */}
            <div className="bg-slate-50/50 px-6 py-3 border-b border-slate-100 flex items-center gap-2">
              <TicketPercent className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-semibold text-slate-700">
                Campaign Details
              </span>
            </div>

            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* NAME */}
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Discount Name <span className="text-red-600">*</span>
                  </Label>
                  <div className="relative">
                    <Tag className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      {...register("name")}
                      placeholder="e.g. Summer Sale 2025"
                      className="pl-9 border-slate-200 focus-visible:ring-blue-600"
                    />
                  </div>
                  {errors.name && (
                    <p className="text-xs text-red-600">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                {/* TYPE */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Discount Type
                  </Label>
                  <Select
                    onValueChange={(val: "percentage" | "fixed") =>
                      setValue("type", val)
                    }
                    value={discountType}
                  >
                    <SelectTrigger className="border-slate-200 focus:ring-blue-600">
                      <div className="flex items-center gap-2">
                        {discountType === "percentage" ? (
                          <Percent className="h-4 w-4 text-slate-400" />
                        ) : (
                          <DollarSign className="h-4 w-4 text-slate-400" />
                        )}
                        <SelectValue />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* VALUE */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Value <span className="text-red-600">*</span>
                  </Label>
                  <div className="relative">
                    {discountType === "percentage" ? (
                      <Percent className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    ) : (
                      <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    )}
                    <Input
                      type="number"
                      step="0.01"
                      {...register("value", { valueAsNumber: true })}
                      className="pl-9 border-slate-200 focus-visible:ring-blue-600"
                    />
                  </div>
                  {errors.value && (
                    <p className="text-xs text-red-600">
                      {errors.value.message}
                    </p>
                  )}
                </div>

                {/* SCOPE */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Apply On
                  </Label>
                  <Select
                    onValueChange={(val: "product" | "category") => {
                      setValue("scope", val);
                      setValue("targetIds", []);
                      setSearchQuery("");
                    }}
                    value={scope}
                  >
                    <SelectTrigger className="border-slate-200 focus:ring-blue-600">
                      <div className="flex items-center gap-2">
                        {scope === "product" ? (
                          <Package className="h-4 w-4 text-slate-400" />
                        ) : (
                          <Layers className="h-4 w-4 text-slate-400" />
                        )}
                        <SelectValue />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="product">Specific Products</SelectItem>
                      <SelectItem value="category">Whole Category</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* VALID UNTIL */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Valid Until <span className="text-red-600">*</span>
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      type="datetime-local"
                      {...register("validUntil")}
                      className="pl-9 border-slate-200 focus-visible:ring-blue-600 block"
                    />
                  </div>
                  {errors.validUntil && (
                    <p className="text-xs text-red-600">
                      {errors.validUntil.message}
                    </p>
                  )}
                </div>

                {/* TARGET SELECTION (Full Width) */}
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Select {targetLabel} <span className="text-red-600">*</span>
                  </Label>

                  <Dialog open={isTargetOpen} onOpenChange={setIsTargetOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between h-auto min-h-[44px] py-2 bg-slate-50 border-slate-200 hover:bg-slate-100 text-left font-normal"
                      >
                        <div className="flex items-center gap-2 flex-wrap">
                          <Target className="h-4 w-4 text-slate-400 shrink-0" />

                          {selectedTargetIds.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {selectedTargetIds.slice(0, 5).map((id) => {
                                const list =
                                  scope === "product"
                                    ? productsData
                                    : categoriesData;
                                const item = list?.find((i) => i.id === id);
                                if (!item) return null;
                                return (
                                  <Badge
                                    key={id}
                                    variant="secondary"
                                    className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                                  >
                                    {item.name}
                                  </Badge>
                                );
                              })}
                              {selectedTargetIds.length > 5 && (
                                <Badge
                                  variant="outline"
                                  className="bg-slate-100"
                                >
                                  +{selectedTargetIds.length - 5} more
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-500">
                              Select {targetLabel.toLowerCase()}...
                            </span>
                          )}
                        </div>
                        <Search className="h-4 w-4 text-slate-400 shrink-0 ml-2" />
                      </Button>
                    </DialogTrigger>

                    <DialogContent className="p-0 sm:max-w-[500px]">
                      <DialogHeader className="p-4 pb-2">
                        <DialogTitle>Select {targetLabel}</DialogTitle>
                        <div className="relative mt-2">
                          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder={`Search ${targetLabel}...`}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                          />
                        </div>
                      </DialogHeader>
                      <ScrollArea className="h-[300px]">
                        <div className="p-2">
                          {targetList?.map((item) => {
                            const isSelected = selectedTargetIds.includes(
                              item.id
                            );
                            return (
                              <div
                                key={item.id}
                                onClick={() => toggleSelection(item.id)}
                                className={cn(
                                  "flex items-center justify-between p-3 rounded-md cursor-pointer hover:bg-slate-100 mb-1 transition-colors",
                                  isSelected &&
                                    "bg-blue-50 border border-blue-100"
                                )}
                              >
                                <div className="flex flex-col">
                                  <span
                                    className={cn(
                                      "text-sm font-medium",
                                      isSelected
                                        ? "text-blue-700"
                                        : "text-slate-700"
                                    )}
                                  >
                                    {item.name}
                                  </span>
                                  {scope === "product" && (
                                    <span className="text-xs text-slate-500">
                                      Price: ${(item as Product).price}
                                    </span>
                                  )}
                                </div>
                                {isSelected && (
                                  <Check className="h-4 w-4 text-blue-600" />
                                )}
                              </div>
                            );
                          })}
                          {targetList?.length === 0 && (
                            <p className="text-center text-slate-400 py-8 text-sm">
                              No {targetLabel.toLowerCase()} found matching "
                              {searchQuery}".
                            </p>
                          )}
                        </div>
                      </ScrollArea>
                      <div className="p-3 border-t bg-slate-50 flex justify-between items-center">
                        <span className="text-xs text-slate-500 px-2">
                          {selectedTargetIds.length} selected
                        </span>
                        <Button
                          size="sm"
                          onClick={() => setIsTargetOpen(false)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Done
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {errors.targetIds && (
                    <p className="text-xs text-red-600">
                      {errors.targetIds.message}
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
