import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Plus, Mail, Phone, MapPin } from "lucide-react";

// Using Generic Card & UI Components
import { EntityCard } from "@/components/EntityCard";
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

import { organizationApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function Organizations() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["orgs"],
    queryFn: () => organizationApi.getAll().then((res) => res.data || res),
  });

  const orgs = (Array.isArray(data) ? data : data?.data || []).filter(
    (o: any) => o.name.toLowerCase().includes(query.toLowerCase())
  );

  const { mutate: deleteOrg } = useMutation({
    mutationFn: organizationApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orgs"] });
      toast({ title: "Deleted" });
      setDeleteId(null);
    },
  });

  return (
    <div className="space-y-4 p-6 w-full max-w-7xl mx-auto">
      {/* Header UI */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Organizations</h2>
          <p className="text-muted-foreground text-sm">
            Manage your companies.
          </p>
        </div>
        <Button size="sm" onClick={() => navigate("/organizations/new")}>
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

      {/* Grid UI */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {isLoading
          ? [1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[180px] w-full rounded-lg" />
            ))
          : orgs.map((org: any) => (
              <EntityCard
                key={org.id}
                title={org.name}
                subtitle={`#${org.id.slice(0, 6)}`}
                image={org.logo}
                fallback={org.name.slice(0, 2).toUpperCase()}
                // Props Data Passing
                dataList={[
                  { icon: <Mail className="h-3.5 w-3.5" />, label: org.email },
                  { icon: <Phone className="h-3.5 w-3.5" />, label: org.phone },
                  {
                    icon: <MapPin className="h-3.5 w-3.5" />,
                    label: org.address,
                  },
                ].filter((i) => i.label)} // Remove empty fields
                tags={[org.currency, org.timezone].filter(Boolean)}
                onEdit={() => navigate(`/organizations/edit/${org.id}`)}
                onDelete={() => setDeleteId(org.id)}
              />
            ))}
      </div>

      {/* Alert Dialog UI */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteOrg(deleteId)}
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
