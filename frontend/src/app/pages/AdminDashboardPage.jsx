import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  Users, 
  UsersRound, 
  CreditCard, 
  BarChart3, 
  FileText,
  Shield,
  LogOut,
  Home
} from 'lucide-react';
import { useAuth } from '../providers/AuthProvider';
import { apiRequest } from '../lib/api';
import UserManagement from '../components/admin/UserManagement';
import GroupManagement from '../components/admin/GroupManagement';
import PaymentManagement from '../components/admin/PaymentManagement';
import AuditLogs from '../components/admin/AuditLogs';

const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalGroups: 0,
    activeGroups: 0,
    totalPayments: 0,
    pendingPayments: 0,
    totalRevenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if user is admin
    if (!user || !user.isAdmin) {
      navigate('/login');
      return;
    }

    fetchDashboardStats();
  }, [user, navigate]);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch analytics data
      const response = await apiRequest('/api/admin/analytics');
      
      if (response.success) {
        const data = response.data;
        
        // Extract stats from analytics
        setStats({
          totalUsers: data.user_stats?.total_users || 0,
          activeUsers: data.user_stats?.active_users || 0,
          totalGroups: data.group_stats?.total_groups || 0,
          activeGroups: data.group_stats?.active_groups || 0,
          totalPayments: data.payment_stats?.total_payments || 0,
          pendingPayments: data.payment_stats?.pending_payments || 0,
          totalRevenue: data.group_stats?.total_contribution_value || 0
        });
      }
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
      setError('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };


  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleNavigate = (path) => {
    navigate(path);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => handleNavigate('/')}
                className="hover:bg-gray-100"
              >
                <Home className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-500">Full platform administration</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-gray-700">
                  {user?.full_name || 'Admin'}
                </span>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleLogout}
                className="flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

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

        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Users</span>
            </TabsTrigger>
            <TabsTrigger value="groups" className="flex items-center space-x-2">
              <UsersRound className="h-4 w-4" />
              <span>Groups</span>
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center space-x-2">
              <CreditCard className="h-4 w-4" />
              <span>Payments</span>
            </TabsTrigger>
            <TabsTrigger value="audit" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>Audit Logs</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Common administrative tasks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Latest platform activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Users className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium">New user registration</p>
                        <p className="text-sm text-gray-500">2 minutes ago</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">View</Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <UsersRound className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium">New group created</p>
                        <p className="text-sm text-gray-500">15 minutes ago</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">View</Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <CreditCard className="h-5 w-5 text-purple-600" />
                      <div>
                        <p className="font-medium">Payment completed</p>
                        <p className="text-sm text-gray-500">1 hour ago</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">View</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  Manage all platform users
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UserManagement />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Groups Tab */}
          <TabsContent value="groups">
            <Card>
              <CardHeader>
                <CardTitle>Group Management</CardTitle>
                <CardDescription>
                  Manage all equb groups
                </CardDescription>
              </CardHeader>
              <CardContent>
                <GroupManagement />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <CardTitle>Payment Monitoring</CardTitle>
                <CardDescription>
                  Monitor payments and process refunds
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PaymentManagement />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Audit Logs Tab */}
          <TabsContent value="audit">
            <Card>
              <CardHeader>
                <CardTitle>Audit Logs</CardTitle>
                <CardDescription>
                  View all admin actions and system activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AuditLogs />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">
              Admin Dashboard - Digital Equb Platform
            </p>
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-green-600" />
              <span className="text-sm text-gray-500">Administrator Access</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AdminDashboardPage;
