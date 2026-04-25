import React, { useState, useEffect } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../ui/table';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { 
  Search, 
  Filter, 
  MoreVertical, 
  DollarSign,
  CreditCard,
  RefreshCw,
  Eye,
  AlertTriangle
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Badge } from '../ui/badge';
import { apiRequest } from '../../lib/api';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

const PaymentManagement = () => {
  const [payments, setPayments] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [selectedPayout, setSelectedPayout] = useState(null);
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showPayoutDetailsDialog, setShowPayoutDetailsDialog] = useState(false);
  const [password, setPassword] = useState('');
  const [reason, setReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('payments');

  useEffect(() => {
    if (activeTab === 'payments') {
      fetchPayments();
    } else {
      fetchPayouts();
    }
  }, [page, activeTab]);

  useEffect(() => {
    filterPayments();
  }, [payments, searchTerm, statusFilter]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await apiRequest(`/api/admin/payments?page=${page}&limit=10`);
      
      if (response.success) {
        setPayments(response.data.payments);
        setTotalPages(response.data.pagination.pages);
      }
    } catch (err) {
      console.error('Failed to fetch payments:', err);
      setError(err.message || 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const fetchPayouts = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await apiRequest(`/api/admin/payouts?page=${page}&limit=10`);
      
      if (response.success) {
        setPayouts(response.data.payouts);
        setTotalPages(response.data.pagination.pages);
      }
    } catch (err) {
      console.error('Failed to fetch payouts:', err);
      setError(err.message || 'Failed to load payouts');
    } finally {
      setLoading(false);
    }
  };

  const filterPayments = () => {
    let filtered = [...payments];
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(payment => 
        String(payment.transaction_id || `PAY-${payment.id}`).toLowerCase().includes(term) ||
        String(payment.user_name || '').toLowerCase().includes(term) ||
        String(payment.user_email || '').toLowerCase().includes(term) ||
        String(payment.group_name || '').toLowerCase().includes(term)
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(payment => payment.status === statusFilter);
    }
    
    setFilteredPayments(filtered);
  };

  const handleRefundPayment = async (paymentId) => {
    try {
      setActionLoading(true);
      
      const response = await apiRequest(`/api/admin/payments/${paymentId}/refund`, {
        method: 'POST',
        body: { password, reason }
      });
      
      if (response.success) {
        // Update payment status in local state
        setPayments(prevPayments => 
          prevPayments.map(payment => 
            payment.id === paymentId ? { ...payment, status: 'refunded' } : payment
          )
        );
        setShowRefundDialog(false);
        setPassword('');
        setReason('');
        setSelectedPayment(null);
      }
    } catch (err) {
      console.error('Failed to refund payment:', err);
      setError(err.message || 'Failed to refund payment');
    } finally {
      setActionLoading(false);
    }
  };

  const fetchPaymentDetails = async (paymentId) => {
    try {
      setActionLoading(true);
      
      const response = await apiRequest(`/api/admin/payments/${paymentId}`);
      
      if (response.success) {
        setSelectedPayment(response.data.payment);
        setShowDetailsDialog(true);
      }
    } catch (err) {
      console.error('Failed to fetch payment details:', err);
      setError(err.message || 'Failed to fetch payment details');
    } finally {
      setActionLoading(false);
    }
  };

  const fetchPayoutDetails = async (payout) => {
    try {
      setActionLoading(true);

      const response = await apiRequest(`/api/admin/payouts/${payout.id}`);

      if (response.success) {
        setSelectedPayout(response.data.payout);
      } else {
        setSelectedPayout(payout);
      }
      setShowPayoutDetailsDialog(true);
    } catch (err) {
      console.error('Failed to fetch payout details:', err);
      // Fall back to the table row data so the action still works.
      setSelectedPayout(payout);
      setShowPayoutDetailsDialog(true);
      setError(err.message || 'Failed to fetch full payout details');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      completed: { color: 'bg-green-100 text-green-800', label: 'Completed' },
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      failed: { color: 'bg-red-100 text-red-800', label: 'Failed' },
      refunded: { color: 'bg-purple-100 text-purple-800', label: 'Refunded' },
      scheduled: { color: 'bg-blue-100 text-blue-800', label: 'Scheduled' },
      paid: { color: 'bg-green-100 text-green-800', label: 'Paid' },
      cancelled: { color: 'bg-red-100 text-red-800', label: 'Cancelled' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    
    return (
      <Badge className={`${config.color} hover:${config.color}`}>
        {config.label}
      </Badge>
    );
  };

  if (loading && payments.length === 0 && payouts.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading payment data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
        </TabsList>

        <TabsContent value="payments" className="space-y-6">
          {/* Filters and Search */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search by transaction ID, user, or group..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
          </div>

          {/* Payments Table */}
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Group</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      No payments found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-gray-400" />
                          <span className="font-mono text-sm">{payment.transaction_id || `PAY-${payment.id}`}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{payment.user_name}</p>
                          <p className="text-sm text-gray-500">{payment.user_email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{payment.group_name}</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">${payment.amount}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="capitalize">{payment.payment_method || 'N/A'}</span>
                      </TableCell>
                      <TableCell>{getStatusBadge(payment.status)}</TableCell>
                      <TableCell>
                        {new Date(payment.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => fetchPaymentDetails(payment.id)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            
                            {payment.status === 'completed' && (
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => {
                                  setSelectedPayment(payment);
                                  setShowRefundDialog(true);
                                }}
                              >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Process Refund
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="payouts" className="space-y-6">
          {/* Payouts Table */}
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Group</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Round</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payouts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      No payouts found
                    </TableCell>
                  </TableRow>
                ) : (
                  payouts.map((payout) => (
                    <TableRow key={payout.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-gray-400" />
                          <span className="font-mono text-sm">{payout.transaction_id || `OUT-${payout.id}`}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{payout.user_name}</p>
                          <p className="text-sm text-gray-500">{payout.user_email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{payout.group_name}</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">${payout.amount}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span>Round {payout.round_number || 'N/A'}</span>
                      </TableCell>
                      <TableCell>{getStatusBadge(payout.status)}</TableCell>
                      <TableCell>
                        {new Date(payout.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => fetchPayoutDetails(payout)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4">
          <Button
            variant="outline"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Refund Payment Dialog */}
      <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Refund</DialogTitle>
            <DialogDescription>
              Process refund for payment of ${selectedPayment?.amount} by {selectedPayment?.user_name}. This action requires password confirmation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="refund-reason">Reason for Refund</Label>
              <Textarea
                id="refund-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Provide a detailed reason for processing this refund..."
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="refund-password">Confirm Your Password</Label>
              <Input
                id="refund-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password to confirm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRefundDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => handleRefundPayment(selectedPayment?.id)}
              disabled={!reason || reason.length < 10 || actionLoading}
            >
              {actionLoading ? 'Processing...' : 'Process Refund'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payout Details Dialog */}
      <Dialog open={showPayoutDetailsDialog} onOpenChange={setShowPayoutDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payout Details</DialogTitle>
            <DialogDescription>
              Detailed information about payout transaction
            </DialogDescription>
          </DialogHeader>
          {selectedPayout && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Payout ID</Label>
                  <p className="font-mono text-sm">{selectedPayout.transaction_id || `OUT-${selectedPayout.id}`}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedPayout.status)}</div>
                </div>
                <div>
                  <Label>Recipient</Label>
                  <p>{selectedPayout.user_name}</p>
                  <p className="text-sm text-gray-500">{selectedPayout.user_email}</p>
                </div>
                <div>
                  <Label>Group</Label>
                  <p>{selectedPayout.group_name}</p>
                </div>
                <div>
                  <Label>Amount</Label>
                  <p className="font-medium">${selectedPayout.amount}</p>
                </div>
                <div>
                  <Label>Round</Label>
                  <p>{selectedPayout.round_number ? `Round ${selectedPayout.round_number}` : 'N/A'}</p>
                </div>
                <div>
                  <Label>Scheduled Date</Label>
                  <p className="text-sm">
                    {selectedPayout.scheduled_date ? new Date(selectedPayout.scheduled_date).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div>
                  <Label>Created</Label>
                  <p className="text-sm">{new Date(selectedPayout.created_at).toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowPayoutDetailsDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
            <DialogDescription>
              Detailed information about payment transaction
            </DialogDescription>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Transaction ID</Label>
                  <p className="font-mono text-sm">{selectedPayment.transaction_id || `PAY-${selectedPayment.id}`}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedPayment.status)}</div>
                </div>
                <div>
                  <Label>User</Label>
                  <p>{selectedPayment.user_name}</p>
                  <p className="text-sm text-gray-500">{selectedPayment.user_email}</p>
                </div>
                <div>
                  <Label>Group</Label>
                  <p>{selectedPayment.group_name}</p>
                </div>
                <div>
                  <Label>Amount</Label>
                  <p className="font-medium">${selectedPayment.amount}</p>
                </div>
                <div>
                  <Label>Payment Method</Label>
                  <p className="capitalize">{selectedPayment.payment_method || 'N/A'}</p>
                </div>
                <div>
                  <Label>Created</Label>
                  <p className="text-sm">{new Date(selectedPayment.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <Label>Last Updated</Label>
                  <p className="text-sm">{new Date(selectedPayment.updated_at).toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowDetailsDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaymentManagement;
