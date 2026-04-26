import { lazy } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import UserManagement from "./UserManagement";

export const AdminUsersTab = lazy(() => import('./AdminUsersTab'));

function AdminUsersTabComponent() {
  return (
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
  );
}

export default AdminUsersTabComponent;
