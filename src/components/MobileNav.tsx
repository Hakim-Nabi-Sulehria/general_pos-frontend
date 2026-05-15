import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerDescription,
} from "./ui/drawer"; // Ensure path is correct to your Drawer.tsx
import { Button } from "@/components/ui/button";
import { Menu, LogOut } from "lucide-react";
import { menuItems } from "./layout/AppSidebar"; // Importing list from Sidebar
import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserRole(user.role);
      } catch (e) {
        console.error(e);
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
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        {/* Only visible on mobile, controlled by parent layout or class here */}
        <Button variant="ghost" size="icon" className="md:hidden mr-2">
          <Menu className="h-6 w-6" />
        </Button>
      </DrawerTrigger>

      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>Menu</DrawerTitle>
          <DrawerDescription>Select a page to navigate</DrawerDescription>
        </DrawerHeader>

        <div className="p-4 flex flex-col gap-2 h-[60vh] overflow-y-auto">
          {filteredMenu.map((item) => (
            <NavLink
              key={item.title}
              to={item.url}
              onClick={() => setOpen(false)} // Close drawer on click
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-secondary text-secondary-foreground"
                    : "hover:bg-muted text-muted-foreground"
                }`
              }
            >
              <item.icon className="h-5 w-5" />
              {item.title}
            </NavLink>
          ))}

          <div className="mt-auto pt-4 border-t">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5" />
              Logout
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
