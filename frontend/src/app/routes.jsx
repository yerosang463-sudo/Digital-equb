import { createBrowserRouter } from "react-router";
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
  Component: DashboardLayout,
  children: [
  { index: true, Component: DashboardPage },
  { path: "groups", Component: BrowseGroupsPage },
  { path: "groups/:groupId", Component: GroupDetailPage },
  { path: "payments", Component: PaymentsPage },
  { path: "profile", Component: ProfilePage }]

},
{
  path: "*",
  Component: NotFoundPage
}]
);