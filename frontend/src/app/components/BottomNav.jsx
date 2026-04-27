import { Link, useLocation } from "react-router-dom";
import { Home, LayoutGrid, CreditCard, UserCircle } from "lucide-react";

const navItems = [
{ icon: Home, label: "Dashboard", path: "/dashboard" },
{ icon: LayoutGrid, label: "Groups", path: "/dashboard/groups" },
{ icon: CreditCard, label: "Payments", path: "/dashboard/payments" },
{ icon: UserCircle, label: "Profile", path: "/dashboard/profile" }];


export function BottomNav() {
  const location = useLocation();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="grid grid-cols-4">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-1 py-3 transition-colors ${
              isActive ? "text-[#1E3A8A]" : "text-gray-600"}`
              }>
              
              <item.icon className="w-5 h-5" />
              <span className="text-xs">{item.label}</span>
            </Link>);

        })}
      </div>
    </div>);

}