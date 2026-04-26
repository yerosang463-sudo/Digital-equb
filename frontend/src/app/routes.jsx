import { createBrowserRouter, Outlet, lazy, Suspense } from "react-router";
import { RootLayout } from "./layouts/RootLayout";
import { DashboardLayout } from "./layouts/DashboardLayout";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { DashboardPage } from "./pages/DashboardPage";
import { BrowseGroupsPage } from "./pages/BrowseGroupsPage";
import { GroupDetailPage } from "./pages/GroupDetailPage";
import { PaymentsPage } from "./pages/PaymentsPage";
import { ProfilePage } from "./pages/ProfilePage";
import { NotFoundPage } from "./pages/NotFoundPage";
import AdminRouteProtection from "./components/AdminRouteProtection";
import UserRouteProtection from "./components/UserRouteProtection";

// Lazy load heavy components
const AdminDashboardPage = lazy(() => import("./pages/AdminDashboardPage"));

export const router = createBrowserRouter([
{
  path: "/",
  Component: RootLayout,
  children: [
  { index: true, Component: HomePage },
  { path: "login", Component: LoginPage },
  { path: "signup", Component: SignupPage }]

},
{
  path: "/dashboard",
  element: <UserRouteProtection />,
  children: [
    {
      element: <DashboardLayout />,
      children: [
        { index: true, element: <DashboardPage /> },
        { path: "groups", element: <BrowseGroupsPage /> },
        { path: "groups/:groupId", element: <GroupDetailPage /> },
        { path: "payments", element: <PaymentsPage /> },
        { path: "profile", element: <ProfilePage /> }
      ]
    }
  ]
},
{
  path: "/admin",
  element: <AdminRouteProtection />,
  children: [
    { 
      index: true, 
      element: (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>}>
          <AdminDashboardPage />
        </Suspense>
      ) 
    }
  ]
},
{
  path: "*",
  Component: NotFoundPage
}]
);