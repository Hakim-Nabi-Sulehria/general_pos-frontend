import {
  Building2,
  GitBranch,
  Package,
  Truck,
  ShoppingBag,
  LayoutDashboard,
  ArrowLeftRight,
  Landmark,
  Layers,
  Boxes,
  Percent,
  Monitor,
  TrendingUp,
  Users,
  LogOut,
  RotateCcw,
  Command,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader, // <--- New Component
  useSidebar,
} from "@/components/ui/sidebar";
import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";

export const menuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
    roles: ["SUPERADMIN", "ADMIN", "MANAGER", "CASHIER"],
  },
  {
    title: "CashRequest",
    url: "/cashrequest",
    icon: Landmark,
    roles: ["SUPERADMIN", "ADMIN", "MANAGER"],
  },
  {
    title: "POS",
    url: "/pos",
    icon: Monitor,
    roles: ["SUPERADMIN", "ADMIN", "MANAGER", "CASHIER"],
  },
  {
    title: "Sales History",
    url: "/sales",
    icon: TrendingUp,
    roles: ["SUPERADMIN", "ADMIN", "MANAGER", "CASHIER"],
  },
  {
    title: "Products",
    url: "/products",
    icon: Package,
    roles: ["SUPERADMIN", "ADMIN", "MANAGER"],
  },
  {
    title: "Categories",
    url: "/categories",
    icon: Layers,
    roles: ["SUPERADMIN", "ADMIN", "MANAGER"],
  },
  {
    title: "Inventory",
    url: "/inventory",
    icon: Boxes,
    roles: ["SUPERADMIN", "ADMIN", "MANAGER"],
  },
  {
    title: "Transfers",
    url: "/transfers",
    icon: ArrowLeftRight,
    roles: ["SUPERADMIN", "ADMIN", "MANAGER"],
  },
  {
    title: "Purchases",
    url: "/purchases",
    icon: ShoppingBag,
    roles: ["SUPERADMIN", "ADMIN", "MANAGER"],
  },
  {
    title: "Suppliers",
    url: "/suppliers",
    icon: Truck,
    roles: ["SUPERADMIN", "ADMIN", "MANAGER"],
  },
  {
    title: "Discounts",
    url: "/discount",
    icon: Percent,
    roles: ["SUPERADMIN", "ADMIN", "MANAGER"],
  },
  {
    title: "Staff Users",
    url: "/users",
    icon: Users,
    roles: ["SUPERADMIN", "ADMIN", "MANAGER"],
  },
  {
    title: "Accounts",
    url: "/account",
    icon: Landmark,
    roles: ["SUPERADMIN", "ADMIN"],
  },
  {
    title: "Branches",
    url: "/branches",
    icon: GitBranch,
    roles: ["SUPERADMIN", "ADMIN"],
  },
  {
    title: "Organizations",
    url: "/organizations",
    icon: Building2,
    roles: ["SUPERADMIN"],
  },
  {
    title: "Returns (RMA)",
    url: "/returns",
    icon: RotateCcw,
    roles: ["SUPERADMIN", "ADMIN", "MANAGER"],
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const [userRole, setUserRole] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserRole(user.role);
      } catch (error) {
        console.error("Error parsing user data", error);
      }
    }
  }, []);

  const filteredMenu = useMemo(
    () => menuItems.filter((item) => item.roles.includes(userRole || "")),
    [userRole]
  );

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <Sidebar collapsible="icon">
      {/* --- 1. HEADER (Logo + Title) --- */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              className="hover:bg-transparent cursor-default"
            >
              <div className="flex items-center gap-2">
                {/* Logo Box */}
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Command className="size-4" />
                </div>
                {/* Text (Hidden on Collapse) */}
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">POS System</span>
                  <span className="truncate text-xs">Admin Panel</span>
                </div>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* --- 2. CONTENT (Scrollable) --- */}
      <SidebarContent className="overflow-hidden">
        <ScrollArea className="h-full">
          <SidebarGroup>
            <SidebarGroupLabel>Menu</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredMenu.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild tooltip={item.title}>
                      <NavLink
                        to={item.url}
                        className={({ isActive }) =>
                          `flex w-full items-center gap-2 rounded-md transition-colors ${
                            isActive
                              ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                              : "hover:bg-sidebar-accent/50 text-sidebar-foreground"
                          }`
                        }
                      >
                        <item.icon />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </ScrollArea>
      </SidebarContent>

      {/* --- 3. FOOTER (Logout) --- */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            {/* Using SidebarMenuButton ensures correct behavior on collapse */}
            <SidebarMenuButton
              onClick={handleLogout}
              tooltip="Logout"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <LogOut />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
