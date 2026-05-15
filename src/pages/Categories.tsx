import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  CornerDownRight,
  MoreVertical,
} from "lucide-react";

// --- STRICT SHADCN UI IMPORTS ---
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

import { categoryApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function Categories() {
  const navigate = useNavigate();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // --- QUERY ---
  const { data: categories, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoryApi.getAll().then((res) => res.data || res),
  });

  // --- MUTATION ---
  const deleteMutation = useMutation({
    mutationFn: categoryApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast({ title: "Category deleted" });
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

  // --- LOGIC ---
  const toggleExpand = (id: string) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  const { rootCategories, getChildren } = useMemo(() => {
    const allCats = Array.isArray(categories)
      ? categories
      : categories?.data || [];
    if (searchQuery) {
      const matches = allCats.filter((c: any) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      return { rootCategories: matches, getChildren: () => [] };
    }
    const roots = allCats.filter((c: any) => !c.parentId);
    const getKids = (parentId: string) =>
      allCats.filter((c: any) => c.parentId === parentId);
    return { rootCategories: roots, getChildren: getKids };
  }, [categories, searchQuery]);

  return (
    <main className="page-container">
      {/* HEADER */}
      <section className="page-header">
        <div className="font-extrabold">
          <h2>Categories</h2>
        </div>
        <Button size="sm" onClick={() => navigate("/categories/new")}>
          <Plus className="mr-2 h-4 w-4" /> Add Category
        </Button>
      </section>

      <Separator className="mb-6" />

      {/* SEARCH */}
      <Input
        placeholder="Search categories..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="max-w-sm h-9 mb-6"
      />

      {/* LIST USING CARD UI */}
      <div className="space-y-4">
        {isLoading ? (
          [1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-1/3" />
              </CardHeader>
            </Card>
          ))
        ) : rootCategories.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg bg-muted/10">
            No categories found.
          </div>
        ) : (
          rootCategories.map((cat: any) => {
            const children = getChildren(cat.id);
            const hasChildren = children.length > 0;
            const isExpanded = expanded[cat.id];

            return (
              // MAIN PARENT CARD
              <Card key={cat.id} className="group overflow-hidden">
                {/* PARENT ROW (Header) */}
                <CardHeader className="flex flex-row items-center justify-between p-4 space-y-0">
                  <div
                    className="flex items-center gap-3 cursor-pointer select-none"
                    onClick={() => hasChildren && toggleExpand(cat.id)}
                  >
                    {/* Expand Icon */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      disabled={!hasChildren}
                    >
                      {hasChildren ? (
                        isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )
                      ) : (
                        <span className="h-4 w-4 block" /> // Spacer
                      )}
                    </Button>

                    {/* Title & Badge */}
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-sm font-semibold">
                        {cat.name}
                      </CardTitle>
                      {hasChildren && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] h-5 px-1.5"
                        >
                          {children.length}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Actions Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => navigate(`/categories/edit/${cat.id}`)}
                      >
                        <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setDeleteId(cat.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>

                {/* CHILDREN LIST (Content) */}
                {isExpanded && hasChildren && (
                  <>
                    <Separator />
                    <CardContent className="p-0 bg-muted/5">
                      {children.map((child: any) => (
                        <div
                          key={child.id}
                          className="flex items-center justify-between p-3 pl-14 border-b last:border-0 hover:bg-muted/10 group/child"
                        >
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <CornerDownRight className="h-3.5 w-3.5 opacity-50" />
                            <span>{child.name}</span>
                          </div>

                          {/* Child Actions (Visible on Hover) */}
                          <div className="flex gap-1 opacity-0 group-hover/child:opacity-100 transition-opacity pr-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() =>
                                navigate(`/categories/edit/${child.id}`)
                              }
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive"
                              onClick={() => setDeleteId(child.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </>
                )}
              </Card>
            );
          })
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              Parent deletion removes all sub-categories.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
