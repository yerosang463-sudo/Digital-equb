import { useEffect, useState, useMemo, useCallback } from "react";
import { Users, TrendingUp, CreditCard, DollarSign } from "lucide-react";
import { Link } from "react-router-dom";
import { StatsCard } from "../components/StatsCard";
import { GroupCard } from "../components/GroupCard";
import { NotificationCard } from "../components/NotificationCard";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { apiRequest } from "../lib/api";
import { useAuth } from "../providers/AuthProvider";

// Optimized dashboard hook - single API call
function useDashboardDataOptimized() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    stats: null,
    groups: [],
    pendingPayments: [],
    notifications: [],
  });
  const [error, setError] = useState(null);

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Single optimized API call instead of 4 separate calls
      const result = await apiRequest("/api/dashboard-optimized/combined");
      
      if (result.success) {
        setData({
          stats: result.stats,
          groups: result.recent_groups || [],
          pendingPayments: result.recent_payments || [],
          notifications: result.recent_notifications || [],
        });
      }
    } catch (err) {
      setError(err.message);
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    
    if (!ignore) {
      loadDashboard();
    }
    
    return () => {
      ignore = true;
    };
  }, [loadDashboard]);

  // Memoize expensive calculations
  const activeGroups = useMemo(() => {
    return data.groups.filter((group) =>
      ["open", "active", "full", "completed"].includes(group.display_status || group.status)
    );
  }, [data.groups]);

  const statsMemo = useMemo(() => {
    return data.stats || {};
  }, [data.stats]);

  return {
    loading,
    error,
    stats: statsMemo,
    activeGroups,
    pendingPayments: data.pendingPayments,
    notifications: data.notifications,
    refetch: loadDashboard
  };
}

// Memoized stats card component to prevent unnecessary re-renders
const OptimizedStatsCard = React.memo(({ icon, label, value, iconColor }) => {
  return (
    <StatsCard
      icon={icon}
      label={label}
      value={value}
      iconColor={iconColor}
    />
  );
});

// Memoized notification card
const OptimizedNotificationCard = React.memo(({ notification }) => {
  return (
    <NotificationCard
      type={notification.type}
      message={notification.message}
      timestamp={new Date(notification.created_at).toLocaleString()}
    />
  );
});

// Memoized payment card
const OptimizedPaymentCard = React.memo(({ payment }) => {
  return (
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
  );
});

// Memoized group card
const OptimizedGroupCard = React.memo(({ group }) => {
  return (
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
  );
});

export function DashboardPageOptimized() {
  const { user } = useAuth();
  const {
    loading,
    error,
    stats,
    activeGroups,
    pendingPayments,
    notifications,
    refetch
  } = useDashboardDataOptimized();

  // Memoized loading skeleton
  const LoadingSkeleton = useMemo(() => (
    <div className="space-y-6">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-gray-200 rounded-lg animate-pulse"></div>
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="h-48 bg-gray-200 rounded-lg animate-pulse"></div>
        <div className="h-48 bg-gray-200 rounded-lg animate-pulse"></div>
      </div>
    </div>
  ), []);

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">Failed to load dashboard</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={refetch} className="bg-[#1E3A8A] hover:bg-[#1E3A8A]/90">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return LoadingSkeleton;
  }

  // Main dashboard content
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Welcome back, {user?.full_name?.split(" ")[0] || "member"}! Here&apos;s your savings overview.
        </p>
      </div>

      {/* Stats Cards - Memoized */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <OptimizedStatsCard
          icon={Users}
          label="Active Groups"
          value={stats?.groups?.active_groups || 0}
          iconColor="bg-blue-100 text-blue-600"
        />

        <OptimizedStatsCard
          icon={DollarSign}
          label="Total Saved"
          value={`${Number(stats?.payments?.total_contributed || 0)} Birr`}
          iconColor="bg-green-100 text-green-600"
        />

        <OptimizedStatsCard
          icon={CreditCard}
          label="Pending Payments"
          value={stats?.payments?.pending_payments || 0}
          iconColor="bg-yellow-100 text-yellow-600"
        />

        <OptimizedStatsCard
          icon={TrendingUp}
          label="Unread Alerts"
          value={stats?.unread_notifications || 0}
          iconColor="bg-purple-100 text-purple-600"
        />
      </div>

      {/* Active Groups - Memoized */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold text-gray-900">Your Active Groups</h2>
          <Link to="/dashboard/groups">
            <Button variant="outline">Browse All Groups</Button>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeGroups.slice(0, 3).map((group) => (
            <OptimizedGroupCard key={group.id} group={group} />
          ))}
        </div>
      </div>

      {/* Payments and Notifications - Memoized */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Payments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingPayments.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No pending payments</p>
            ) : (
              pendingPayments.slice(0, 3).map((payment) => (
                <OptimizedPaymentCard key={payment.id} payment={payment} />
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
                <OptimizedNotificationCard key={notification.id} notification={notification} />
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
