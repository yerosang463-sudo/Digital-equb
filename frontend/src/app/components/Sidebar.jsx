import { Link, useLocation } from "react-router-dom";
import { Home, CreditCard, UserCircle, LayoutGrid } from "lucide-react";

const menuItems = [
{ icon: Home, label: "Dashboard", path: "/dashboard" },
{ icon: LayoutGrid, label: "Browse Groups", path: "/dashboard/groups" },
{ icon: CreditCard, label: "Payments", path: "/dashboard/payments" },
{ icon: UserCircle, label: "Profile", path: "/dashboard/profile" }];

export function Sidebar() {
  const location = useLocation();

  return (
    <div className="hidden md:flex w-52 bg-white border-r border-gray-200 flex-col">
      <div className="p-4 border-b border-gray-200">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#1E3A8A] rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">E</span>
          </div>
          <span className="text-lg font-semibold text-gray-900">Digital Equb</span>
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              isActive ?
              "bg-[#1E3A8A] text-white" :
              "text-gray-700 hover:bg-gray-100"}`
              }>
              
              <item.icon className="w-4 h-4" />
              <span className="text-sm">{item.label}</span>
            </Link>);

        })}
      </nav>
    </div>);

}