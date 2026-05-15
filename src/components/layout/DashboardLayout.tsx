import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Toaster } from "@/components/ui/toaster";
import { Separator } from "@/components/ui/separator";
import { ReactNode } from "react";
import { menuItems } from "./AppSidebar";

// --- 1. SIDEBAR LOGIC (Fix) ---
function SidebarLogic() {
  const { setOpen, setOpenMobile, isMobile } = useSidebar();
  const location = useLocation();

  useEffect(() => {
    // Ye code sirf tab chalega jab URL (Path) badlega.
    // Button click karne par ye code NAHI chalega, is liye Button ab kaam karega.

    if (isMobile) {
      setOpenMobile(false); // Mobile: Close Drawer
    } else {
      setOpen(false); // Desktop: Collapse Sidebar
    }
  }, [location.pathname]); // <--- SIRF Path change par trigger hoga

  return null;
}

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const location = useLocation();

  const getPageTitle = () => {
    if (menuItems) {
      const currentItem = menuItems.find(
        (item: any) => item.url === location.pathname
      );
      if (currentItem) return currentItem.title;
    }
    // Dynamic Routes Handling
    if (location.pathname.startsWith("/pos")) return "Point of Sale";
    if (location.pathname.startsWith("/products")) return "Products Management";
    if (location.pathname.startsWith("/purchases")) return "Purchase Orders";
    if (location.pathname.startsWith("/sales")) return "Sales History";
    if (location.pathname.startsWith("/users")) return "Staff Management";
    if (location.pathname.startsWith("/transfers")) return "Transfers";
    if (location.pathname.startsWith("/suppliers")) return "Suppliers";
    if (location.pathname.startsWith("/discounts")) return "Discounts";
    if (location.pathname.startsWith("/inventory")) return "Inventory";

    return "Dashboard";
  };

  return (
    // 1. defaultOpen prop hata diya hai taake button control le sakay
    <SidebarProvider>
      {/* 2. Logic Component inject kiya */}
      <SidebarLogic />

      <AppSidebar />

      <div className="flex flex-col flex-1 min-h-screen overflow-hidden bg-background transition-all duration-300 ease-in-out">
        {/* --- HEADER --- */}
        <header className="h-16 border-b border-border bg-card flex items-center px-4 sticky top-0 z-10 shadow-sm gap-4">
          {/* 3. Sidebar Trigger Button */}
          <SidebarTrigger />

          <Separator orientation="vertical" className="h-6" />
          <h1 className="text-lg font-semibold text-foreground tracking-tight">
            {getPageTitle()}
          </h1>
        </header>

        {/* --- CONTENT --- */}
        <main className="flex-1 overflow-auto p-4 md:p-6 bg-muted/10">
          <div className="mx-auto max-w-7xl w-full">{children}</div>
        </main>
      </div>

      <Toaster />
    </SidebarProvider>
  );
}
