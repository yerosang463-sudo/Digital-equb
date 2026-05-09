import { useEffect, useState } from "react";
import { Users, TrendingUp, CreditCard, DollarSign } from "lucide-react";
import { Link } from "react-router-dom";
import { StatsCard } from "../components/StatsCard";
import { GroupCard } from "../components/GroupCard";
import { NotificationCard } from "../components/NotificationCard";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { apiRequest } from "../lib/api-optimized";
import { useAuth } from "../providers/AuthProvider";

export function DashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [groups, setGroups] = useState([]);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    let ignore = false;

    async function loadDashboard() {
      try {
        // Use optimized single API call
const dashboardResult = await apiRequest("/api/dashboard-optimized/combined", { skipCache: true });
        
        if (!ignore) {
          if (dashboardResult.success) {
            setStats(dashboardResult.stats);
            setGroups(dashboardResult.recent_groups || []);
            setPendingPayments(dashboardResult.recent_payments || []);
            setNotifications(dashboardResult.recent_notifications || []);
          } else {
            setStats(null);
            setGroups([]);
            setPendingPayments([]);
            setNotifications([]);
          }
        }

        } catch (error) {
        if (!ignore) {
          console.error('Dashboard load error:', error);
          setStats(null);
          setGroups([]);
          setPendingPayments([]);
          setNotifications([]);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadDashboard();
    return () => {
      ignore = true;
    };
  }, []);

  const activeGroups = groups.filter((group) =>
    ["open", "active", "full", "completed"].includes(group.display_status || group.status)
  );

  if (loading) {
    return <div className="text-gray-600">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Welcome back, {user?.full_name?.split(" ")[0] || "member"}! Here&apos;s your savings overview.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          icon={Users}
          label="Active Groups"
          value={stats?.groups?.active_groups || 0}
          iconColor="bg-blue-100 text-blue-600"
        />

        <StatsCard
          icon={DollarSign}
          label="Total Saved"
          value={`${Number(stats?.payments?.total_contributed || 0)} Birr`}
          iconColor="bg-green-100 text-green-600"
        />

        <StatsCard
          icon={CreditCard}
          label="Pending Payments"
          value={stats?.payments?.pending_payments || 0}
          iconColor="bg-yellow-100 text-yellow-600"
        />

        <StatsCard
          icon={TrendingUp}
          label="Unread Alerts"
          value={stats?.unread_notifications || 0}
          iconColor="bg-purple-100 text-purple-600"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold text-gray-900">Your Active Groups</h2>
          <Link to="/dashboard/groups">
            <Button variant="outline">Browse All Groups</Button>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeGroups.slice(0, 3).map((group) => (
            <GroupCard
              key={group.id}
              id={group.id}
              name={group.name}
              members={group.member_count}
              maxMembers={group.max_members}
              contributionAmount={Number(group.contribution_amount)}
              progress={group.progress_percentage}
              admin={group.admin_name || group.creator_name}
              status={group.display_status}
              frequency={group.frequency}
              isMember
            />
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Payments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingPayments.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No pending payments</p>
            ) : (
              pendingPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{payment.group_name}</p>
                    <p className="text-sm text-gray-600">
                      Round {payment.round_number} - Due: {payment.due_date || "Soon"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-[#1E3A8A]">{payment.amount} Birr</p>
                    <Link to="/dashboard/payments">
                      <Button size="sm" className="mt-2 bg-[#1E3A8A] hover:bg-[#1E3A8A]/90">
                        Pay Now
                      </Button>
                    </Link>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {notifications.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No notifications yet</p>
            ) : (
              notifications.slice(0, 3).map((notification) => (
                <NotificationCard
                  key={notification.id}
                  type={notification.type}
                  message={notification.message}
                  timestamp={new Date(notification.created_at).toLocaleString()}
                />
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
