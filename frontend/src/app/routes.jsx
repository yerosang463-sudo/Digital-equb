import { createBrowserRouter, Outlet } from "react-router";
import { lazy, Suspense } from "react";
import { RootLayout } from "./layouts/RootLayout";
import { DashboardLayout } from "./layouts/DashboardLayout";
import AdminRouteProtection from "./components/AdminRouteProtection";
import UserRouteProtection from "./components/UserRouteProtection";

// Lazy load all routes for optimal performance
const HomePage = lazy(() => import("./pages/HomePage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const SignupPage = lazy(() => import("./pages/SignupPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const BrowseGroupsPage = lazy(() => import("./pages/BrowseGroupsPage"));
const GroupDetailPage = lazy(() => import("./pages/GroupDetailPage"));
const PaymentsPage = lazy(() => import("./pages/PaymentsPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const AdminDashboardPage = lazy(() => import("./pages/AdminDashboardPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));

// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen bg-white">
    <div className="flex flex-col items-center gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      { 
        index: true, 
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <HomePage />
          </Suspense>
        ) 
      },
      { 
        path: "login", 
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <LoginPage />
          </Suspense>
        ) 
      },
      { 
        path: "signup", 
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <SignupPage />
          </Suspense>
        ) 
      }]
  },
  {
    path: "/dashboard",
    element: <UserRouteProtection />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { 
            index: true, 
            element: (
              <Suspense fallback={<LoadingSpinner />}>
                <DashboardPage />
              </Suspense>
            ) 
          },
          { 
            path: "groups", 
            element: (
              <Suspense fallback={<LoadingSpinner />}>
                <BrowseGroupsPage />
              </Suspense>
            ) 
          },
          { 
            path: "groups/:groupId", 
            element: (
              <Suspense fallback={<LoadingSpinner />}>
                <GroupDetailPage />
              </Suspense>
            ) 
          },
          { 
            path: "payments", 
            element: (
              <Suspense fallback={<LoadingSpinner />}>
                <PaymentsPage />
              </Suspense>
            ) 
          },
          { 
            path: "profile", 
            element: (
              <Suspense fallback={<LoadingSpinner />}>
                <ProfilePage />
              </Suspense>
            ) 
          }
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
          <Suspense fallback={<LoadingSpinner />}>
            <AdminDashboardPage />
          </Suspense>
        ) 
      }
    ]
  },
  {
    path: "*",
    element: (
      <Suspense fallback={<LoadingSpinner />}>
        <NotFoundPage />
      </Suspense>
    )
  }
]);