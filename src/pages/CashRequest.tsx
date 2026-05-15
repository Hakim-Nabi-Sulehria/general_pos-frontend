import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, cashRequestApi } from "@/lib/api"; // Make sure api is imported for custom calls
import { toast } from "sonner";

import {
  DollarSign,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Wallet,
  Plus,
  Building2,
  TrendingUp,
  ArrowDownToLine,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function CashRequests() {
  const queryClient = useQueryClient();

  // --- STATES ---
  // Request Modal (For Cashier/Manager requesting funds)
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [requestAmount, setRequestAmount] = useState("");
  const [requestReason, setRequestReason] = useState("");

  // Admin Direct Add Modal
  const [isAdminAddOpen, setIsAdminAddOpen] = useState(false);
  const [adminAmount, setAdminAmount] = useState("");
  const [adminReason, setAdminReason] = useState("");
  const [selectedBranchId, setSelectedBranchId] = useState("");

  // --- USER ROLE ---
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const role = user?.role || "CASHIER";
  const isAdmin = role === "ADMIN" || role === "SUPERADMIN";

  // --- QUERIES ---

  // 1. My Requests
  const { data: myRequests, isLoading: loadingMy } = useQuery({
    queryKey: ["cash-requests", "my"],
    queryFn: cashRequestApi.getMyRequests,
  });

  // 2. Incoming Requests (Manager/Admin)
  const { data: incomingRequests, isLoading: loadingIncoming } = useQuery({
    queryKey: ["cash-requests", "incoming"],
    queryFn: cashRequestApi.getIncomingRequests,
    enabled: role !== "CASHIER",
  });

  // 3. Organization Balance Overview (NEW)
  const { data: balanceData } = useQuery({
    queryKey: ["cash-balance"],
    queryFn: () => api.get("/cash-requests/balance/overview"),
    enabled: role !== "CASHIER",
  });

  // 4. Get All Branches (For Admin Dropdown)
  const { data: branches } = useQuery({
    queryKey: ["branches-list"],
    queryFn: () => api.get("/branches"), // Adjust endpoint if needed
    enabled: isAdmin && isAdminAddOpen, // Sirf tab fetch kare jab modal open ho
  });

  // --- MUTATIONS ---

  // Normal Request
  const createRequestMutation = useMutation({
    mutationFn: cashRequestApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cash-requests"] });
      toast.success("Request sent successfully!");
      setIsRequestOpen(false);
      setRequestAmount("");
      setRequestReason("");
    },
    onError: () => toast.error("Failed to send request."),
  });

  // Status Update (Approve/Reject)
  const updateStatusMutation = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: "APPROVED" | "REJECTED";
    }) => cashRequestApi.updateStatus(id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["cash-requests"] });
      queryClient.invalidateQueries({ queryKey: ["cash-balance"] }); // Balance update hona chahiye
      toast.success(`Request ${variables.status.toLowerCase()}!`);
    },
    onError: () => toast.error("Action failed."),
  });

  // Admin Direct Add Cash (NEW)
  const adminAddCashMutation = useMutation({
    mutationFn: (data: any) => api.post("/cash-requests/admin/add-cash", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cash-balance"] });
      queryClient.invalidateQueries({ queryKey: ["cash-requests"] });
      toast.success("Cash injected successfully.");
      setIsAdminAddOpen(false);
      setAdminAmount("");
      setAdminReason("");
      setSelectedBranchId("");
    },
    onError: () => toast.error("Failed to add cash."),
  });

  // --- HANDLERS ---
  const handleRequestSubmit = () => {
    if (!requestAmount || Number(requestAmount) <= 0)
      return toast.error("Invalid amount");
    createRequestMutation.mutate({
      amount: Number(requestAmount),
      reason: requestReason,
    });
  };

  const handleAdminDeposit = () => {
    if (!selectedBranchId) return toast.error("Select a branch");
    if (!adminAmount || Number(adminAmount) <= 0)
      return toast.error("Invalid amount");

    adminAddCashMutation.mutate({
      branchId: selectedBranchId,
      amount: Number(adminAmount),
      reason: adminReason || "Admin Manual Deposit",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge
            variant="outline"
            className="bg-yellow-50 text-yellow-700 border-yellow-200"
          >
            <Clock className="w-3 h-3 mr-1" /> Pending
          </Badge>
        );
      case "APPROVED":
        return (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200"
          >
            <CheckCircle2 className="w-3 h-3 mr-1" /> Approved
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge
            variant="outline"
            className="bg-red-50 text-red-700 border-red-200"
          >
            <XCircle className="w-3 h-3 mr-1" /> Rejected
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <main className="p-6 max-w-7xl mx-auto space-y-6">
      {/* --- HEADER SECTION --- */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Cash Management</h2>
          <div className="flex items-center gap-2 mt-2 text-muted-foreground">
            <Badge variant="secondary" className="px-2 py-1">
              Role: {role}
            </Badge>
            <span className="text-sm">
              Manage organization liquidity & petty cash.
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          {/* Admin: Direct Add Cash Button */}
          {isAdmin && (
            <Dialog open={isAdminAddOpen} onOpenChange={setIsAdminAddOpen}>
              <DialogTrigger asChild>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
                  <Plus className="mr-2 h-4 w-4" /> Inject Cash
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Admin Direct Deposit</DialogTitle>
                  <CardDescription>
                    Add cash directly to a branch's safe.
                  </CardDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label>Select Branch</Label>
                    <Select
                      onValueChange={setSelectedBranchId}
                      value={selectedBranchId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose Branch" />
                      </SelectTrigger>
                      <SelectContent>
                        {branches?.data?.map((b: any) => (
                          <SelectItem key={b.id} value={b.id}>
                            {b.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Amount</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      onChange={(e) => setAdminAmount(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Reason / Reference</Label>
                    <Input
                      placeholder="e.g. Weekly Restock"
                      onChange={(e) => setAdminReason(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={handleAdminDeposit}
                    disabled={adminAddCashMutation.isPending}
                  >
                    {adminAddCashMutation.isPending
                      ? "Processing..."
                      : "Confirm Deposit"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          {/* All Roles (except Admin): Request Funds Button */}
          {!isAdmin && (
            <Dialog open={isRequestOpen} onOpenChange={setIsRequestOpen}>
              <DialogTrigger asChild>
                <Button>
                  <ArrowDownToLine className="mr-2 h-4 w-4" /> Request Funds
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Request Cash</DialogTitle>
                  <CardDescription>
                    Send a request to your manager.
                  </CardDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label>Amount Required</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      onChange={(e) => setRequestAmount(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Reason</Label>
                    <Input
                      placeholder="Why do you need funds?"
                      onChange={(e) => setRequestReason(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={handleRequestSubmit}
                    disabled={createRequestMutation.isPending}
                  >
                    Submit Request
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <Separator />

      {/* --- STATS SECTION (Visible to Manager/Admin) --- */}
      {role !== "CASHIER" && (
        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-3">
          {/* Total Balance Card */}
          <Card className="bg-gradient-to-br from-emerald-50 to-white border-emerald-100 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-emerald-900">
                Total Organization Cash
              </CardTitle>
              <Wallet className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-700">
                ${balanceData?.data?.totalBalance?.toLocaleString() || "0.00"}
              </div>
              <p className="text-xs text-emerald-600/80 mt-1 flex items-center">
                <TrendingUp className="w-3 h-3 mr-1" /> Real-time liquidity
              </p>
            </CardContent>
          </Card>

          {/* Pending Approvals Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Requests
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {incomingRequests?.data?.length || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Action required on these items
              </p>
            </CardContent>
          </Card>

          {/* Branch Breakdown (Scrollable List) */}
          <Card className="row-span-2 lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center">
                <Building2 className="w-4 h-4 mr-2" /> Branch Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[120px] overflow-y-auto pr-2 space-y-2">
              {balanceData?.data?.breakdown?.map((branch: any) => (
                <div
                  key={branch.id}
                  className="flex items-center justify-between text-sm p-2 bg-slate-50 rounded-md border"
                >
                  <span className="font-medium text-slate-700">
                    {branch.name}
                  </span>
                  <span className="font-mono font-bold text-emerald-700">
                    ${branch.cashBalance?.toLocaleString() || "0"}
                  </span>
                </div>
              ))}
              {(!balanceData?.data?.breakdown ||
                balanceData?.data?.breakdown.length === 0) && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No branch data available.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* --- TABS SECTION --- */}
      <Tabs
        defaultValue={role === "CASHIER" ? "my-requests" : "incoming"}
        className="w-full"
      >
        <TabsList className="grid w-full md:w-[400px] grid-cols-2">
          {role !== "CASHIER" && (
            <TabsTrigger value="incoming">Incoming Requests</TabsTrigger>
          )}
          <TabsTrigger value="my-requests">My History</TabsTrigger>
        </TabsList>

        {/* TAB 1: Incoming Requests (Approvals) */}
        {role !== "CASHIER" && (
          <TabsContent value="incoming" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Approval Queue</CardTitle>
                <CardDescription>
                  Approve or reject fund requests.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Requester</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingIncoming ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center h-24">
                          Loading...
                        </TableCell>
                      </TableRow>
                    ) : incomingRequests?.data?.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center h-24 text-muted-foreground"
                        >
                          All caught up!
                        </TableCell>
                      </TableRow>
                    ) : (
                      incomingRequests?.data?.map((req: any) => (
                        <TableRow key={req.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-[10px]">
                                  {req.requester?.name
                                    ?.substring(0, 2)
                                    .toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              {req.requester?.name}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px]">
                              {req.requester?.role}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-bold">
                            ${req.amount.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {req.reason}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-red-600 hover:bg-red-50 hover:text-red-700"
                                onClick={() =>
                                  updateStatusMutation.mutate({
                                    id: req.id,
                                    status: "REJECTED",
                                  })
                                }
                              >
                                Reject
                              </Button>
                              <Button
                                size="sm"
                                className="h-8 bg-green-600 hover:bg-green-700 text-white"
                                onClick={() =>
                                  updateStatusMutation.mutate({
                                    id: req.id,
                                    status: "APPROVED",
                                  })
                                }
                              >
                                Approve
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* TAB 2: My Request History */}
        <TabsContent value="my-requests" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>My Request History</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Approved By</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingMy ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center h-24">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : myRequests?.data?.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center h-24 text-muted-foreground"
                      >
                        No requests found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    myRequests?.data?.map((req: any) => (
                      <TableRow key={req.id}>
                        <TableCell className="text-xs text-muted-foreground font-mono">
                          {new Date(req.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="font-medium">
                          ${req.amount.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {req.reason}
                        </TableCell>
                        <TableCell className="text-sm">
                          {req.approver?.name || "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          {getStatusBadge(req.status)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}
