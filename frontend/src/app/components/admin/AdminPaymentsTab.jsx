import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import PaymentManagement from "./PaymentManagement";

function AdminPaymentsTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Monitoring</CardTitle>
        <CardDescription>
          Monitor payments and process refunds
        </CardDescription>
      </CardHeader>
      <CardContent>
        <PaymentManagement />
      </CardContent>
    </Card>
  );
}

export default AdminPaymentsTabComponent;
