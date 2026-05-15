import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Plus, Mail, Phone, MapPin, Building2, Search } from "lucide-react";

// --- UI COMPONENTS ---
import { EntityCard } from "@/components/EntityCard"; // Reusable Card
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

import { supplierApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function Suppliers() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  // --- 1. DATA FETCHING ---
  const { data: suppliers, isLoading } = useQuery({
    queryKey: ["suppliers"],
    queryFn: () => supplierApi.getAll().then((res) => res.data || res),
  });

  // --- 2. FILTERING ---
  const filteredSuppliers = (
    Array.isArray(suppliers) ? suppliers : suppliers?.data || []
  ).filter(
    (s: any) =>
      s.name?.toLowerCase().includes(query.toLowerCase()) ||
      s.email?.toLowerCase().includes(query.toLowerCase())
  );

  // --- 3. DELETE MUTATION ---
  const deleteMutation = useMutation({
    mutationFn: supplierApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast({ title: "Supplier deleted successfully" });
      setDeleteId(null);
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  return (
    <main className="page-container">
      {/* HEADER SECTION */}
      <section className="page-header">
        <div>
          <h2>Suppliers</h2>
          <p className="page-description">
            Manage your supplier relationships.
          </p>
        </div>
        <Button onClick={() => navigate("/suppliers/new")}>
          <Plus className="h-4 w-4 mr-2" /> Add Supplier
        </Button>
      </section>

      <Separator className="mb-6" />

      {/* SEARCH BAR */}
      <div className="relative max-w-sm mb-6">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search suppliers by name or email..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9 h-9"
        />
      </div>

      {/* GRID CONTENT */}
      <div className="page-grid">
        {isLoading ? (
          // SKELETON LOADING
          [1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-[180px] w-full rounded-lg" />
          ))
        ) : filteredSuppliers.length > 0 ? (
          filteredSuppliers.map((supplier: any) => (
            <EntityCard
              key={supplier.id}
              title={supplier.name}
              subtitle={supplier.contactPerson} // Optional subtitle if available
              image={supplier.logo} // Optional logo
              fallback={supplier.name.slice(0, 2).toUpperCase()}
              // DETAILS LIST
              dataList={[
                { icon: <Mail />, label: supplier.email },
                { icon: <Phone />, label: supplier.phone },
                { icon: <MapPin />, label: supplier.address },
              ].filter((i) => i.label)}
              tags={[
                supplier.branch && (
                  <div
                    key="branch"
                    className="flex items-center gap-1.5 text-[10px] text-muted-foreground"
                  >
                    <Building2 className="icon-compact opacity-70" />
                    <span className="truncate max-w-[150px]">
                      {supplier.branch.name}
                    </span>
                  </div>
                ),
              ].filter(Boolean)}
              onEdit={() => navigate(`/suppliers/edit/${supplier.id}`)}
              onDelete={() => setDeleteId(supplier.id)}
            />
          ))
        ) : (
          // EMPTY STATE
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-muted-foreground border-2 border-dashed rounded-lg bg-muted/10">
            <p className="mb-4">No suppliers found.</p>
            <Button variant="outline" onClick={() => setQuery("")}>
              Clear Search
            </Button>
          </div>
        )}
      </div>

      {/* DELETE DIALOG */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              supplier record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
