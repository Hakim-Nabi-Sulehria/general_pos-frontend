import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Search,
  Check,
  Store,
  Box,
} from "lucide-react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { transferApi, branchApi, productApi } from "@/lib/api";
import { cn } from "@/lib/utils";

interface TransferItem {
  productId: string;
  productName?: string;
  quantity: number;
}

export default function AddTransfer() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // --- FORM STATE ---
  const [sourceBranchId, setSourceBranchId] = useState("");
  const [destinationBranchId, setDestinationBranchId] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<TransferItem[]>([]);

  // --- POPUP STATES ---
  const [isSourceOpen, setIsSourceOpen] = useState(false);
  const [isDestOpen, setIsDestOpen] = useState(false);

  // Product Popup Logic (needs to track which row triggered it)
  const [activeRowIndex, setActiveRowIndex] = useState<number | null>(null);
  const [isProductOpen, setIsProductOpen] = useState(false);

  // Search States inside Popups
  const [branchSearch, setBranchSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");

  // --- QUERIES ---
  const { data: branches } = useQuery({
    queryKey: ["branches"],
    queryFn: () => branchApi.getAll(),
  });

  const { data: products } = useQuery({
    queryKey: ["products"],
    queryFn: () => productApi.getAll(),
  });

  // --- FILTER LOGIC ---
  const filteredBranches = branches?.data?.filter((b: any) =>
    b.name.toLowerCase().includes(branchSearch.toLowerCase())
  );

  // Filter products: Only show products belonging to Source Branch
  const sourceBranchProducts = useMemo(() => {
    if (!sourceBranchId) return [];
    return (
      products?.data?.filter((p: any) => {
        // Search Filter
        if (!p.name.toLowerCase().includes(productSearch.toLowerCase()))
          return false;

        // Branch Filter
        if (p.branchId === sourceBranchId) return true;
        if (
          Array.isArray(p.branches) &&
          p.branches.some((b: any) => b.id === sourceBranchId)
        )
          return true;
        return false;
      }) || []
    );
  }, [products, sourceBranchId, productSearch]);

  // --- HELPERS ---
  const getBranchName = (id: string) => {
    return (
      branches?.data?.find((b: any) => b.id === id)?.name || "Select Branch"
    );
  };

  const addItem = () => {
    setItems([...items, { productId: "", quantity: 1 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItemQuantity = (index: number, qty: number) => {
    const newItems = [...items];
    newItems[index].quantity = qty;
    setItems(newItems);
  };

  const handleProductSelect = (product: any) => {
    if (activeRowIndex === null) return;

    const newItems = [...items];
    newItems[activeRowIndex] = {
      ...newItems[activeRowIndex],
      productId: product.id,
      productName: product.name,
    };
    setItems(newItems);
    setIsProductOpen(false); // Close popup
    setActiveRowIndex(null);
  };

  // --- MUTATION ---
  const createMutation = useMutation({
    mutationFn: transferApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transfers"] });
      toast({ title: "Transfer created successfully" });
      navigate("/transfers");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create transfer",
        description: error?.response?.data?.message || "Validation failed",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!sourceBranchId || !destinationBranchId || items.length === 0) {
      toast({ title: "Please fill all fields", variant: "destructive" });
      return;
    }
    if (sourceBranchId === destinationBranchId) {
      toast({
        title: "Source and Destination cannot be same",
        variant: "destructive",
      });
      return;
    }
    const hasInvalidItems = items.some((i) => !i.productId || i.quantity <= 0);
    if (hasInvalidItems) {
      toast({
        title: "Check items quantity and product selection",
        variant: "destructive",
      });
      return;
    }

    createMutation.mutate({
      fromBranchId: sourceBranchId,
      toBranchId: destinationBranchId,
      notes,
      items: items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
      })),
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/transfers")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-3xl font-bold text-foreground">New Transfer</h2>
      </div>

      <div className="bg-card border rounded-lg p-6 shadow-sm space-y-6">
        {/* --- BRANCH SELECTION ROW --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* SOURCE BRANCH POPUP */}
          <div>
            <Label>
              Source Branch (From) <span className="text-red-600">*</span>
            </Label>
            <Dialog open={isSourceOpen} onOpenChange={setIsSourceOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between mt-2 font-normal h-11"
                >
                  <span className="flex items-center gap-2">
                    <Store className="h-4 w-4 opacity-50" />
                    {getBranchName(sourceBranchId)}
                  </span>
                  <Search className="h-4 w-4 opacity-50" />
                </Button>
              </DialogTrigger>
              <DialogContent className="p-0">
                <DialogHeader className="p-4 pb-2">
                  <DialogTitle>Select Source Branch</DialogTitle>
                  <Input
                    placeholder="Search branch..."
                    value={branchSearch}
                    onChange={(e) => setBranchSearch(e.target.value)}
                    className="mt-2"
                  />
                </DialogHeader>
                <ScrollArea className="h-[300px]">
                  <div className="p-2">
                    {filteredBranches?.map((branch: any) => (
                      <div
                        key={branch.id}
                        onClick={() => {
                          setSourceBranchId(branch.id);
                          setItems([]); // Reset items if branch changes
                          setIsSourceOpen(false);
                        }}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-md cursor-pointer hover:bg-muted",
                          sourceBranchId === branch.id && "bg-muted font-medium"
                        )}
                      >
                        <span>{branch.name}</span>
                        {sourceBranchId === branch.id && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>
          </div>

          {/* DESTINATION BRANCH POPUP */}
          <div>
            <Label>
              Destination Branch (To) <span className="text-red-600">*</span>
            </Label>
            <Dialog open={isDestOpen} onOpenChange={setIsDestOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between mt-2 font-normal h-11"
                >
                  <span className="flex items-center gap-2">
                    <Store className="h-4 w-4 opacity-50" />
                    {getBranchName(destinationBranchId)}
                  </span>
                  <Search className="h-4 w-4 opacity-50" />
                </Button>
              </DialogTrigger>
              <DialogContent className="p-0">
                <DialogHeader className="p-4 pb-2">
                  <DialogTitle>Select Destination Branch</DialogTitle>
                  <Input
                    placeholder="Search branch..."
                    value={branchSearch}
                    onChange={(e) => setBranchSearch(e.target.value)}
                    className="mt-2"
                  />
                </DialogHeader>
                <ScrollArea className="h-[300px]">
                  <div className="p-2">
                    {filteredBranches?.map((branch: any) => (
                      <div
                        key={branch.id}
                        onClick={() => {
                          setDestinationBranchId(branch.id);
                          setIsDestOpen(false);
                        }}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-md cursor-pointer hover:bg-muted",
                          destinationBranchId === branch.id &&
                            "bg-muted font-medium"
                        )}
                      >
                        <span>{branch.name}</span>
                        {destinationBranchId === branch.id && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* NOTES */}
        <div>
          <Label>Notes</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional notes..."
            className="mt-2"
          />
        </div>

        {/* --- ITEMS SECTION --- */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Transfer Items</h3>
            <Button onClick={addItem} size="sm" disabled={!sourceBranchId}>
              <Plus className="h-4 w-4 mr-2" /> Add Item
            </Button>
          </div>

          {!sourceBranchId && (
            <div className="text-center p-6 border border-dashed rounded-lg text-muted-foreground bg-muted/20">
              Select a Source Branch first to load available products.
            </div>
          )}

          <div className="space-y-3">
            {items.map((item, index) => (
              <div
                key={index}
                className="flex gap-4 items-end border p-4 rounded-lg bg-card/50"
              >
                {/* PRODUCT SELECTION POPUP */}
                <div className="flex-1 space-y-2">
                  <Label>Product</Label>
                  <Dialog
                    open={isProductOpen && activeRowIndex === index}
                    onOpenChange={(open) => {
                      if (open) {
                        setIsProductOpen(true);
                        setActiveRowIndex(index);
                      } else {
                        setIsProductOpen(false);
                        setActiveRowIndex(null);
                      }
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-between font-normal"
                      >
                        <span className="truncate">
                          {item.productName || "Select Product"}
                        </span>
                        <Search className="h-4 w-4 opacity-50 shrink-0" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="p-0 sm:max-w-[500px]">
                      <DialogHeader className="p-4 pb-2">
                        <DialogTitle>Select Product</DialogTitle>
                        <Input
                          placeholder="Search product..."
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          className="mt-2"
                        />
                      </DialogHeader>
                      <ScrollArea className="h-[300px]">
                        <div className="p-2">
                          {sourceBranchProducts.length === 0 ? (
                            <p className="text-center text-muted-foreground py-4">
                              No products found in source branch.
                            </p>
                          ) : (
                            sourceBranchProducts.map((p: any) => (
                              <div
                                key={p.id}
                                onClick={() => handleProductSelect(p)}
                                className={cn(
                                  "flex items-center justify-between p-3 rounded-md cursor-pointer hover:bg-muted",
                                  item.productId === p.id &&
                                    "bg-muted font-medium"
                                )}
                              >
                                <div className="flex flex-col">
                                  <span>{p.name}</span>
                                  <span className="text-xs text-muted-foreground">
                                    SKU: {p.sku} | Stock: {p.stockQuantity}
                                  </span>
                                </div>
                                {item.productId === p.id && (
                                  <Check className="h-4 w-4 text-primary" />
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </ScrollArea>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* QUANTITY INPUT */}
                <div className="w-24 space-y-2">
                  <Label>Qty</Label>
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) =>
                      updateItemQuantity(index, parseInt(e.target.value) || 0)
                    }
                  />
                </div>

                {/* REMOVE BUTTON */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 mb-0.5"
                  onClick={() => removeItem(index)}
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="flex justify-end gap-3 pt-6">
          <Button variant="outline" onClick={() => navigate("/transfers")}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={createMutation.isPending}>
            {createMutation.isPending ? "Creating..." : "Create Transfer"}
          </Button>
        </div>
      </div>
    </div>
  );
}
