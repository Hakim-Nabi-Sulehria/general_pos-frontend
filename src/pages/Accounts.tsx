import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Settings2,
  Receipt,
  Printer,
  ChevronDown,
  Wallet,
  TrendingDown,
  Building2,
  PieChart,
  ArrowRightLeft,
  TrendingUp,
  Calendar,
  Eye,
  FileText,
} from "lucide-react";

// --- UI COMPONENTS ---
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"; // Standard Table used inside sections

import { accountApi, branchApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

// --- INTERFACES ---
interface Account {
  id: string;
  name: string;
  code: string;
  type: string;
  balance: number;
}
interface ReportResponse {
  data: { [key: string]: any };
}
interface DetailResponse {
  data: {
    accountName: string;
    type: string;
    balance: number;
    transactions: any[];
  };
}

export default function Accounts() {
  const [activeTab, setActiveTab] = useState("sofp");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isExpenseOpen, setIsExpenseOpen] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState("ALL");
  const apiBranchId = selectedBranchId === "ALL" ? "" : selectedBranchId;

  // Detail View States
  const [detailId, setDetailId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Form States
  const [accName, setAccName] = useState("");
  const [accCode, setAccCode] = useState("");
  const [accType, setAccType] = useState("EXPENSE");
  const [expAmount, setExpAmount] = useState("");
  const [expDescription, setExpDescription] = useState("");
  const [selectedExpenseAcc, setSelectedExpenseAcc] = useState("");
  const [selectedPaymentAcc, setSelectedPaymentAcc] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // --- API QUERIES ---
  const { data: branchesData } = useQuery({
    queryKey: ["branches-list"],
    queryFn: () => branchApi.getAll(),
  });
  const { data: accountsData, isLoading: isAccountsLoading } = useQuery({
    queryKey: ["accounts", apiBranchId],
    queryFn: () => accountApi.getCOASummary(apiBranchId),
  });
  const { data: sofpData, isLoading: isSofpLoading } = useQuery<ReportResponse>(
    {
      queryKey: ["balance-sheet", apiBranchId],
      queryFn: () => accountApi.getBalanceSheet(apiBranchId),
      enabled: activeTab === "sofp",
    }
  );
  const { data: plData, isLoading: isPlLoading } = useQuery<ReportResponse>({
    queryKey: ["income-statement", apiBranchId],
    queryFn: () => accountApi.getIncomeStatement(apiBranchId),
    enabled: activeTab === "pl",
  });
  const { data: cashData, isLoading: isCashLoading } = useQuery<ReportResponse>(
    {
      queryKey: ["cash-flow", apiBranchId],
      queryFn: () => accountApi.getCashFlow(apiBranchId),
      enabled: activeTab === "cash",
    }
  );
  const { data: accountDetails, isLoading: isDetailsLoading } =
    useQuery<DetailResponse>({
      queryKey: ["account-details", detailId, apiBranchId],
      queryFn: () => accountApi.getDetails(detailId!, apiBranchId),
      enabled: !!detailId && isDetailOpen,
    });

  // --- MUTATIONS ---
  const createMutation = useMutation({
    mutationFn: accountApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      toast({ title: "Account created successfully" });
      setIsCreateOpen(false);
      setAccName("");
      setAccCode("");
    },
  });

  const expenseMutation = useMutation({
    mutationFn: accountApi.recordExpense,
    onSuccess: () => {
      ["accounts", "balance-sheet", "income-statement", "cash-flow"].forEach(
        (k) => queryClient.invalidateQueries({ queryKey: [k] })
      );
      toast({ title: "Expense recorded successfully" });
      setIsExpenseOpen(false);
      setExpAmount("");
      setExpDescription("");
    },
  });

  const seedMutation = useMutation({
    mutationFn: accountApi.seed,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      toast({ title: "Defaults setup complete" });
    },
  });

  // --- HELPERS ---
  const allAccounts = (accountsData?.data as Account[]) || [];
  const expenseAccountsList = allAccounts.filter(
    (a: Account) => a.type === "EXPENSE"
  );
  const paymentAccountsList = allAccounts.filter((a: Account) =>
    a.type.includes("ASSET")
  );

  const handleCreate = () => {
    if (!accName || !accCode) return;
    createMutation.mutate({ name: accName, code: accCode, type: accType });
  };

  const handleRecordExpense = () => {
    if (!selectedExpenseAcc || !expAmount) return;
    const paymentAcc =
      selectedPaymentAcc ||
      allAccounts.find((a: Account) => a.code === "1001")?.id;
    if (!paymentAcc) {
      toast({ title: "No Cash Account found", variant: "destructive" });
      return;
    }
    expenseMutation.mutate({
      expenseAccountId: selectedExpenseAcc,
      paymentAccountId: paymentAcc,
      amount: expAmount,
      description: expDescription,
    });
  };

  const handleViewLedger = (id: string) => {
    setDetailId(id);
    setIsDetailOpen(true);
  };

  // --- RENDER HELPERS (Using UI Components) ---
  const renderSection = (
    title: string,
    subSections: { title: string; types: string[] }[]
  ) => {
    let sectionTotal = 0;

    // Check if section has data
    const hasData = subSections.some((sub) =>
      allAccounts.some((acc) => sub.types.includes(acc.type))
    );
    if (!hasData && !isAccountsLoading) return null;

    return (
      <Card className="mb-6 shadow-sm">
        <CardHeader className="bg-muted/40 py-3 border-b">
          <CardTitle className="text-base uppercase tracking-wide flex items-center gap-2">
            <FileText className="h-4 w-4" /> {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {subSections.map((sub, index) => {
            const accounts = allAccounts.filter((acc) =>
              sub.types.includes(acc.type)
            );
            const subTotal = accounts.reduce(
              (sum, acc) => sum + (acc.balance || 0),
              0
            );
            sectionTotal += subTotal;

            if (accounts.length === 0) return null;

            return (
              <div key={index} className="border-b last:border-0">
                <div className="bg-muted/10 px-4 py-2 text-xs font-bold text-primary uppercase tracking-wider flex items-center">
                  <ChevronDown className="h-3 w-3 mr-1" /> {sub.title}
                </div>
                <Table>
                  <TableBody>
                    {accounts.map((acc) => (
                      <TableRow key={acc.id} className="hover:bg-muted/5 group">
                        <TableCell className="font-mono text-xs text-muted-foreground w-20">
                          {acc.code}
                        </TableCell>
                        <TableCell className="font-medium text-sm">
                          {acc.name}
                          {acc.id.includes("auto") && (
                            <Badge
                              variant="outline"
                              className="ml-2 text-[9px] h-4"
                            >
                              Auto
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono font-medium">
                          $
                          {acc.balance?.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell className="w-10 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleViewLedger(acc.id)}
                          >
                            <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            );
          })}
        </CardContent>
        {sectionTotal !== 0 && (
          <div className="bg-muted/20 p-3 border-t flex justify-between items-center">
            <span className="font-bold text-sm uppercase">Total {title}</span>
            <span className="font-bold text-base border-b-2 border-double border-primary pb-0.5">
              $
              {sectionTotal.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>
        )}
      </Card>
    );
  };

  // --- BALANCE SHEET CALCULATIONS ---
  const calculateTotalCurrentAssets = () => {
    return (sofpData?.data?.assets?.current || [])
      .filter(
        (a: Account) =>
          !a.name.includes("Net Cash") && !a.name.includes("Sales")
      )
      .reduce((sum: number, a: Account) => sum + (a.balance || 0), 0);
  };
  const calculateGrandTotalAssets = () =>
    calculateTotalCurrentAssets() +
    (sofpData?.data?.assets?.totalNonCurrent || 0);

  if (isAccountsLoading)
    return (
      <div className="p-12 text-center text-muted-foreground">
        Loading Financial Data...
      </div>
    );

  return (
    <main className="page-container">
      {/* HEADER */}
      <section className="page-header flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h2>Financials</h2>
          <p className="page-description">Accounting & Reports Overview</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
            <SelectTrigger className="w-[180px] bg-background">
              <SelectValue placeholder="Select Branch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Branches (Consolidated)</SelectItem>
              {branchesData?.data?.map((b: any) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => seedMutation.mutate()}
            disabled={seedMutation.isPending}
          >
            <Settings2 className="h-4 w-4 mr-2" /> Defaults
          </Button>

          <Dialog open={isExpenseOpen} onOpenChange={setIsExpenseOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="destructive">
                <Receipt className="h-4 w-4 mr-2" /> Expense
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record Expense</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select onValueChange={setSelectedExpenseAcc}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {expenseAccountsList
                        .filter((a) => !!a.id)
                        .map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Paid From</Label>
                  <Select onValueChange={setSelectedPaymentAcc}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Asset Account" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentAccountsList
                        .filter((a) => !!a.id)
                        .map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.name} (${a.balance})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Amount</Label>
                    <Input
                      type="number"
                      value={expAmount}
                      onChange={(e) => setExpAmount(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Ref</Label>
                    <Input
                      value={expDescription}
                      onChange={(e) => setExpDescription(e.target.value)}
                    />
                  </div>
                </div>
                <Button
                  className="w-full bg-destructive"
                  onClick={handleRecordExpense}
                  disabled={expenseMutation.isPending}
                >
                  Confirm
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" /> Account
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New Account</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Code</Label>
                    <Input onChange={(e) => setAccCode(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select onValueChange={setAccType} defaultValue="EXPENSE">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CURRENT_ASSET">
                          Current Asset
                        </SelectItem>
                        <SelectItem value="NON_CURRENT_ASSET">
                          Non-Current Asset
                        </SelectItem>
                        <SelectItem value="LIABILITY">Liability</SelectItem>
                        <SelectItem value="EQUITY">Equity</SelectItem>
                        <SelectItem value="INCOME">Income</SelectItem>
                        <SelectItem value="COGS">COGS</SelectItem>
                        <SelectItem value="EXPENSE">Expense</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input onChange={(e) => setAccName(e.target.value)} />
                </div>
                <Button
                  className="w-full"
                  onClick={handleCreate}
                  disabled={createMutation.isPending}
                >
                  Create Account
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </section>

      <Separator className="mb-6" />

      {/* TABS */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-[600px] mb-6">
          <TabsTrigger value="coa">Chart of Accounts</TabsTrigger>
          <TabsTrigger value="sofp">Balance Sheet</TabsTrigger>
          <TabsTrigger value="pl">Income Statement</TabsTrigger>
          <TabsTrigger value="cash">Cash Flow</TabsTrigger>
        </TabsList>

        {/* 1. COA VIEW (Restored Structure with UI Components) */}
        <TabsContent value="coa" className="space-y-6">
          {renderSection("Assets", [
            { title: "Current Assets", types: ["CURRENT_ASSET"] },
            { title: "Non-Current Assets", types: ["NON_CURRENT_ASSET"] },
          ])}
          {renderSection("Liabilities", [
            { title: "Current Liabilities", types: ["LIABILITY"] },
          ])}
          {renderSection("Equity", [
            { title: "Owner's Equity", types: ["EQUITY"] },
          ])}
          {renderSection("Income", [{ title: "Revenue", types: ["INCOME"] }])}
          {renderSection("Cost of Goods Sold", [
            { title: "Direct Costs", types: ["COGS"] },
          ])}
          {renderSection("Expenses", [
            { title: "Operating Expenses", types: ["EXPENSE"] },
          ])}
        </TabsContent>

        {/* 2. BALANCE SHEET (UI Consistent) */}
        <TabsContent value="sofp">
          {isSofpLoading ? (
            <div className="p-12 text-center text-muted-foreground">
              Loading Balance Sheet...
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary Card */}
              <Card
                className={
                  sofpData?.data?.summary?.isBalanced
                    ? "border-l-4 border-l-green-500"
                    : "border-l-4 border-l-destructive"
                }
              >
                <CardContent className="p-6 flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      <PieChart className="h-5 w-5 text-muted-foreground" />{" "}
                      Accounting Equation
                    </h3>
                    <Badge
                      variant={
                        sofpData?.data?.summary?.isBalanced
                          ? "default"
                          : "destructive"
                      }
                      className="mt-2"
                    >
                      {sofpData?.data?.summary?.isBalanced
                        ? "BALANCED"
                        : "UNBALANCED"}
                    </Badge>
                  </div>
                  <div className="flex gap-8 text-right">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase">
                        Total Assets
                      </p>
                      <p className="text-xl font-bold text-blue-600">
                        ${calculateGrandTotalAssets().toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase">
                        L + Equity
                      </p>
                      <p className="text-xl font-bold text-purple-600">
                        $
                        {sofpData?.data?.summary?.totalLiabilitiesAndEquity?.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="bg-blue-50/50 py-3 border-b">
                    <CardTitle className="text-blue-700 text-base flex items-center gap-2">
                      <Wallet className="h-4 w-4" /> Assets
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableBody>
                        <TableRow className="bg-muted/20">
                          <TableCell
                            colSpan={2}
                            className="font-bold text-xs uppercase text-muted-foreground"
                          >
                            Current
                          </TableCell>
                        </TableRow>
                        {sofpData?.data?.assets?.current?.map((a: any) => (
                          <TableRow key={a.id}>
                            <TableCell>{a.name}</TableCell>
                            <TableCell className="text-right font-mono">
                              ${a.balance.toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-muted/20">
                          <TableCell
                            colSpan={2}
                            className="font-bold text-xs uppercase text-muted-foreground"
                          >
                            Non-Current
                          </TableCell>
                        </TableRow>
                        {sofpData?.data?.assets?.nonCurrent?.map((a: any) => (
                          <TableRow key={a.id}>
                            <TableCell>{a.name}</TableCell>
                            <TableCell className="text-right font-mono">
                              ${a.balance.toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="bg-purple-50/50 py-3 border-b">
                    <CardTitle className="text-purple-700 text-base flex items-center gap-2">
                      <Building2 className="h-4 w-4" /> Liabilities & Equity
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableBody>
                        <TableRow className="bg-muted/20">
                          <TableCell
                            colSpan={2}
                            className="font-bold text-xs uppercase text-muted-foreground"
                          >
                            Liabilities
                          </TableCell>
                        </TableRow>
                        {sofpData?.data?.liabilities?.list?.map((a: any) => (
                          <TableRow key={a.id}>
                            <TableCell>{a.name}</TableCell>
                            <TableCell className="text-right font-mono">
                              ${a.balance.toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-muted/20">
                          <TableCell
                            colSpan={2}
                            className="font-bold text-xs uppercase text-muted-foreground"
                          >
                            Equity
                          </TableCell>
                        </TableRow>
                        {sofpData?.data?.equity?.list?.map((a: any) => (
                          <TableRow key={a.id}>
                            <TableCell>{a.name}</TableCell>
                            <TableCell className="text-right font-mono">
                              ${a.balance.toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-purple-50">
                          <TableCell className="font-bold">
                            Net Profit (Retained)
                          </TableCell>
                          <TableCell className="text-right font-bold font-mono">
                            $
                            {sofpData?.data?.equity?.netProfit?.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>

        {/* 3. INCOME STATEMENT & 4. CASH FLOW (Kept consistent with new style) */}
        {/* ... (Previous TabsContent for PL and CASH kept same but ensuring Card wrappers) ... */}
        <TabsContent value="pl">
          {isPlLoading ? (
            <div className="p-12 text-center text-muted-foreground">
              Loading...
            </div>
          ) : (
            <div className="grid gap-6 max-w-4xl mx-auto">
              <Card>
                <CardHeader className="bg-muted/20 py-3 border-b">
                  <CardTitle>Income Statement</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {plData?.data?.income?.map((a: any) => (
                        <TableRow key={a.id}>
                          <TableCell>{a.name}</TableCell>
                          <TableCell className="text-right font-mono text-green-600">
                            +${a.balance.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-muted/10">
                        <TableCell className="font-bold">
                          Total Revenue
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          $
                          {plData?.data?.income?.[0]?.balance?.toLocaleString()}
                        </TableCell>
                      </TableRow>
                      {plData?.data?.cogs?.map((a: any) => (
                        <TableRow key={a.id}>
                          <TableCell>{a.name}</TableCell>
                          <TableCell className="text-right font-mono text-orange-600">
                            -${a.balance.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                      {plData?.data?.expenses?.map((a: any) => (
                        <TableRow key={a.id}>
                          <TableCell>{a.name}</TableCell>
                          <TableCell className="text-right font-mono text-destructive">
                            -${a.balance.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-black hover:bg-black text-white">
                        <TableCell className="font-bold text-lg">
                          NET PROFIT
                        </TableCell>
                        <TableCell
                          className={`text-right font-bold text-lg ${
                            plData?.data?.netProfit >= 0
                              ? "text-green-400"
                              : "text-red-400"
                          }`}
                        >
                          ${plData?.data?.netProfit?.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="cash">
          {isCashLoading ? (
            <div className="p-12 text-center text-muted-foreground">
              Loading...
            </div>
          ) : (
            <div className="grid gap-6 max-w-4xl mx-auto">
              <Card className="bg-blue-50 border-blue-200 text-center p-6">
                <p className="text-sm font-bold text-blue-600 uppercase">
                  Net Cash in Hand
                </p>
                <p className="text-4xl font-black text-blue-900 mt-2">
                  ${cashData?.data?.netCash?.toLocaleString()}
                </p>
              </Card>
              <div className="grid grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="bg-green-50 py-3 border-b">
                    <CardTitle className="text-green-700 text-base flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" /> Inflow
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="flex justify-between font-medium">
                      <span>Sales</span>
                      <span>
                        +${cashData?.data?.inflow?.sales?.toLocaleString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="bg-red-50 py-3 border-b">
                    <CardTitle className="text-destructive text-base flex items-center gap-2">
                      <TrendingDown className="h-4 w-4" /> Outflow
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="flex justify-between font-medium">
                      <span>Expenses</span>
                      <span>
                        -${cashData?.data?.outflow?.expenses?.toLocaleString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* LEDGER DETAILS DIALOG */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Ledger: {accountDetails?.data?.accountName}
            </DialogTitle>
            <DialogDescription>Detailed transactions</DialogDescription>
          </DialogHeader>
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Debit</TableHead>
                  <TableHead className="text-right">Credit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accountDetails?.data?.transactions?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      No transactions
                    </TableCell>
                  </TableRow>
                ) : (
                  accountDetails?.data?.transactions?.map(
                    (t: any, i: number) => (
                      <TableRow key={i}>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(t.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="font-medium text-sm">
                          {t.description}
                        </TableCell>
                        <TableCell className="text-right text-destructive">
                          {t.debit > 0 ? `$${t.debit.toLocaleString()}` : "-"}
                        </TableCell>
                        <TableCell className="text-right text-green-600">
                          {t.credit > 0 ? `$${t.credit.toLocaleString()}` : "-"}
                        </TableCell>
                      </TableRow>
                    )
                  )
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
