import { Users, TrendingUp, CreditCard, DollarSign } from "lucide-react";
import { StatsCard } from "../components/StatsCard";
import { GroupCard } from "../components/GroupCard";
import { NotificationCard } from "../components/NotificationCard";
import { mockGroups, mockPayments, mockNotifications } from "../data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Link } from "react-router";

export function DashboardPage() {
  const activeGroups = mockGroups.filter((g) => g.status === "active" || g.status === "full");
  const pendingPayments = mockPayments.filter((p) => p.status === "pending");
  const totalSaved = mockPayments.
  filter((p) => p.status === "completed").
  reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back, Abebe! Here's your savings overview.</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          icon={Users}
          label="Active Groups"
          value={activeGroups.length}
          iconColor="bg-blue-100 text-blue-600" />
        
        <StatsCard
          icon={DollarSign}
          label="Total Saved"
          value={`${totalSaved} Birr`}
          change="+12% this month"
          iconColor="bg-green-100 text-green-600" />
        
        <StatsCard
          icon={CreditCard}
          label="Pending Payments"
          value={pendingPayments.length}
          iconColor="bg-yellow-100 text-yellow-600" />
        
        <StatsCard
          icon={TrendingUp}
          label="Total Members"
          value={activeGroups.reduce((sum, g) => sum + g.members.length, 0)}
          iconColor="bg-purple-100 text-purple-600" />
        
      </div>

      {/* Active Groups */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold text-gray-900">Your Active Groups</h2>
          <Link to="/dashboard/groups">
            <Button variant="outline">Browse All Groups</Button>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeGroups.slice(0, 3).map((group) => {
            const progress = group.currentRound / group.totalRounds * 100;
            return (
              <GroupCard
                key={group.id}
                id={group.id}
                name={group.name}
                members={group.members.length}
                maxMembers={group.maxMembers}
                contributionAmount={group.contributionAmount}
                progress={progress}
                admin={group.admin}
                status={group.status} />);


          })}
        </div>
      </div>

      {/* Upcoming Payments and Notifications */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Upcoming Payments */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Payments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingPayments.length === 0 ?
            <p className="text-gray-500 text-center py-4">No pending payments</p> :

            pendingPayments.map((payment) =>
            <div
              key={payment.id}
              className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              
                  <div>
                    <p className="font-medium">{payment.groupName}</p>
                    <p className="text-sm text-gray-600">Due: May 1, 2026</p>
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
            )
            }
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockNotifications.slice(0, 3).map((notification) =>
            <NotificationCard
              key={notification.id}
              type={notification.type}
              message={notification.message}
              timestamp={notification.timestamp} />

            )}
          </CardContent>
        </Card>
      </div>
    </div>);

}