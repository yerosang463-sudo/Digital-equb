import { useEffect, useState } from "react";
import { Bell, LogOut, Search } from "lucide-react";
import { useNavigate } from "react-router";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { apiRequest } from "../lib/api";
import { useAuth } from "../providers/AuthProvider";

function initials(name) {
  return (name || "User")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function TopBar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let ignore = false;

    async function loadNotifications() {
      try {
        const response = await apiRequest("/api/notifications?limit=5");
        if (!ignore) {
          setUnreadCount(response.unread_count || 0);
        }
      } catch (error) {
        if (!ignore) {
          setUnreadCount(0);
        }
      }
    }

    loadNotifications();
    return () => {
      ignore = true;
    };
  }, []);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search groups, members..."
              className="pl-10 bg-gray-50 border-gray-200"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="button"
            className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
            onClick={() => navigate("/dashboard")}
          >
            <Bell className="w-5 h-5 text-gray-600" />
            {unreadCount > 0 ? (
              <Badge className="absolute -top-1 -right-1 bg-red-500 text-white px-1.5 py-0 text-xs min-w-[20px] h-5 flex items-center justify-center">
                {unreadCount}
              </Badge>
            ) : null}
          </button>

          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={user?.avatar_url || ""} />
              <AvatarFallback className="bg-[#1E3A8A] text-white">
                {initials(user?.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-gray-900">{user?.full_name || "Member"}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
          </div>

          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
}
