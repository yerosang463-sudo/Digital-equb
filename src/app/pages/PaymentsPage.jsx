import { useState } from "react";
import { mockPayments } from "../data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { CheckCircle, Loader2, CreditCard } from "lucide-react";

export function PaymentsPage() {
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const pendingPayments = mockPayments.filter((p) => p.status === "pending");
  const completedPayments = mockPayments.filter((p) => p.status === "completed");

  const handlePayNow = (payment) => {
    setSelectedPayment(payment);
    setIsPaymentModalOpen(true);
    setPaymentSuccess(false);
  };

  const handleTelebirrPayment = () => {
    if (!phoneNumber) {
      alert("Please enter your Telebirr phone number");
      return;
    }

    setIsProcessing(true);

    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      setPaymentSuccess(true);

      // Close modal after 2 seconds
      setTimeout(() => {
        setIsPaymentModalOpen(false);
        setPhoneNumber("");
        setSelectedPayment(null);
      }, 2000);
    }, 2000);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
        <p className="text-gray-600 mt-1">Manage your contributions and payment history</p>
      </div>

      {/* Pending Payments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Pending Payments</span>
            {pendingPayments.length > 0 &&
            <Badge className="bg-yellow-100 text-yellow-800">
                {pendingPayments.length} pending
              </Badge>
            }
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingPayments.length === 0 ?
          <div className="text-center py-8 text-gray-500">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
              <p>All caught up! No pending payments.</p>
            </div> :

          <div className="space-y-4">
              {pendingPayments.map((payment) =>
            <div
              key={payment.id}
              className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              
                  <div>
                    <p className="font-semibold text-gray-900">{payment.groupName}</p>
                    <p className="text-sm text-gray-600">Round {payment.round} - Due: May 1, 2026</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-[#1E3A8A]">{payment.amount} Birr</p>
                    </div>
                    <Button
                  className="bg-[#1E3A8A] hover:bg-[#1E3A8A]/90"
                  onClick={() => handlePayNow(payment)}>
                  
                      <CreditCard className="w-4 h-4 mr-2" />
                      Pay with Telebirr
                    </Button>
                  </div>
                </div>
            )}
            </div>
          }
        </CardContent>
      </Card>

      {/* Payment History */}
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
              {completedPayments.map((payment) =>
              <TableRow key={payment.id}>
                  <TableCell className="font-medium">{payment.date}</TableCell>
                  <TableCell>{payment.groupName}</TableCell>
                  <TableCell>Round {payment.round}</TableCell>
                  <TableCell className="capitalize">{payment.method}</TableCell>
                  <TableCell className="text-right font-semibold">{payment.amount} Birr</TableCell>
                  <TableCell className="text-right">
                    <Badge className="bg-green-100 text-green-800">Completed</Badge>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Telebirr Payment Modal */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pay with Telebirr</DialogTitle>
            <DialogDescription>
              Complete your payment securely using Telebirr
            </DialogDescription>
          </DialogHeader>

          {!paymentSuccess ?
          <div className="space-y-6 py-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Group:</span>
                  <span className="font-semibold">{selectedPayment?.groupName}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Round:</span>
                  <span className="font-semibold">Round {selectedPayment?.round}</span>
                </div>
                <div className="flex justify-between text-lg">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-bold text-[#1E3A8A]">
                    {selectedPayment?.amount} Birr
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telebirr Phone Number</Label>
                <Input
                id="phone"
                type="tel"
                placeholder="+251 91 234 5678"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                disabled={isProcessing} />
              
                <p className="text-xs text-gray-500">
                  Enter your Telebirr-registered phone number
                </p>
              </div>

              <Button
              className="w-full bg-[#1E3A8A] hover:bg-[#1E3A8A]/90"
              onClick={handleTelebirrPayment}
              disabled={isProcessing}>
              
                {isProcessing ?
              <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing Payment...
                  </> :

              <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Confirm Payment
                  </>
              }
              </Button>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <p className="text-xs text-gray-600 text-center">
                  🔒 Secure payment powered by Telebirr. You'll receive an SMS confirmation.
                </p>
              </div>
            </div> :

          <div className="py-8 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h3>
              <p className="text-gray-600 mb-1">
                Your payment of {selectedPayment?.amount} Birr has been processed.
              </p>
              <p className="text-sm text-gray-500">
                Check your Telebirr for confirmation.
              </p>
            </div>
          }
        </DialogContent>
      </Dialog>
    </div>);

}