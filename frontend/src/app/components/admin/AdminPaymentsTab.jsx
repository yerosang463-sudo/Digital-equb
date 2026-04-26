import { lazy } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import PaymentManagement from "./PaymentManagement";

export const AdminPaymentsTab = lazy(() => import('./AdminPaymentsTab'));

function AdminPaymentsTabComponent() {
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
