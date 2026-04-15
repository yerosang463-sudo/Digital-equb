import { Link, useLocation } from "react-router";
import { Home, CreditCard, UserCircle, LayoutGrid } from "lucide-react";

const menuItems = [
{ icon: Home, label: "Dashboard", path: "/dashboard" },
{ icon: LayoutGrid, label: "Browse Groups", path: "/dashboard/groups" },
{ icon: CreditCard, label: "Payments", path: "/dashboard/payments" },
{ icon: UserCircle, label: "Profile", path: "/dashboard/profile" }];


export function Sidebar() {
  const location = useLocation();

  return (
    <div className="hidden md:flex w-64 bg-white border-r border-gray-200 flex-col">
      <div className="p-6 border-b border-gray-200">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-[#1E3A8A] rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">E</span>
          </div>
          <span className="text-xl font-semibold text-gray-900">Digital Equb</span>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              isActive ?
              "bg-[#1E3A8A] text-white" :
              "text-gray-700 hover:bg-gray-100"}`
              }>
              
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>);

        })}
      </nav>
    </div>);

}