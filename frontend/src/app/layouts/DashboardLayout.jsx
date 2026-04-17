import { Navigate, Outlet, useLocation } from "react-router";
import { Sidebar } from "../components/Sidebar";
import { TopBar } from "../components/TopBar";
import { BottomNav } from "../components/BottomNav";
import { useAuth } from "../providers/AuthProvider";

export function DashboardLayout() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center text-gray-600">
        Loading your account...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return (
    <div className="flex h-screen bg-[#F9FAFB]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-20 md:pb-8">
          <Outlet />
        </main>
        <BottomNav />
      </div>
    </div>);

}
