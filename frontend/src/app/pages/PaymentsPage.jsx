import { useEffect, useState } from "react";
import { CheckCircle, Loader2, CreditCard } from "lucide-react";
import { useSearchParams } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { apiRequest } from "../lib/api";

export function PaymentsPage() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [autoOpenedGroupId, setAutoOpenedGroupId] = useState("");

  const requestedGroupId = searchParams.get("groupId");

  useEffect(() => {
    let ignore = false;

    async function loadPayments() {
      try {
        const response = await apiRequest("/api/payments?limit=100");
        if (!ignore) {
          setPayments(response.payments || []);
        }
      } catch (error) {
        if (!ignore) {
          setPayments([]);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadPayments();
    return () => {
      ignore = true;
    };
  }, []);

  const visiblePayments = requestedGroupId
    ? payments.filter((payment) => String(payment.group_id) === String(requestedGroupId))
    : payments;

  const pendingPayments = visiblePayments.filter((payment) => payment.status === "pending");
  const completedPayments = visiblePayments.filter((payment) => payment.status === "completed");

  useEffect(() => {
    if (!requestedGroupId || loading || autoOpenedGroupId === requestedGroupId) {
      return;
    }

    if (pendingPayments.length === 1) {
      handlePayNow(pendingPayments[0]);
      setAutoOpenedGroupId(requestedGroupId);
    }
  }, [requestedGroupId, loading, pendingPayments, autoOpenedGroupId]);

  function handlePayNow(payment) {
    setSelectedPayment(payment);
    setPhoneNumber(payment.telebirr_phone || "");
    setPaymentSuccess(false);
    setIsPaymentModalOpen(true);
  }

  async function handleTelebirrPayment() {
    if (!phoneNumber) {
      window.alert("Please enter your Telebirr phone number");
      return;
    }

    if (!selectedPayment) {
      return;
    }

    setIsProcessing(true);
    try {
      const response = await apiRequest(`/api/payments/${selectedPayment.id}/telebirr/simulate`, {
        method: "POST",
        body: { phone: phoneNumber },
      });

      setPayments((current) =>
        current.map((payment) => (payment.id === response.payment.id ? response.payment : payment))
      );
      setPaymentSuccess(true);
    } catch (error) {
      window.alert(error.message);
    } finally {
      setIsProcessing(false);
    }
  }

  function closePaymentModal(open) {
    setIsPaymentModalOpen(open);
    if (!open) {
      setPaymentSuccess(false);
      setSelectedPayment(null);
      setPhoneNumber("");
      setIsProcessing(false);
    }
  }

  if (loading) {
    return <div className="text-gray-600">Loading payments...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
        <p className="text-gray-600 mt-1">
          {requestedGroupId ? "Complete the selected group payment and review its history" : "Manage your contributions and payment history"}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Pending Payments</span>
            {pendingPayments.length > 0 ? (
              <Badge className="bg-yellow-100 text-yellow-800">{pendingPayments.length} pending</Badge>
            ) : null}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingPayments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
              <p>All caught up! No pending payments.</p>
              <p className="text-sm mt-3 text-gray-400 max-w-sm mx-auto">
                If your group is relatively new and still waiting for members to join, your payment will automatically appear here once Round 1 actually begins.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
                >
                  <div>
                    <p className="font-semibold text-gray-900">{payment.group_name}</p>
                    <p className="text-sm text-gray-600">
                      Round {payment.round_number} - Due: {payment.due_date || "Soon"}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-[#1E3A8A]">{payment.amount} Birr</p>
                    </div>
                    <Button className="bg-[#1E3A8A] hover:bg-[#1E3A8A]/90" onClick={() => handlePayNow(payment)}>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Pay with Telebirr
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Group</TableHead>
                <TableHead>Round</TableHead>
                <TableHead>Method</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {completedPayments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium">
                    {payment.paid_at ? new Date(payment.paid_at).toLocaleDateString() : payment.due_date}
                  </TableCell>
                  <TableCell>{payment.group_name}</TableCell>
                  <TableCell>Round {payment.round_number}</TableCell>
                  <TableCell className="capitalize">{payment.payment_method}</TableCell>
                  <TableCell className="text-right font-semibold">{payment.amount} Birr</TableCell>
                  <TableCell className="text-right">
                    <Badge className="bg-green-100 text-green-800">Completed</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isPaymentModalOpen} onOpenChange={closePaymentModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pay with Telebirr</DialogTitle>
            <DialogDescription>Complete your payment securely using Telebirr</DialogDescription>
          </DialogHeader>

          {!paymentSuccess ? (
            <div className="space-y-6 py-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Group:</span>
                  <span className="font-semibold">{selectedPayment?.group_name}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Round:</span>
                  <span className="font-semibold">Round {selectedPayment?.round_number}</span>
                </div>
                <div className="flex justify-between text-lg">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-bold text-[#1E3A8A]">{selectedPayment?.amount} Birr</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telebirr Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+251 91 234 5678"
                  value={phoneNumber}
                  onChange={(event) => setPhoneNumber(event.target.value)}
                  disabled={isProcessing}
                />
                <p className="text-xs text-gray-500">Enter your Telebirr-registered phone number</p>
              </div>

              <Button
                className="w-full bg-[#1E3A8A] hover:bg-[#1E3A8A]/90"
                onClick={handleTelebirrPayment}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing Payment...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Confirm Payment
                  </>
                )}
              </Button>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <p className="text-xs text-gray-600 text-center">
                  Secure payment is simulated through Telebirr for this demo flow.
                </p>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h3>
              <p className="text-gray-600 mb-1">
                Your payment of {selectedPayment?.amount} Birr has been processed.
              </p>
              <p className="text-sm text-gray-500">The payment history is already updated in your account.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
