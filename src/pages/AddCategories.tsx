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
  Tag,
  GitFork,
  FileText,
  Layers,
} from "lucide-react";

// --- UI COMPONENTS ---
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { categoryApi } from "@/lib/api";
import { cn } from "@/lib/utils";

// --- TYPES & INTERFACES ---
// Ye interface apky backend data structure k hisab se hai
interface Category {
  id: string;
  name: string;
  description?: string;
  parentId?: string | null;
}

// --- SCHEMA ---
const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  // parentId form me "none" ho skta hai, isliye string allow kia hai
  parentId: z.string().nullable().optional(),
});

type CategoryFormData = z.infer<typeof categorySchema>;

export default function AddCategory() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // --- POPUP STATE ---
  const [isParentOpen, setIsParentOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // --- FETCH ALL CATEGORIES ---
  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    // Yahan assume kr rhy hain k api.getAll() { data: Category[] } return krta hai
    queryFn: async () => {
      const res = await categoryApi.getAll();
      return res.data as Category[];
    },
  });

  // --- FETCH SINGLE CATEGORY (Edit Mode) ---
  const { data: editData, isLoading: isLoadingEdit } = useQuery({
    queryKey: ["category", id],
    queryFn: async () => {
      // id as string use kia takay undefined error na aye
      const res = await categoryApi.getOne(id as string);
      return res.data as Category; // ya sirf res return kren agr api direct data deti hai
    },
    enabled: isEditMode && !!id,
  });

  // --- FORM SETUP ---
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      description: "",
      parentId: "none", // Internal value for "No Parent"
    },
  });

  // Load Data on Edit
  useEffect(() => {
    if (editData) {
      reset({
        name: editData.name,
        description: editData.description || "",
        parentId: editData.parentId || "none",
      });
    }
  }, [editData, reset]);

  const selectedParentId = watch("parentId");

  // Helper to get parent name
  const getParentName = () => {
    if (!selectedParentId || selectedParentId === "none")
      return "None (Main Category)";

    // Type checking k liye 'find' safely use kia
    const parent = categoriesData?.find((c) => c.id === selectedParentId);
    return parent ? parent.name : "Unknown Category";
  };

  // Filter categories for Popup (Search + Exclude Self)
  const filteredCategories = categoriesData?.filter((c) => {
    const matchesSearch = c.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const isNotSelf = c.id !== id; // Cannot be parent of itself
    return matchesSearch && isNotSelf;
  });

  // --- MUTATION ---
  const mutation = useMutation({
    mutationFn: (data: CategoryFormData) => {
      // API expects null for root categories, not "none"
      const payload = {
        ...data,
        parentId: data.parentId === "none" ? null : data.parentId,
      };

      if (isEditMode && id) {
        return categoryApi.update(id, payload);
      }
      return categoryApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast({
        title: isEditMode ? "Category updated!" : "Category created!",
      });
      navigate("/categories");
    },
    onError: (error: any) => {
      toast({
        title: error?.response?.data?.message || "Operation failed",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CategoryFormData) => {
    mutation.mutate(data);
  };

  if (isEditMode && isLoadingEdit)
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        Loading category details...
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
            onClick={() => navigate("/categories")}
            className="rounded-full hover:bg-slate-100"
          >
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </Button>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              {isEditMode ? "Edit Category" : "New Category"}
            </h1>
            <p className="text-xs text-slate-500">
              {isEditMode
                ? "Modify category details and hierarchy."
                : "Create a new product category."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="hidden sm:flex"
            onClick={() => navigate("/categories")}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            disabled={mutation.isPending}
            className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 px-6"
          >
            {mutation.isPending ? "Saving..." : "Save Category"}
          </Button>
        </div>
      </div>

      {/* --- CONTENT AREA --- */}
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <form onSubmit={handleSubmit(onSubmit)}>
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            {/* Card Header Style */}
            <div className="bg-slate-50/50 px-6 py-3 border-b border-slate-100 flex items-center gap-2">
              <Layers className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-semibold text-slate-700">
                Category Information
              </span>
            </div>

            <CardContent className="p-6 space-y-6">
              {/* NAME INPUT */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Category Name <span className="text-red-600">*</span>
                </Label>
                <div className="relative">
                  <Tag className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    {...register("name")}
                    className="pl-9 border-slate-200 focus-visible:ring-blue-600"
                    placeholder="e.g. Electronics"
                  />
                </div>
                {errors.name && (
                  <p className="text-xs text-red-600">{errors.name.message}</p>
                )}
              </div>

              {/* PARENT CATEGORY (POPUP / DIALOG) */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Parent Category
                </Label>
                <Dialog open={isParentOpen} onOpenChange={setIsParentOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between h-10 bg-slate-50 border-slate-200 text-slate-700 font-normal px-3 hover:bg-slate-100 pl-9 relative"
                    >
                      <GitFork className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <span className="truncate">{getParentName()}</span>
                      <Search className="h-4 w-4 opacity-50 ml-2" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="p-0 sm:max-w-[400px]">
                    <DialogHeader className="p-4 pb-0">
                      <DialogTitle>Select Parent Category</DialogTitle>
                    </DialogHeader>

                    {/* Search Bar inside Popup */}
                    <div className="p-4 border-b">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search category..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                    </div>

                    <ScrollArea className="h-[300px] p-2">
                      {/* Option: None (Root) */}
                      <div
                        onClick={() => {
                          setValue("parentId", "none", {
                            shouldValidate: true,
                          });
                          setIsParentOpen(false);
                        }}
                        className={cn(
                          "flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-slate-100 text-sm",
                          selectedParentId === "none" &&
                            "bg-blue-50 text-blue-700 font-medium"
                        )}
                      >
                        <span>None (Main Category)</span>
                        {selectedParentId === "none" && (
                          <Check className="h-4 w-4 text-blue-600" />
                        )}
                      </div>

                      {/* Categories List */}
                      {filteredCategories?.map((cat) => (
                        <div
                          key={cat.id}
                          onClick={() => {
                            setValue("parentId", cat.id, {
                              shouldValidate: true,
                            });
                            setIsParentOpen(false);
                          }}
                          className={cn(
                            "flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-slate-100 text-sm",
                            selectedParentId === cat.id &&
                              "bg-blue-50 text-blue-700 font-medium"
                          )}
                        >
                          <span>{cat.name}</span>
                          {selectedParentId === cat.id && (
                            <Check className="h-4 w-4 text-blue-600" />
                          )}
                        </div>
                      ))}

                      {filteredCategories?.length === 0 && (
                        <p className="text-center text-slate-400 py-4 text-sm">
                          No other categories found.
                        </p>
                      )}
                    </ScrollArea>
                  </DialogContent>
                </Dialog>
                <p className="text-[11px] text-slate-400">
                  Select "None" if this is a top-level category.
                </p>
              </div>

              {/* DESCRIPTION */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Description
                </Label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Textarea
                    {...register("description")}
                    placeholder="Enter category description..."
                    rows={4}
                    className="pl-9 border-slate-200 focus-visible:ring-blue-600 min-h-[100px]"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}
