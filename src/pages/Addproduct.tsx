import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft,
  Check,
  Search,
  Package,
  Barcode,
  ScanBarcode,
  DollarSign,
  Scale,
  Layers,
  Store,
  Settings2,
  ChevronRight,
  Palette,
  Shapes,
  Box,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { productApi, branchApi, categoryApi } from "@/lib/api";
import { cn, asArray } from "@/lib/utils";

// --- TYPES & INTERFACES ---
interface Branch {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
  parentId?: string | null;
}

// --- ZOD SCHEMA ---
const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  sku: z.string().min(1, "SKU is required"),
  barcode: z.string().optional(),
  categoryId: z.string().min(1, "Category is required"),
  branchIds: z.array(z.string()).min(1, "Select at least one branch"),
  price: z.number().min(0, "Price must be positive"),
  cost: z.number().min(0, "Cost must be positive"),
  unit: z.string().min(1, "Unit is required"),
  // Optional Attributes
  material: z.string().optional(),
  shape: z.string().optional(),
  weight: z.string().optional(),
  color: z.string().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

export default function AddProduct() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // UI States for Modals
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isBranchOpen, setIsBranchOpen] = useState(false);

  // UI Logic States
  const [showAttributes, setShowAttributes] = useState(false);
  const [selectedRootCategory, setSelectedRootCategory] = useState<string>("");
  const [branchSearch, setBranchSearch] = useState("");

  // --- API QUERIES ---
  const { data: branchesRaw } = useQuery({
    queryKey: ["branches"],
    queryFn: async () => {
      const res = await branchApi.getAll();
      return asArray<Branch>(res.data ?? res);
    },
  });
  const branchesData = asArray<Branch>(branchesRaw);

  const { data: categoriesRaw } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await categoryApi.getAll();
      return asArray<Category>(res.data ?? res);
    },
  });
  const categoriesData = asArray<Category>(categoriesRaw);

  // --- DERIVED DATA ---
  const rootCategories = categoriesData?.filter((c) => !c.parentId) || [];

  const subCategories =
    categoriesData?.filter((c) => c.parentId === selectedRootCategory) || [];

  // Filter Branches based on search
  const filteredBranches = branchesData.filter((b) =>
    (b.name ?? "").toLowerCase().includes(branchSearch.toLowerCase())
  );

  // --- FORM SETUP ---
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    shouldUnregister: false,
    defaultValues: {
      unit: "pcs",
      branchIds: [],
      material: "",
      shape: "",
      weight: "",
      color: "",
      price: 0,
      cost: 0,
    },
  });

  const selectedBranchIds = watch("branchIds") || [];
  const currentCategoryId = watch("categoryId");

  // Helper to get Category Name for display
  const getCategoryName = (id: string) => {
    const cat = categoriesData?.find((c) => c.id === id);
    return cat ? cat.name : "Select Category";
  };

  // --- MUTATION ---
  const createMutation = useMutation({
    mutationFn: (data: ProductFormData) => productApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "Product created successfully" });
      navigate("/products");
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || "Failed to create product";
      toast({ title: "Error", description: message, variant: "destructive" });
    },
  });

  const onSubmit = (data: ProductFormData) => {
    createMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* --- TOP BAR (Sticky) --- */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/products")}
            className="rounded-full hover:bg-slate-100"
          >
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </Button>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              Add New Product
            </h1>
            <p className="text-xs text-slate-500">
              Create a new item in your inventory.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="hidden sm:flex"
            onClick={() => navigate("/products")}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            disabled={createMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 px-6"
          >
            {createMutation.isPending ? "Creating..." : "Create Product"}
          </Button>
        </div>
      </div>

      {/* --- CONTENT AREA --- */}
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LEFT COLUMN (Basic Info & Pricing) */}
            <div className="lg:col-span-2 space-y-6">
              {/* CARD 1: General Info */}
              <Card className="border-slate-200 shadow-sm">
                <div className="bg-slate-50/50 px-6 py-3 border-b border-slate-100 flex items-center gap-2">
                  <Package className="h-4 w-4 text-slate-500" />
                  <span className="text-sm font-semibold text-slate-700">
                    General Information
                  </span>
                </div>
                <CardContent className="p-6 space-y-6">
                  {/* Name */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                      Product Name <span className="text-red-600">*</span>
                    </Label>
                    <Input
                      {...register("name")}
                      placeholder="e.g. Wireless Headphones"
                      className="border-slate-200 focus-visible:ring-blue-600"
                    />
                    {errors.name && (
                      <p className="text-xs text-red-600">
                        {errors.name.message}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* SKU */}
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                        SKU <span className="text-red-600">*</span>
                      </Label>
                      <div className="relative">
                        <ScanBarcode className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                          {...register("sku")}
                          placeholder="PROD-001"
                          className="pl-9 border-slate-200 focus-visible:ring-blue-600"
                        />
                      </div>
                      {errors.sku && (
                        <p className="text-xs text-red-600">
                          {errors.sku.message}
                        </p>
                      )}
                    </div>

                    {/* Barcode */}
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                        Barcode
                      </Label>
                      <div className="relative">
                        <Barcode className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                          {...register("barcode")}
                          placeholder="Scan or enter barcode"
                          className="pl-9 border-slate-200 focus-visible:ring-blue-600"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* CARD 2: Pricing & Inventory */}
              <Card className="border-slate-200 shadow-sm">
                <div className="bg-slate-50/50 px-6 py-3 border-b border-slate-100 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-slate-500" />
                  <span className="text-sm font-semibold text-slate-700">
                    Pricing & Units
                  </span>
                </div>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Price */}
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                        Sales Price <span className="text-red-600">*</span>
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-slate-400 text-sm font-semibold">
                          $
                        </span>
                        <Input
                          type="number"
                          step="0.01"
                          {...register("price", { valueAsNumber: true })}
                          className="pl-7 border-slate-200 focus-visible:ring-blue-600"
                        />
                      </div>
                      {errors.price && (
                        <p className="text-xs text-red-600">
                          {errors.price.message}
                        </p>
                      )}
                    </div>

                    {/* Cost */}
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                        Cost Price <span className="text-red-600">*</span>
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-slate-400 text-sm font-semibold">
                          $
                        </span>
                        <Input
                          type="number"
                          step="0.01"
                          {...register("cost", { valueAsNumber: true })}
                          className="pl-7 border-slate-200 focus-visible:ring-blue-600"
                        />
                      </div>
                      {errors.cost && (
                        <p className="text-xs text-red-600">
                          {errors.cost.message}
                        </p>
                      )}
                    </div>

                    {/* Unit */}
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                        Unit <span className="text-red-600">*</span>
                      </Label>
                      <div className="relative">
                        <Scale className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                          {...register("unit")}
                          placeholder="pcs, kg, m"
                          className="pl-9 border-slate-200 focus-visible:ring-blue-600"
                        />
                      </div>
                      {errors.unit && (
                        <p className="text-xs text-red-600">
                          {errors.unit.message}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* CARD 3: Attributes (toggle with Switch — avoids click conflicts with Checkbox) */}
              <Card className="border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-slate-50/50 px-6 py-3 border-b border-slate-100 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <Settings2 className="h-4 w-4 text-slate-500 shrink-0" />
                    <span className="text-sm font-semibold text-slate-700">
                      Product Attributes
                    </span>
                  </div>
                  <Switch
                    checked={showAttributes}
                    onCheckedChange={(v) => setShowAttributes(!!v)}
                  />
                </div>

                {showAttributes && (
                  <CardContent className="p-6 bg-slate-50/30 animate-in slide-in-from-top-2 fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-xs text-slate-500">
                          Material
                        </Label>
                        <div className="relative">
                          <Box className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                          <Input
                            {...register("material")}
                            className="pl-9 bg-white"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-slate-500">Shape</Label>
                        <div className="relative">
                          <Shapes className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                          <Input
                            {...register("shape")}
                            className="pl-9 bg-white"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-slate-500">Weight</Label>
                        <div className="relative">
                          <Scale className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                          <Input
                            {...register("weight")}
                            className="pl-9 bg-white"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-slate-500">Color</Label>
                        <div className="relative">
                          <Palette className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                          <Input
                            {...register("color")}
                            className="pl-9 bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            </div>

            {/* RIGHT COLUMN (Classification) */}
            <div className="space-y-6">
              <Card className="border-slate-200 shadow-sm h-full">
                <div className="bg-slate-50/50 px-6 py-3 border-b border-slate-100 flex items-center gap-2">
                  <Layers className="h-4 w-4 text-slate-500" />
                  <span className="text-sm font-semibold text-slate-700">
                    Classification
                  </span>
                </div>
                <CardContent className="p-6 space-y-6">
                  {/* Category Selection */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                      Category <span className="text-red-600">*</span>
                    </Label>
                    <Dialog
                      open={isCategoryOpen}
                      onOpenChange={setIsCategoryOpen}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-between h-11 px-3 bg-white border-slate-200 hover:bg-slate-50 text-left font-normal"
                        >
                          <span className="truncate">
                            {currentCategoryId
                              ? getCategoryName(currentCategoryId)
                              : "Select Category"}
                          </span>
                          <Search className="h-4 w-4 text-slate-400" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                          <DialogTitle>Select Category</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                          {/* Root Categories */}
                          <div className="space-y-2">
                            <span className="text-xs font-medium text-slate-500 uppercase">
                              Main Categories
                            </span>
                            <ScrollArea className="h-[150px] border rounded-md p-2">
                              <div className="grid grid-cols-2 gap-2">
                                {rootCategories.map((root) => (
                                  <div
                                    key={root.id}
                                    onClick={() => {
                                      setSelectedRootCategory(root.id);
                                      // Auto-select if no children
                                      const hasChildren = categoriesData?.some(
                                        (c) => c.parentId === root.id
                                      );
                                      if (!hasChildren) {
                                        setValue("categoryId", root.id, {
                                          shouldValidate: true,
                                        });
                                        setIsCategoryOpen(false);
                                      }
                                    }}
                                    className={cn(
                                      "p-2 text-sm border rounded cursor-pointer hover:bg-slate-100 transition-all flex items-center justify-between",
                                      selectedRootCategory === root.id
                                        ? "border-blue-500 bg-blue-50 text-blue-700"
                                        : "border-slate-100"
                                    )}
                                  >
                                    <span>{root.name}</span>
                                    {selectedRootCategory === root.id && (
                                      <ChevronRight className="h-4 w-4 opacity-50" />
                                    )}
                                  </div>
                                ))}
                              </div>
                            </ScrollArea>
                          </div>

                          {/* Sub Categories */}
                          {selectedRootCategory && subCategories.length > 0 && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-left-2">
                              <span className="text-xs font-medium text-slate-500 uppercase">
                                Sub Categories
                              </span>
                              <ScrollArea className="h-[150px] border rounded-md p-2 bg-slate-50/50">
                                <div className="grid grid-cols-2 gap-2">
                                  {subCategories.map((sub) => (
                                    <div
                                      key={sub.id}
                                      onClick={() => {
                                        setValue("categoryId", sub.id, {
                                          shouldValidate: true,
                                        });
                                        setIsCategoryOpen(false);
                                      }}
                                      className={cn(
                                        "p-2 text-sm border rounded cursor-pointer hover:bg-white transition-all flex items-center justify-between",
                                        currentCategoryId === sub.id
                                          ? "border-blue-500 bg-white text-blue-700 shadow-sm"
                                          : "border-transparent"
                                      )}
                                    >
                                      <span>{sub.name}</span>
                                      {currentCategoryId === sub.id && (
                                        <Check className="h-3 w-3" />
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </ScrollArea>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                    {errors.categoryId && (
                      <p className="text-xs text-red-600">
                        {errors.categoryId.message}
                      </p>
                    )}
                  </div>

                  <Separator />

                  {/* Branch Selection */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                      Availability <span className="text-red-600">*</span>
                    </Label>
                    <Dialog open={isBranchOpen} onOpenChange={setIsBranchOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start h-auto min-h-[44px] px-3 py-2 bg-white border-slate-200 hover:bg-slate-50 text-left font-normal"
                        >
                          {selectedBranchIds.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {selectedBranchIds.map((id) => {
                                const b = branchesData?.find(
                                  (branch) => branch.id === id
                                );
                                return (
                                  <Badge
                                    key={id}
                                    variant="secondary"
                                    className="bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200"
                                  >
                                    {b?.name}
                                  </Badge>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="flex items-center text-slate-500 gap-2">
                              <Store className="h-4 w-4" />
                              <span>Select Branches...</span>
                            </div>
                          )}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[400px]">
                        <DialogHeader>
                          <DialogTitle>Select Branches</DialogTitle>
                        </DialogHeader>
                        <div className="relative mt-2">
                          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search branch..."
                            value={branchSearch}
                            onChange={(e) => setBranchSearch(e.target.value)}
                            className="pl-9"
                          />
                        </div>
                        <ScrollArea className="h-[250px] mt-2 pr-2">
                          <div className="space-y-1">
                            {filteredBranches?.map((branch) => {
                              const isSelected = selectedBranchIds.includes(
                                branch.id
                              );
                              return (
                                <div
                                  key={branch.id}
                                  onClick={() => {
                                    const newSelected = isSelected
                                      ? selectedBranchIds.filter(
                                          (id) => id !== branch.id
                                        )
                                      : [...selectedBranchIds, branch.id];
                                    setValue("branchIds", newSelected, {
                                      shouldValidate: true,
                                    });
                                  }}
                                  className={cn(
                                    "flex items-center space-x-3 p-2 rounded-md cursor-pointer transition-colors",
                                    isSelected
                                      ? "bg-blue-50 text-blue-700"
                                      : "hover:bg-slate-50"
                                  )}
                                >
                                  <Checkbox
                                    id={`branch-${branch.id}`}
                                    checked={isSelected}
                                    onCheckedChange={() => {}} // Handled by div click
                                  />
                                  <label className="text-sm font-medium leading-none cursor-pointer flex-1">
                                    {branch.name}
                                  </label>
                                </div>
                              );
                            })}
                            {filteredBranches?.length === 0 && (
                              <p className="text-center text-slate-400 py-4 text-sm">
                                No branch found
                              </p>
                            )}
                          </div>
                        </ScrollArea>
                        <div className="flex justify-end pt-2">
                          <Button
                            size="sm"
                            onClick={() => setIsBranchOpen(false)}
                          >
                            Done
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    {errors.branchIds && (
                      <p className="text-xs text-red-600">
                        {errors.branchIds.message}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
