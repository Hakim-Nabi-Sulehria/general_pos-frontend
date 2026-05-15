import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Mail,
  Building2,
  Search,
  User,
  Shield,
  Briefcase,
  CheckCircle,
  XCircle,
} from "lucide-react";

// --- UI COMPONENTS ---
import { EntityCard } from "@/components/EntityCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { authApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function Users() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  // --- 1. DATA FETCHING ---
  const { data: users, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => authApi.getAllUsers().then((res) => res.data || res),
  });

  // --- 2. FILTERING ---
  const filteredUsers = (
    Array.isArray(users) ? users : users?.data || []
  ).filter(
    (u: any) =>
      u.name?.toLowerCase().includes(query.toLowerCase()) ||
      u.email?.toLowerCase().includes(query.toLowerCase()) ||
      u.role?.toLowerCase().includes(query.toLowerCase())
  );

  // --- 3. DELETE MUTATION ---
  // const deleteMutation = useMutation({
  //   mutationFn: authAp,
  //   onSuccess: () => {
  //     queryClient.invalidateQueries({ queryKey: ["users"] });
  //     toast({ title: "User removed successfully" });
  //     setDeleteId(null);
  //   },
  //   onError: (err: any) => {
  //     toast({
  //       title: "Error",
  //       description: err.message,
  //       variant: "destructive",
  //     });
  //   },
  // });

  // --- HELPER: Role Badge Color ---
  const getRoleBadge = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-red-50 text-red-700 border-red-200";
      case "MANAGER":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "CASHIER":
        return "bg-green-50 text-green-700 border-green-200";
      default:
        return "bg-secondary";
    }
  };

  return (
    <main className="page-container">
      {/* HEADER */}
      <section className="page-header">
        <div>
          <h2>Staff Management</h2>
          <p className="page-description">
            Manage Managers, Cashiers & Admins.
          </p>
        </div>
        <Button size="sm" onClick={() => navigate("/users/new")}>
          <Plus className="h-4 w-4 mr-2" /> Add Staff
        </Button>
      </section>

      <Separator className="mb-6" />

      {/* SEARCH */}
      <div className="relative max-w-sm mb-6">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search staff by name or role..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9 h-9"
        />
      </div>

      {/* GRID CONTENT */}
      <div className="page-grid">
        {isLoading ? (
          [1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-[180px] w-full rounded-lg" />
          ))
        ) : filteredUsers.length > 0 ? (
          filteredUsers.map((user: any) => (
            <EntityCard
              key={user.id}
              title={user.name}
              subtitle={`@${user.username}`}
              image={user.avatar}
              fallback={user.name.slice(0, 2).toUpperCase()}
              // DETAILS LIST
              dataList={[
                { icon: <Mail />, label: user.email },
                {
                  icon: <Building2 />,
                  label: user.branch?.name || "Global Access",
                },
              ].filter((i) => i.label)}
              // FOOTER TAGS
              tags={[
                // Role Badge
                <Badge
                  key="role"
                  variant="outline"
                  className={`text-[10px] h-5 px-1.5 border font-medium ${getRoleBadge(
                    user.role
                  )}`}
                >
                  {user.role === "ADMIN" && <Shield className="h-3 w-3 mr-1" />}
                  {user.role === "MANAGER" && (
                    <Briefcase className="h-3 w-3 mr-1" />
                  )}
                  {user.role === "CASHIER" && <User className="h-3 w-3 mr-1" />}
                  {user.role}
                </Badge>,

                // Status Indicator
                <div
                  key="status"
                  className={`flex items-center gap-1 text-[10px] font-medium ${
                    user.isActive ? "text-green-600" : "text-destructive"
                  }`}
                >
                  {user.isActive ? (
                    <CheckCircle className="h-3 w-3" />
                  ) : (
                    <XCircle className="h-3 w-3" />
                  )}
                  {user.isActive ? "Active" : "Inactive"}
                </div>,
              ]}
              onEdit={() => navigate(`/users/edit/${user.id}`)}
              onDelete={() => setDeleteId(user.id)}
            />
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-muted-foreground border-2 border-dashed rounded-lg bg-muted/10">
            <User className="h-10 w-10 mb-2 opacity-50" />
            <p className="mb-4">No staff members found.</p>
            <Button variant="outline" onClick={() => setQuery("")}>
              Clear Search
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}
