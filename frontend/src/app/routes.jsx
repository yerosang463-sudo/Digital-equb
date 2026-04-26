import { createBrowserRouter, Outlet } from "react-router";
import { RootLayout } from "./layouts/RootLayout";
import { DashboardLayout } from "./layouts/DashboardLayout";
import AdminRouteProtection from "./components/AdminRouteProtection";
import UserRouteProtection from "./components/UserRouteProtection";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { DashboardPage } from "./pages/DashboardPage";
import { BrowseGroupsPage } from "./pages/BrowseGroupsPage";
import { GroupDetailPage } from "./pages/GroupDetailPage";
import { PaymentsPage } from "./pages/PaymentsPage";
import { ProfilePage } from "./pages/ProfilePage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { AboutPage } from "./pages/AboutPage";
import { PricingPage } from "./pages/PricingPage";
import { ContactPage } from "./pages/ContactPage";
import { HowItWorksPage } from "./pages/HowItWorksPage";
import { FeaturesPage } from "./pages/FeaturesPage";
import { SupportPage } from "./pages/SupportPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, element: <HomePage /> },
      { path: "login", element: <LoginPage /> },
      { path: "signup", element: <SignupPage /> },
      { path: "about", element: <AboutPage /> },
      { path: "how-it-works", element: <HowItWorksPage /> },
      { path: "pricing", element: <PricingPage /> },
      { path: "contact", element: <ContactPage /> },
      { path: "features", element: <FeaturesPage /> },
      { path: "support", element: <SupportPage /> }
    ]
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
      { index: true, element: <AdminDashboardPage /> }
    ]
  },
  {
    path: "*",
    element: <NotFoundPage />
  }
]);