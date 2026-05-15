import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Search, Check, Building2, Store } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { authApi, branchApi, organizationApi } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function AddUser() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // --- POPUP STATES ---
  const [isOrgOpen, setIsOrgOpen] = useState(false);
  const [isBranchOpen, setIsBranchOpen] = useState(false);

  const [orgSearch, setOrgSearch] = useState("");
  const [branchSearch, setBranchSearch] = useState("");

  // --- FORM STATE (Simple state for this example, or use react-hook-form) ---
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "CASHIER",
    organizationId: "",
    branchId: "",
  });

  // --- QUERIES ---
  const { data: branches } = useQuery({
    queryKey: ["branches"],
    queryFn: () => branchApi.getAll(),
  });

  const { data: orgs } = useQuery({
    queryKey: ["organizations"],
    queryFn: () => organizationApi.getAll(),
  });

  // --- FILTERED LISTS ---
  const filteredOrgs = orgs?.data?.filter((o: any) =>
    o.name.toLowerCase().includes(orgSearch.toLowerCase())
  );

  const filteredBranches = branches?.data?.filter((b: any) =>
    b.name.toLowerCase().includes(branchSearch.toLowerCase())
  );

  // --- HELPERS ---
  const getOrgName = (id: string) =>
    orgs?.data?.find((o: any) => o.id === id)?.name || "Select Organization";

  const getBranchName = (id: string) =>
    branches?.data?.find((b: any) => b.id === id)?.name || "Select Branch";

  // --- MUTATION ---
  const createUserMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: () => {
      toast({ title: "User Created Successfully" });
      navigate("/users"); // Redirect back to list
      // Note: Invalidate users query if you have one
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to create user",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.name ||
      !formData.email ||
      !formData.password ||
      !formData.organizationId
    ) {
      toast({
        title: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    createUserMutation.mutate({
      ...formData,
      branchId: formData.branchId || undefined,
    });
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/users")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-3xl font-bold text-foreground">Add New Staff</h2>
      </div>

      <div className="bg-card border rounded-lg p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* NAME */}
            <div>
              <Label>
                Full Name <span className="text-destructive">*</span>
              </Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g. Ali Khan"
                className="mt-2"
              />
            </div>

            {/* EMAIL */}
            <div>
              <Label>
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="ali@store.com"
                className="mt-2"
              />
            </div>

            {/* PASSWORD */}
            <div>
              <Label>
                Password <span className="text-destructive">*</span>
              </Label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="mt-2"
              />
            </div>

            {/* ROLE */}
            <div>
              <Label>
                Role <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.role}
                onValueChange={(val) => setFormData({ ...formData, role: val })}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASHIER">Cashier</SelectItem>
                  <SelectItem value="MANAGER">Manager</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* ORGANIZATION POPUP */}
          <div>
            <Label>
              Organization <span className="text-destructive">*</span>
            </Label>
            <Dialog open={isOrgOpen} onOpenChange={setIsOrgOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between mt-2 font-normal"
                >
                  <span className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 opacity-50" />
                    {formData.organizationId
                      ? getOrgName(formData.organizationId)
                      : "Select Organization"}
                  </span>
                  <Search className="h-4 w-4 opacity-50" />
                </Button>
              </DialogTrigger>
              <DialogContent className="p-0 sm:max-w-[400px]">
                <DialogHeader className="p-4 pb-2">
                  <DialogTitle>Select Organization</DialogTitle>
                  <Input
                    placeholder="Search organization..."
                    value={orgSearch}
                    onChange={(e) => setOrgSearch(e.target.value)}
                    className="mt-2"
                  />
                </DialogHeader>
                <ScrollArea className="h-[300px]">
                  <div className="p-2">
                    {filteredOrgs?.map((org: any) => (
                      <div
                        key={org.id}
                        onClick={() => {
                          setFormData({ ...formData, organizationId: org.id });
                          setIsOrgOpen(false);
                        }}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-md cursor-pointer hover:bg-muted",
                          formData.organizationId === org.id &&
                            "bg-muted font-medium"
                        )}
                      >
                        <span>{org.name}</span>
                        {formData.organizationId === org.id && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </div>
                    ))}
                    {filteredOrgs?.length === 0 && (
                      <p className="text-center text-muted-foreground py-4">
                        No organization found
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>
          </div>

          {/* BRANCH POPUP */}
          <div>
            <Label>
              Branch Assignment{" "}
              <span className="text-xs text-muted-foreground">
                (Optional for Admin)
              </span>
            </Label>
            <Dialog open={isBranchOpen} onOpenChange={setIsBranchOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between mt-2 font-normal"
                >
                  <span className="flex items-center gap-2">
                    <Store className="h-4 w-4 opacity-50" />
                    {formData.branchId
                      ? getBranchName(formData.branchId)
                      : "Select Branch"}
                  </span>
                  <Search className="h-4 w-4 opacity-50" />
                </Button>
              </DialogTrigger>
              <DialogContent className="p-0 sm:max-w-[400px]">
                <DialogHeader className="p-4 pb-2">
                  <DialogTitle>Select Branch</DialogTitle>
                  <Input
                    placeholder="Search branch..."
                    value={branchSearch}
                    onChange={(e) => setBranchSearch(e.target.value)}
                    className="mt-2"
                  />
                </DialogHeader>
                <ScrollArea className="h-[300px]">
                  <div className="p-2">
                    {/* Allow deselecting branch */}
                    <div
                      onClick={() => {
                        setFormData({ ...formData, branchId: "" });
                        setIsBranchOpen(false);
                      }}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-md cursor-pointer hover:bg-muted mb-1",
                        formData.branchId === "" && "bg-muted font-medium"
                      )}
                    >
                      <span className="text-muted-foreground">
                        No Branch (Global Access)
                      </span>
                      {formData.branchId === "" && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </div>

                    {filteredBranches?.map((branch: any) => (
                      <div
                        key={branch.id}
                        onClick={() => {
                          setFormData({ ...formData, branchId: branch.id });
                          setIsBranchOpen(false);
                        }}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-md cursor-pointer hover:bg-muted",
                          formData.branchId === branch.id &&
                            "bg-muted font-medium"
                        )}
                      >
                        <span>{branch.name}</span>
                        {formData.branchId === branch.id && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/users")}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createUserMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {createUserMutation.isPending ? "Creating..." : "Create Account"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
