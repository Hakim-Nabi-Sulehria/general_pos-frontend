import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  MapPin,
  Globe,
  Coins,
  LayoutDashboard, // Icon for the card header
} from "lucide-react";

// --- UI COMPONENTS ---
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { organizationApi } from "@/lib/api";

// --- SCHEMA ---
const organizationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone number is required"),
  address: z.string().min(1, "Address is required"),
  timezone: z.string().optional(),
  currency: z.string().optional(),
});

type OrganizationFormData = z.infer<typeof organizationSchema>;

export default function AddOrganization() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // --- QUERIES ---
  const { data: editData, isLoading: isLoadingEdit } = useQuery({
    queryKey: ["organizations"],
    queryFn: () => organizationApi.getAll().then((res) => res.data),
    select: (data) => data?.find((item: any) => item.id === id),
    enabled: isEditMode,
  });

  // --- FORM ---
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<OrganizationFormData>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      timezone: "",
      currency: "",
    },
  });

  useEffect(() => {
    if (editData) {
      const data = editData; // Depending on API structure, adjust if needed
      reset({
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        timezone: data.timezone || "",
        currency: data.currency || "",
      });
    }
  }, [editData, reset]);

  // --- MUTATION ---
  const mutation = useMutation({
    mutationFn: (data: OrganizationFormData) =>
      isEditMode
        ? organizationApi.update(id!, data)
        : organizationApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orgs"] });
      toast({
        title: isEditMode ? "Organization Updated" : "Organization Created",
      });
      navigate("/organizations");
    },
    onError: (error: any) =>
      toast({
        title: "Failed",
        description: error?.response?.data?.message,
        variant: "destructive",
      }),
  });

  const onSubmit = (data: OrganizationFormData) => {
    mutation.mutate(data);
  };

  if (isEditMode && isLoadingEdit)
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        Loading organization details...
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
            onClick={() => navigate("/organizations")}
            className="rounded-full hover:bg-slate-100"
          >
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </Button>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              {isEditMode ? "Edit Organization" : "New Organization"}
            </h1>
            <p className="text-xs text-slate-500">
              {isEditMode
                ? "Update organization details and settings."
                : "Create a new organization entity."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="hidden sm:flex"
            onClick={() => navigate("/organizations")}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            disabled={mutation.isPending}
            className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 px-6"
          >
            {mutation.isPending ? "Saving..." : "Save Organization"}
          </Button>
        </div>
      </div>

      {/* --- CONTENT AREA (Wider Card) --- */}
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <form onSubmit={handleSubmit(onSubmit)}>
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            {/* Card Header Style */}
            <div className="bg-slate-50/50 px-6 py-3 border-b border-slate-100 flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-semibold text-slate-700">
                Organization Details
              </span>
            </div>

            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Name <span className="text-red-600">*</span>
                  </Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      {...register("name")}
                      className="pl-9 border-slate-200 focus-visible:ring-blue-600"
                      placeholder="Acme Corp"
                    />
                  </div>
                  {errors.name && (
                    <p className="text-xs text-red-600">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Email <span className="text-red-600">*</span>
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      {...register("email")}
                      className="pl-9 border-slate-200 focus-visible:ring-blue-600"
                      placeholder="contact@acme.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-red-600">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Phone <span className="text-red-600">*</span>
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      {...register("phone")}
                      className="pl-9 border-slate-200 focus-visible:ring-blue-600"
                      placeholder="+1 234 567 890"
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-xs text-red-600">
                      {errors.phone.message}
                    </p>
                  )}
                </div>

                {/* Currency */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Currency Code
                  </Label>
                  <div className="relative">
                    <Coins className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      {...register("currency")}
                      className="pl-9 border-slate-200 focus-visible:ring-blue-600"
                      placeholder="USD"
                    />
                  </div>
                </div>

                {/* Timezone */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Timezone
                  </Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      {...register("timezone")}
                      className="pl-9 border-slate-200 focus-visible:ring-blue-600"
                      placeholder="UTC"
                    />
                  </div>
                </div>

                {/* Address (Full Width) */}
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Address <span className="text-red-600">*</span>
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      {...register("address")}
                      className="pl-9 border-slate-200 focus-visible:ring-blue-600"
                      placeholder="123 Business St, City, Country"
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
