import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import UserManagement from "./UserManagement";

function AdminUsersTab() {
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

export default AdminUsersTab;
