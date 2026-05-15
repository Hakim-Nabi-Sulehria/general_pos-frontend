import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { DashboardLayout } from "./components/layout/DashboardLayout";

// --- PAGES ---
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Organizations from "./pages/Organizations";
import Branches from "./pages/Branches";
import Products from "./pages/Products";
import Suppliers from "./pages/Suppliers";
import Purchases from "./pages/Purchases";
import Transfers from "./pages/Transfers";
import Inventory from "./pages/Inventory";
import NotFound from "./pages/NotFound";
import Categories from "./pages/Categories";
import Discounts from "./pages/Discount";
import POS from "./pages/Pos";
import Sales from "./pages/Sales";
import Accounts from "./pages/Accounts";
import Users from "./pages/User";
import Returns from "./pages/return";
import CreatePurchase from "./pages/Create-Purchase";
import AddProduct from "./pages/Addproduct";
import AddCategory from "./pages/AddCategories";
import AddTransfer from "./pages/AddTransfer";
import AddSupplier from "./pages/AddSupplier";
import AddDiscount from "./pages/AddDiscounts";
import AddUser from "./pages/AddUser";
import AddOrganization from "./pages/AddOrganization";
import AddBranch from "./pages/AddBranches";
import "./index.css";
import AddCoupon from "./pages/AddCoupon";
import AddBogo from "./pages/AddBogo";
import AddBulk from "./pages/AddBulk";
import CashRequests from "./pages/CashRequest";

const queryClient = new QueryClient();

// --- AUTH GUARD (Darbaan) ---
const RequireAuth = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem("token");

  // Agar Token nahi hai -> Login par jao
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Agar Token hai -> Ander aane do
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* 1. PUBLIC ROUTE (Login) */}
          <Route path="/login" element={<Login />} />

          {/* 2. PROTECTED ROUTES (Requires Login) */}
          <Route
            path="/*"
            element={
              <RequireAuth>
                <DashboardLayout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    {/* Management Pages */}
                    <Route path="/organizations" element={<Organizations />} />
                    <Route
                      path="/organizations/new"
                      element={<AddOrganization />}
                    />
                    <Route
                      path="/organizations/edit/:id"
                      element={<AddOrganization />}
                    />
                    <Route path="/branches" element={<Branches />} />
                    <Route path="/branches/new" element={<AddBranch />} />
                    <Route path="/branches/edit/:id" element={<AddBranch />} />
                    <Route path="/users" element={<Users />} />
                    <Route path="/users/new" element={<AddUser />} />
                    {/* Staff Page */}
                    <Route path="/account" element={<Accounts />} />
                    {/* Inventory Pages */}
                    <Route path="/products" element={<Products />} />
                    <Route path="/products/new" element={<AddProduct />} />
                    <Route path="/categories" element={<Categories />} />
                    <Route path="/categories/new" element={<AddCategory />} />
                    <Route
                      path="/categories/edit/:id"
                      element={<AddCategory />}
                    />
                    <Route path="/suppliers" element={<Suppliers />} />
                    <Route path="/suppliers/new" element={<AddSupplier />} />
                    <Route
                      path="/suppliers/edit/:id"
                      element={<AddSupplier />}
                    />
                    <Route path="/purchases" element={<Purchases />} />
                    <Route path="/purchases/new" element={<CreatePurchase />} />
                    <Route path="/transfers" element={<Transfers />} />
                    <Route path="/transfers/new" element={<AddTransfer />} />
                    <Route path="/inventory" element={<Inventory />} />
                    {/* Sales Pages */}
                    <Route path="/discount" element={<Discounts />} />
                    <Route path="/discounts/new" element={<AddDiscount />} />
                    <Route
                      path="/discounts/create-coupon"
                      element={<AddCoupon />}
                    />
                    <Route
                      path="/discounts/create-bogo"
                      element={<AddBogo />}
                    />
                    <Route
                      path="/discounts/create-bulk"
                      element={<AddBulk />}
                    />

                    <Route
                      path="/discounts/edit/:id"
                      element={<AddDiscount />}
                    />
                    <Route path="/pos" element={<POS />} />
                    <Route path="/cashrequest" element={<CashRequests />} />
                    <Route path="/sales" element={<Sales />} />
                    <Route path="/returns" element={<Returns />} />
                    {/* 404 Page */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </DashboardLayout>
              </RequireAuth>
            }
          />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
