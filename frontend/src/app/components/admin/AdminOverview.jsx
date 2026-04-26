import { lazy } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Users, UsersRound, CreditCard, BarChart3, Home } from "lucide-react";

export const AdminOverview = lazy(() => import('./AdminOverview'));

function AdminOverviewComponent({ stats, setActiveTab }) {
  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeUsers} active users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Groups</CardTitle>
            <UsersRound className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalGroups}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeGroups} active groups
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPayments}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingPayments} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Total contribution value
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common administrative tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="flex flex-col items-center justify-center h-32"
              onClick={() => setActiveTab('users')}
            >
              <Users className="h-8 w-8 mb-2" />
              <span>Manage Users</span>
              <p className="text-xs text-gray-500 mt-1">View, edit, ban users</p>
            </Button>

            <Button
              variant="outline"
              className="flex flex-col items-center justify-center h-32"
              onClick={() => setActiveTab('groups')}
            >
              <UsersRound className="h-8 w-8 mb-2" />
              <span>Manage Groups</span>
              <p className="text-xs text-gray-500 mt-1">View, edit, close groups</p>
            </Button>

            <Button
              variant="outline"
              className="flex flex-col items-center justify-center h-32"
              onClick={() => setActiveTab('payments')}
            >
              <CreditCard className="h-8 w-8 mb-2" />
              <span>Manage Payments</span>
              <p className="text-xs text-gray-500 mt-1">View, refund payments</p>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Latest platform activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 rounded-lg gap-3">
              <div className="flex items-center space-x-3">
                <Users className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium">New user registration</p>
                  <p className="text-sm text-gray-500">2 minutes ago</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="w-full sm:w-auto">View</Button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 rounded-lg gap-3">
              <div className="flex items-center space-x-3">
                <UsersRound className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium">New group created</p>
                  <p className="text-sm text-gray-500">15 minutes ago</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="w-full sm:w-auto">View</Button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 rounded-lg gap-3">
              <div className="flex items-center space-x-3">
                <CreditCard className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="font-medium">Payment completed</p>
                  <p className="text-sm text-gray-500">1 hour ago</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="w-full sm:w-auto">View</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminOverviewComponent;
