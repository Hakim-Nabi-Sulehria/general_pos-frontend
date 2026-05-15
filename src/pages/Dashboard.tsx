import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import BranchMap from "@/components/BranchMap";

import {
  LayoutDashboard,
  TrendingUp,
  Download,
  Building2,
  MapPin,
  Activity,
  Box,
  Target,
  DollarSign,
  ShoppingCart,
  Package,
  ArrowUpRight,
  Globe,
} from "lucide-react";

// --- UI COMPONENTS ---
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Custom Components
import { KpiCard } from "@/components/KpiCard";

import { dashboardApi, branchApi } from "@/lib/api";
import { asArray } from "@/lib/utils";
import {
  AreaChart,
  Area,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const CHART_COLORS = [
  "#2563eb",
  "#16a34a",
  "#7c3aed",
  "#ea580c",
  "#dc2626",
  "#0891b2",
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [selectedBranch, setSelectedBranch] = useState("ALL");
  const [selectedCity, setSelectedCity] = useState("ALL");

  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats", selectedBranch],
    queryFn: () => dashboardApi.getStats(),
  });

  const { data: branches } = useQuery({
    queryKey: ["branches"],
    queryFn: async () => {
      const res = await branchApi.getAll();
      return asArray(res.data ?? res);
    },
  });

  const cities = useMemo(() => {
    const list = asArray<Record<string, unknown>>(branches);
    if (!list.length) return [];
    const allCities = list.map((b: any) => {
      if (!b.address) return "Unknown";
      const parts = b.address.split(",");
      return parts.length > 1 ? parts[parts.length - 1].trim() : b.address;
    });
    return Array.from(new Set(allCities))
      .filter((c) => c !== "Unknown")
      .sort();
  }, [branches]);

  const {
    cards = {},
    salesTrend = [],
    mapData: mapDataRaw = [],
    topProducts = [],
    recentSales = [],
  } = stats?.data || {};

  const mapData = useMemo(() => asArray(mapDataRaw), [mapDataRaw]);

  const salesTrendList = useMemo(() => asArray(salesTrend), [salesTrend]);
  const recentSalesList = useMemo(() => asArray(recentSales), [recentSales]);
  const topProductsList = useMemo(() => asArray(topProducts), [topProducts]);

  const filteredMapData = useMemo(() => {
    if (selectedCity === "ALL") return mapData;
    return mapData.filter((b: any) =>
      (b.location || "").toLowerCase().includes(selectedCity.toLowerCase())
    );
  }, [mapData, selectedCity]);

  // --- HEAVY LOADER (Restored) ---
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[80vh] bg-muted/10">
        <div className="flex flex-col items-center">
          {/* Big Spinning Ring */}
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary"></div>
          {/* Pulse Text */}
          <p className="mt-4 text-primary font-bold tracking-widest text-xs uppercase animate-pulse">
            Processing Enterprise Data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="page-container">
      {/* HEADER */}
      <section className="page-header">
        <div>
          <h2>Dashboard</h2>
          <div className="flex items-center gap-2 mt-1">
            <Badge
              variant="secondary"
              className="text-green-600 bg-green-500/10"
            >
              Live
            </Badge>
            <p className="page-description mt-0">
              {selectedCity !== "ALL"
                ? `${selectedCity} Zone`
                : "Global Overview"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Select
            value={selectedCity}
            onValueChange={(val) => {
              setSelectedCity(val);
              setSelectedBranch("ALL");
            }}
          >
            <SelectTrigger className="w-[140px] h-9">
              <Globe className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
              <SelectValue placeholder="City" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Cities</SelectItem>
              {cities.map((city: any, i: number) => (
                <SelectItem key={i} value={city}>
                  {city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedBranch} onValueChange={setSelectedBranch}>
            <SelectTrigger className="w-[180px] h-9">
              <Building2 className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Branch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Branches</SelectItem>
              {(asArray(branches) as any[])
                .filter(
                  (b: any) =>
                    selectedCity === "ALL" ||
                    b.address
                      ?.toLowerCase()
                      .includes(selectedCity.toLowerCase())
                )
                .map((b: any) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>

          <Button size="sm" className="h-9">
            <Download className="h-3.5 w-3.5 mr-2" /> Export
          </Button>
        </div>
      </section>

      <Separator className="mb-6" />

      {/* KPI CARDS */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-6">
        <KpiCard
          title="Total Revenue"
          value={`$${(cards?.netRevenue || 0).toLocaleString()}`}
          icon={DollarSign}
        />
        <KpiCard
          title="Gross Profit"
          value={`$${(cards?.grossProfit || 0).toLocaleString()}`}
          icon={Target}
        />
        <KpiCard
          title="Net Profit"
          value={`$${(cards?.netProfit || 0).toLocaleString()}`}
          icon={Activity}
          highlight
          description="+12% vs last month"
        />
        <KpiCard
          title="Total Orders"
          value={cards?.totalOrders || 0}
          icon={ShoppingCart}
        />
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6 mb-6">
        {/* REVENUE CHART */}
        <Card className="col-span-1 lg:col-span-4">
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
            <CardDescription>Performance across all branches.</CardDescription>
          </CardHeader>
          <CardContent className="pl-0">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesTrendList}>
                  <defs>
                    <linearGradient
                      id="colorGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      borderColor: "hsl(var(--border))",
                      borderRadius: "var(--radius)",
                    }}
                    itemStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#colorGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* RECENT SALES (List View - Limited to 5) */}
        <Card className="col-span-1 lg:col-span-3 flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Sales</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/sales")}
            >
              View All <ArrowUpRight className="ml-1 h-3 w-3" />
            </Button>
          </CardHeader>

          <CardContent className="flex-1 p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentSalesList.slice(0, 5).map((sale: any) => (
                  <TableRow
                    key={sale.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/sales/${sale.id}`)}
                  >
                    <TableCell className="font-medium font-mono text-xs">
                      {sale.invoiceNo}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-[9px] bg-primary/10 text-primary">
                            {sale.branch?.name?.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-muted-foreground truncate max-w-[100px]">
                          {sale.branch?.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-bold text-xs">
                      +${sale.finalAmount.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* BOTTOM SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b p-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm">Operations Map</CardTitle>
            </div>
            <Badge variant="outline">{filteredMapData.length} Active</Badge>
          </CardHeader>
          <div className="h-[300px] w-full relative">
            <BranchMap
              data={filteredMapData}
              selectedBranchId={selectedBranch}
              onSelectBranch={setSelectedBranch}
            />
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Products</CardTitle>
            <CardDescription>By revenue share</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={topProductsList}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="revenue"
                  >
                    {topProductsList.map((_: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      borderColor: "hsl(var(--border))",
                      borderRadius: "var(--radius)",
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
