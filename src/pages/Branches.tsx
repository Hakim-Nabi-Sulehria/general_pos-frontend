import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Plus, Phone, MapPin, Building2, Tag } from "lucide-react";

import { EntityCard } from "@/components/EntityCard"; // Reused Component
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
import { branchApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function Branches() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["branches"],
    queryFn: () => branchApi.getAll().then((res) => res.data || res),
  });

  const branches = (Array.isArray(data) ? data : data?.data || []).filter(
    (b: any) => b.name.toLowerCase().includes(query.toLowerCase())
  );

  const { mutate: deleteBranch } = useMutation({
    mutationFn: branchApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      toast({ title: "Deleted" });
      setDeleteId(null);
    },
  });

  return (
    <div className="space-y-4 p-6 w-full max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Branches</h2>
          <p className="text-muted-foreground text-sm">Manage locations.</p>
        </div>
        <Button size="sm" onClick={() => navigate("/branches/new")}>
          <Plus className="mr-2 h-4 w-4" /> Add New
        </Button>
      </div>
      <Separator />

      <Input
        placeholder="Search..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="max-w-sm h-9"
      />

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {isLoading
          ? [1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[180px] w-full rounded-lg" />
            ))
          : branches.map((b: any) => (
              <EntityCard
                key={b.id}
                title={b.name}
                subtitle={b.code}
                fallback="BR"
                // Props Data specific to Branch
                dataList={[
                  {
                    icon: <MapPin className="h-3.5 w-3.5" />,
                    label: b.address,
                  },
                  {
                    icon: <Phone className="h-3.5 w-3.5" />,
                    label: b.contactNumber,
                  },
                  {
                    icon: <Building2 className="h-3.5 w-3.5" />,
                    label: b.organization?.name,
                  },
                ].filter((i) => i.label)}
                onEdit={() => navigate(`/branches/edit/${b.id}`)}
                onDelete={() => setDeleteId(b.id)}
              />
            ))}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              Action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteBranch(deleteId)}
              className="bg-destructive"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
