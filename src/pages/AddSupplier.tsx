import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft,
  Search,
  Check,
  Store,
  Truck,
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supplierApi, branchApi } from "@/lib/api";
import { cn } from "@/lib/utils";

// --- TYPES & INTERFACES ---
interface Branch {
  id: string;
  name: string;
}

interface Supplier {
  id: string;
  name: string;
  email?: string;
  phone: string;
  address: string;
  branchId: string;
}

// --- SCHEMA ---
const supplierSchema = z.object({
  name: z.string().min(1, "Name is required"),
  // Email optional hai, empty string allow ki hai
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().min(1, "Phone is required"),
  address: z.string().min(1, "Address is required"),
  branchId: z.string().min(1, "Branch is required"),
});

type SupplierFormData = z.infer<typeof supplierSchema>;

export default function AddSupplier() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // --- POPUP STATE ---
  const [isBranchOpen, setIsBranchOpen] = useState(false);
  const [branchSearch, setBranchSearch] = useState("");

  // --- QUERIES ---
  const { data: branchesData } = useQuery({
    queryKey: ["branches"],
    queryFn: async () => {
      const res = await branchApi.getAll();
      return res.data as Branch[];
    },
  });

  const { data: editData, isLoading: isLoadingEdit } = useQuery({
    queryKey: ["supplier", id],
    queryFn: async () => {
      const res = await supplierApi.getById(id!);
      return res.data as Supplier;
    },
    enabled: isEditMode,
  });

  // --- FILTER BRANCHES ---
  const filteredBranches = branchesData?.filter((b) =>
    b.name.toLowerCase().includes(branchSearch.toLowerCase())
  );

  // --- FORM SETUP ---
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      branchId: "",
    },
  });

  // Load data for edit
  useEffect(() => {
    if (editData) {
      reset({
        name: editData.name,
        email: editData.email || "",
        phone: editData.phone,
        address: editData.address,
        branchId: editData.branchId,
      });
    }
  }, [editData, reset]);

  const selectedBranchId = watch("branchId");

  const getBranchName = (id: string) => {
    return branchesData?.find((b) => b.id === id)?.name || "Select Branch";
  };

  // --- MUTATION ---
  const mutation = useMutation({
    mutationFn: (data: SupplierFormData) => {
      if (isEditMode && id) {
        return supplierApi.update(id, data);
      }
      return supplierApi.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast({
        title: isEditMode ? "Supplier updated!" : "Supplier created!",
      });
      navigate("/suppliers");
    },
    onError: (error: any) => {
      toast({
        title: error?.response?.data?.message || "Operation failed",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SupplierFormData) => {
    mutation.mutate(data);
  };

  if (isEditMode && isLoadingEdit)
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        Loading supplier details...
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
            onClick={() => navigate("/suppliers")}
            className="rounded-full hover:bg-slate-100"
          >
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </Button>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              {isEditMode ? "Edit Supplier" : "New Supplier"}
            </h1>
            <p className="text-xs text-slate-500">
              {isEditMode
                ? "Update vendor information and contacts."
                : "Register a new supplier or vendor."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="hidden sm:flex"
            onClick={() => navigate("/suppliers")}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            disabled={mutation.isPending}
            className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 px-6"
          >
            {mutation.isPending ? "Saving..." : "Save Supplier"}
          </Button>
        </div>
      </div>

      {/* --- CONTENT AREA --- */}
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <form onSubmit={handleSubmit(onSubmit)}>
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            {/* Card Header Style */}
            <div className="bg-slate-50/50 px-6 py-3 border-b border-slate-100 flex items-center gap-2">
              <Truck className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-semibold text-slate-700">
                Supplier Profile
              </span>
            </div>

            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* NAME */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Supplier Name <span className="text-red-600">*</span>
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      {...register("name")}
                      placeholder="e.g. Global Traders Ltd."
                      className="pl-9 border-slate-200 focus-visible:ring-blue-600"
                    />
                  </div>
                  {errors.name && (
                    <p className="text-xs text-red-600">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                {/* EMAIL */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      type="email"
                      {...register("email")}
                      placeholder="contact@supplier.com"
                      className="pl-9 border-slate-200 focus-visible:ring-blue-600"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-red-600">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* PHONE */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Phone Number <span className="text-red-600">*</span>
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      {...register("phone")}
                      placeholder="+1 234 567 890"
                      className="pl-9 border-slate-200 focus-visible:ring-blue-600"
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-xs text-red-600">
                      {errors.phone.message}
                    </p>
                  )}
                </div>

                {/* BRANCH SELECTION (POPUP) */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Assigned Branch <span className="text-red-600">*</span>
                  </Label>
                  <Dialog open={isBranchOpen} onOpenChange={setIsBranchOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between h-10 bg-slate-50 border-slate-200 text-slate-700 font-normal px-3 hover:bg-slate-100 pl-9 relative"
                      >
                        <Store className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <span className="truncate">
                          {selectedBranchId
                            ? getBranchName(selectedBranchId)
                            : "Select Branch"}
                        </span>
                        <Search className="h-4 w-4 opacity-50 ml-2" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="p-0 sm:max-w-[400px]">
                      <DialogHeader className="p-4 pb-2">
                        <DialogTitle>Select Branch</DialogTitle>
                        <div className="relative mt-2">
                          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search branch..."
                            value={branchSearch}
                            onChange={(e) => setBranchSearch(e.target.value)}
                            className="pl-9"
                          />
                        </div>
                      </DialogHeader>
                      <ScrollArea className="h-[300px]">
                        <div className="p-2">
                          {filteredBranches?.map((branch) => (
                            <div
                              key={branch.id}
                              onClick={() => {
                                setValue("branchId", branch.id, {
                                  shouldValidate: true,
                                });
                                setIsBranchOpen(false);
                              }}
                              className={cn(
                                "flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-slate-100 text-sm",
                                selectedBranchId === branch.id &&
                                  "bg-blue-50 text-blue-700 font-medium"
                              )}
                            >
                              <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-slate-400" />
                                <span>{branch.name}</span>
                              </div>
                              {selectedBranchId === branch.id && (
                                <Check className="h-4 w-4 text-blue-600" />
                              )}
                            </div>
                          ))}
                          {filteredBranches?.length === 0 && (
                            <p className="text-center text-slate-400 py-4 text-sm">
                              No branch found.
                            </p>
                          )}
                        </div>
                      </ScrollArea>
                    </DialogContent>
                  </Dialog>
                  {errors.branchId && (
                    <p className="text-xs text-red-600">
                      {errors.branchId.message}
                    </p>
                  )}
                </div>

                {/* ADDRESS */}
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Full Address <span className="text-red-600">*</span>
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      {...register("address")}
                      placeholder="Street Address, City, Region"
                      className="pl-9 border-slate-200 focus-visible:ring-blue-600"
                    />
                  </div>
                  {errors.address && (
                    <p className="text-xs text-red-600">
                      {errors.address.message}
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
