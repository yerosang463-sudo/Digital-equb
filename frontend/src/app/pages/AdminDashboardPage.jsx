import React, { useState, useEffect, lazy, Suspense } from 'react';

import { useNavigate, Link } from 'react-router-dom';

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



// Lazy load admin components for optimal performance

const AdminOverview = lazy(() => import('../components/admin/AdminOverview'));

const AdminUsersTab = lazy(() => import('../components/admin/AdminUsersTab'));

const AdminGroupsTab = lazy(() => import('../components/admin/AdminGroupsTab'));

const AdminPaymentsTab = lazy(() => import('../components/admin/AdminPaymentsTab'));

const AdminAuditTab = lazy(() => import('../components/admin/AdminAuditTab'));



// Loading component for admin sections

const AdminSectionLoader = () => (

  <div className="flex items-center justify-center py-20">

    <div className="flex flex-col items-center gap-4">

      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>

      <p className="text-gray-600">Loading admin data...</p>

    </div>

  </div>

);



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

    fetchDashboardStats();

  }, [user, navigate]);



  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await apiRequest('/api/admin/analytics', { skipCache: true });

      if (response.success) {
        const data = response.data;
        setStats({
          totalUsers: data.user_stats?.total_users || 0,
          activeUsers: data.user_stats?.active_users || 0,
          totalGroups: data.group_stats?.total_groups || 0,
          activeGroups: data.group_stats?.active_groups || 0,
          totalPayments: data.payment_stats?.total_payments || 0,
          pendingPayments: data.payment_stats?.pending_payments || 0,
          totalRevenue: data.group_stats?.total_contribution_value || 0
        });
      } else {
        setError(response.message || 'Failed to load dashboard statistics');
      }
    } catch (err) {
      setError(`Failed to load dashboard statistics: ${err.message}`);
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

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 gap-4">

            <div className="flex items-center space-x-4 w-full sm:w-auto">

              <Button

                variant="ghost"

                size="icon"

                onClick={() => handleNavigate('/')}

                className="hover:bg-gray-100"

              >

                <Home className="h-5 w-5" />

              </Button>

              <div>

                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Admin Dashboard</h1>

                <p className="text-sm text-gray-500 hidden sm:block">Full platform administration</p>

              </div>

            </div>



            <div className="flex items-center justify-between sm:justify-end space-x-2 sm:space-x-4 w-full sm:w-auto">

              <div className="flex items-center space-x-2">

                <Shield className="h-5 w-5 text-green-600" />

                <div className="hidden sm:block">

                  <div>

                    <span className="text-sm font-medium text-gray-700">

                      {user?.full_name || 'Admin'}

                    </span>

                    {user?.email && (

                      <span className="text-xs text-gray-500 ml-2">

                        {user.email}

                      </span>

                    )}

                  </div>

                  {user?.phone && (

                    <span className="text-xs text-gray-500 ml-2">

                      {user.phone}

                    </span>

                  )}

                </div>

                <div className="sm:hidden">

                  <span className="text-sm font-medium text-gray-700">

                    {user?.full_name || 'Admin'}

                  </span>

                </div>

              </div>

              <Button

                variant="outline"

                size="sm"

                onClick={handleLogout}

                className="flex items-center space-x-2"

              >

                <LogOut className="h-4 w-4" />

                <span className="hidden sm:inline">Logout</span>

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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">

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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">

          <TabsList className="grid grid-cols-5 w-full lg:grid-cols-5 md:grid-cols-3 sm:grid-cols-2 overflow-x-auto">

            <TabsTrigger value="overview" className="flex items-center space-x-2 whitespace-nowrap">

              <BarChart3 className="h-4 w-4" />

              <span>Overview</span>

            </TabsTrigger>

            <TabsTrigger value="users" className="flex items-center space-x-2 whitespace-nowrap">

              <Users className="h-4 w-4" />

              <span>Users</span>

            </TabsTrigger>

            <TabsTrigger value="groups" className="flex items-center space-x-2 whitespace-nowrap">

              <UsersRound className="h-4 w-4" />

              <span>Groups</span>

            </TabsTrigger>

            <TabsTrigger value="payments" className="flex items-center space-x-2 whitespace-nowrap">

              <CreditCard className="h-4 w-4" />

              <span>Payments</span>

            </TabsTrigger>

            <TabsTrigger value="audit" className="flex items-center space-x-2 whitespace-nowrap">

              <FileText className="h-4 w-4" />

              <span>Audit Logs</span>

            </TabsTrigger>

          </TabsList>



          {/* Overview Tab */}

          <TabsContent value="overview" className="space-y-4">

            <Suspense fallback={<AdminSectionLoader />}>

              <AdminOverview stats={stats} setActiveTab={setActiveTab} />

            </Suspense>

          </TabsContent>



          {/* Users Tab */}

          <TabsContent value="users">

            <Suspense fallback={<AdminSectionLoader />}>

              <AdminUsersTab />

            </Suspense>

          </TabsContent>



          {/* Groups Tab */}

          <TabsContent value="groups">

            <Suspense fallback={<AdminSectionLoader />}>

              <AdminGroupsTab />

            </Suspense>

          </TabsContent>



          {/* Payments Tab */}

          <TabsContent value="payments">

            <Suspense fallback={<AdminSectionLoader />}>

              <AdminPaymentsTab />

            </Suspense>

          </TabsContent>



          {/* Audit Logs Tab */}

          <TabsContent value="audit">

            <Suspense fallback={<AdminSectionLoader />}>

              <AdminAuditTab />

            </Suspense>

          </TabsContent>

        </Tabs>

      </main>



      {/* Footer */}

      <footer className="bg-white border-t mt-8">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">

          <div className="flex justify-between items-center">

            <div className="flex items-center gap-2">
              <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer">
                <div className="w-8 h-8 bg-[#1E3A8A] rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">E</span>
                </div>
                <span className="text-[#1E3A8A] font-semibold">Digital Equb</span>
              </Link>
              <span className="text-sm text-gray-500">- Admin Dashboard</span>
            </div>

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

