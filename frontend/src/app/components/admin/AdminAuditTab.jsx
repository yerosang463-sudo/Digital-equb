import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import AuditLogs from "./AuditLogs";

function AdminAuditTab() {
  return (
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
  );
}

export default AdminAuditTab;
