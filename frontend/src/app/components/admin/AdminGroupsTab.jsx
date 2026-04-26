import { lazy } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import GroupManagement from "./GroupManagement";

export const AdminGroupsTab = lazy(() => import('./AdminGroupsTab'));

function AdminGroupsTabComponent() {
  return (
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
  );
}

export default AdminGroupsTabComponent;
