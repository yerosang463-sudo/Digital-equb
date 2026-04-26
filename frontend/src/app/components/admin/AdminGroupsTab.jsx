import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import GroupManagement from "./GroupManagement";

function AdminGroupsTab() {
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

export default AdminGroupsTab;
