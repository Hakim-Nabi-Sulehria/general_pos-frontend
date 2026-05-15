import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft,
  Save,
  Search,
  Check,
  Building2,
  MapPin,
  Phone,
  Hash,
  GitBranch,
} from "lucide-react";

// --- UI COMPONENTS ---
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

import { useToast } from "@/hooks/use-toast";
import { branchApi, organizationApi } from "@/lib/api";

// --- SCHEMA ---
const branchSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required"),
  address: z.string().min(1, "Address is required"),
  contactNumber: z.string().min(1, "Contact number is required"),
  organizationId: z.string().min(1, "Organization is required"),
});

type BranchFormData = z.infer<typeof branchSchema>;

export default function AddBranch() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isOrgOpen, setIsOrgOpen] = useState(false);
  const [orgSearch, setOrgSearch] = useState("");

  // --- QUERIES ---
  const { data: organizations } = useQuery({
    queryKey: ["organizations"],
    queryFn: () => organizationApi.getAll(),
  });
  const { data: editData, isLoading: isLoadingEdit } = useQuery({
    queryKey: ["branch", id],
    queryFn: () => branchApi.getById(id!),
    enabled: isEditMode,
  });

  const filteredOrgs = organizations?.data?.filter((org: any) =>
    org.name.toLowerCase().includes(orgSearch.toLowerCase())
  );

  // --- FORM ---
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<BranchFormData>({
    resolver: zodResolver(branchSchema),
    defaultValues: {
      name: "",
      code: "",
      address: "",
      contactNumber: "",
      organizationId: "",
    },
  });

  useEffect(() => {
    if (editData && editData.data) {
      // Check if data exists
      const branch = editData.data; // Extract data here
      reset({
        name: branch.name,
        code: branch.code,
        address: branch.address,
        contactNumber: branch.contactNumber,
        organizationId: branch.organizationId,
      });
    }
  }, [editData, reset]);

  const selectedOrgId = watch("organizationId");
  const getOrgName = (id: string) =>
    organizations?.data?.find((o: any) => o.id === id)?.name ||
    "Select Organization";

  // --- MUTATION ---
  const mutation = useMutation({
    mutationFn: (data: BranchFormData) =>
      isEditMode ? branchApi.update(id!, data) : branchApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      toast({ title: isEditMode ? "Branch updated!" : "Branch created!" });
      navigate("/branches");
    },
    onError: (error: any) =>
      toast({
        title: "Failed",
        description: error?.response?.data?.message,
        variant: "destructive",
      }),
  });

  const onSubmit = (data: BranchFormData) => {
    mutation.mutate(data);
  };

  if (isEditMode && isLoadingEdit)
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        Loading branch details...
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
            onClick={() => navigate("/branches")}
            className="rounded-full hover:bg-slate-100"
          >
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </Button>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              {isEditMode ? "Edit Branch" : "New Branch"}
            </h1>
            <p className="text-xs text-slate-500">
              {isEditMode
                ? "Update location details and settings."
                : "Add a new physical location to your network."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="hidden sm:flex"
            onClick={() => navigate("/branches")}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            disabled={mutation.isPending}
            className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 px-6"
          >
            {mutation.isPending ? "Saving..." : "Save Branch"}
          </Button>
        </div>
      </div>

      {/* --- CONTENT AREA (Wider Card) --- */}
      {/* Change: max-w-4xl ko barha kar max-w-6xl kar diya hai */}
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <form onSubmit={handleSubmit(onSubmit)}>
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            {/* Card Header Style */}
            <div className="bg-slate-50/50 px-6 py-3 border-b border-slate-100 flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-semibold text-slate-700">
                Location Details
              </span>
            </div>

            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Branch Name <span className="text-red-600">*</span>
                  </Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      {...register("name")}
                      className="pl-9 border-slate-200 focus-visible:ring-blue-600"
                      placeholder="e.g. Downtown HQ"
                    />
                  </div>
                  {errors.name && (
                    <p className="text-xs text-red-600">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                {/* Code */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Branch Code <span className="text-red-600">*</span>
                  </Label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      {...register("code")}
                      className="pl-9 border-slate-200 focus-visible:ring-blue-600"
                      placeholder="e.g. BR-001"
                    />
                  </div>
                  {errors.code && (
                    <p className="text-xs text-red-600">
                      {errors.code.message}
                    </p>
                  )}
                </div>

                {/* Organization Select */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Organization <span className="text-red-600">*</span>
                  </Label>
                  <Dialog open={isOrgOpen} onOpenChange={setIsOrgOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between h-10 bg-slate-50 border-slate-200 text-slate-700 font-normal px-3 hover:bg-slate-100"
                      >
                        <span className="flex items-center gap-2 truncate">
                          <Building2 className="h-4 w-4 opacity-50" />
                          {selectedOrgId
                            ? getOrgName(selectedOrgId)
                            : "Select Organization"}
                        </span>
                        <Search className="h-4 w-4 opacity-50" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="p-0 sm:max-w-[400px]">
                      <DialogHeader className="p-4 pb-0">
                        <DialogTitle>Select Organization</DialogTitle>
                        <div className="relative mt-2">
                          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search org..."
                            value={orgSearch}
                            onChange={(e) => setOrgSearch(e.target.value)}
                            className="pl-9"
                          />
                        </div>
                      </DialogHeader>
                      <ScrollArea className="h-[200px] p-2">
                        {filteredOrgs?.length === 0 ? (
                          <p className="text-center text-sm text-muted-foreground py-4">
                            No results found.
                          </p>
                        ) : (
                          filteredOrgs?.map((org: any) => (
                            <div
                              key={org.id}
                              onClick={() => {
                                setValue("organizationId", org.id, {
                                  shouldValidate: true,
                                });
                                setIsOrgOpen(false);
                              }}
                              className={cn(
                                "flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-slate-100 text-sm",
                                selectedOrgId === org.id &&
                                  "bg-blue-50 text-blue-700 font-medium"
                              )}
                            >
                              <span>{org.name}</span>
                              {selectedOrgId === org.id && (
                                <Check className="h-4 w-4 text-blue-600" />
                              )}
                            </div>
                          ))
                        )}
                      </ScrollArea>
                    </DialogContent>
                  </Dialog>
                  {errors.organizationId && (
                    <p className="text-xs text-red-600">
                      {errors.organizationId.message}
                    </p>
                  )}
                </div>

                {/* Contact */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Contact Number <span className="text-red-600">*</span>
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      {...register("contactNumber")}
                      className="pl-9 border-slate-200 focus-visible:ring-blue-600"
                      placeholder="e.g. +1 234 567 890"
                    />
                  </div>
                  {errors.contactNumber && (
                    <p className="text-xs text-red-600">
                      {errors.contactNumber.message}
                    </p>
                  )}
                </div>

                {/* Address (Full Width) */}
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Full Address <span className="text-red-600">*</span>
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      {...register("address")}
                      className="pl-9 border-slate-200 focus-visible:ring-blue-600"
                      placeholder="e.g. 123 Innovation Blvd, Tech City"
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
