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
  Eye,
  Calendar,
  User,
  Activity,
  AlertCircle
} from 'lucide-react';
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

const AuditLogs = () => {
  const [auditLogs, setAuditLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedLog, setSelectedLog] = useState(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  useEffect(() => {
    fetchAuditLogs();
  }, [page]);

  useEffect(() => {
    filterLogs();
  }, [auditLogs, searchTerm, actionFilter]);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await apiRequest(`/api/admin/audit-logs?page=${page}&limit=20`);
      
      if (response.success) {
        setAuditLogs(response.data.logs || []);
        setTotalPages(response.data.pagination?.pages || 1);
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
      setError('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const filterLogs = () => {
    let filtered = [...auditLogs];
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(log => 
        log.action_type?.toLowerCase().includes(term) ||
        log.target_type?.toLowerCase().includes(term) ||
        log.admin_name?.toLowerCase().includes(term) ||
        log.details?.toLowerCase().includes(term)
      );
    }
    
    // Apply action filter
    if (actionFilter !== 'all') {
      filtered = filtered.filter(log => log.action_type === actionFilter);
    }
    
    setFilteredLogs(filtered);
  };

  const getActionBadge = (actionType) => {
    const actionConfig = {
      user_ban: { color: 'bg-red-100 text-red-800', label: 'User Ban' },
      user_unban: { color: 'bg-green-100 text-green-800', label: 'User Unban' },
      user_update: { color: 'bg-blue-100 text-blue-800', label: 'User Update' },
      user_delete: { color: 'bg-red-100 text-red-800', label: 'User Delete' },
      group_update: { color: 'bg-blue-100 text-blue-800', label: 'Group Update' },
      group_force_close: { color: 'bg-orange-100 text-orange-800', label: 'Group Force Close' },
      payment_refund: { color: 'bg-purple-100 text-purple-800', label: 'Payment Refund' },
      role_assign: { color: 'bg-green-100 text-green-800', label: 'Role Assign' },
      role_revoke: { color: 'bg-red-100 text-red-800', label: 'Role Revoke' }
    };
    
    const config = actionConfig[actionType] || { color: 'bg-gray-100 text-gray-800', label: actionType };
    
    return (
      <Badge className={`${config.color} hover:${config.color}`}>
        {config.label}
      </Badge>
    );
  };

  const getTargetTypeBadge = (targetType) => {
    const typeConfig = {
      user: { color: 'bg-blue-50 text-blue-700', icon: User },
      group: { color: 'bg-green-50 text-green-700', icon: Activity },
      payment: { color: 'bg-purple-50 text-purple-700', icon: Activity }
    };
    
    const config = typeConfig[targetType] || { color: 'bg-gray-50 text-gray-700', icon: Activity };
    const IconComponent = config.icon;
    
    return (
      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${config.color}`}>
        <IconComponent className="w-3 h-3" />
        <span className="capitalize">{targetType}</span>
      </div>
    );
  };

  if (loading && auditLogs.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading audit logs...</p>
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

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Search by action, target, admin, or details..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            <option value="all">All Actions</option>
            <option value="user_ban">User Ban</option>
            <option value="user_unban">User Unban</option>
            <option value="user_update">User Update</option>
            <option value="user_delete">User Delete</option>
            <option value="group_update">Group Update</option>
            <option value="group_force_close">Group Force Close</option>
            <option value="payment_refund">Payment Refund</option>
            <option value="role_assign">Role Assign</option>
            <option value="role_revoke">Role Revoke</option>
          </select>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Action</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Admin</TableHead>
              <TableHead>IP Address</TableHead>
              <TableHead>Timestamp</TableHead>
              <TableHead className="text-right">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  {auditLogs.length === 0 ? 'No audit logs found' : 'No logs match your search criteria'}
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    {getActionBadge(log.action_type)}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {getTargetTypeBadge(log.target_type)}
                      <p className="text-sm text-gray-500">ID: {log.target_id}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="font-medium">{log.admin_name || 'Unknown Admin'}</p>
                        <p className="text-sm text-gray-500">ID: {log.admin_user_id}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-sm">{log.ip_address || 'N/A'}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm">{new Date(log.created_at).toLocaleDateString()}</p>
                        <p className="text-xs text-gray-500">{new Date(log.created_at).toLocaleTimeString()}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        setSelectedLog(log);
                        setShowDetailsDialog(true);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

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

      {/* Audit Log Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
            <DialogDescription>
              Detailed information about admin action
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Action Type</Label>
                  <div className="mt-1">{getActionBadge(selectedLog.action_type)}</div>
                </div>
                <div>
                  <Label>Target</Label>
                  <div className="mt-1">{getTargetTypeBadge(selectedLog.target_type)}</div>
                </div>
                <div>
                  <Label>Target ID</Label>
                  <p className="font-mono">{selectedLog.target_id}</p>
                </div>
                <div>
                  <Label>Admin User</Label>
                  <p>{selectedLog.admin_name || 'Unknown Admin'}</p>
                  <p className="text-sm text-gray-500">ID: {selectedLog.admin_user_id}</p>
                </div>
                <div>
                  <Label>IP Address</Label>
                  <p className="font-mono">{selectedLog.ip_address || 'N/A'}</p>
                </div>
                <div>
                  <Label>Timestamp</Label>
                  <p>{new Date(selectedLog.created_at).toLocaleString()}</p>
                </div>
              </div>
              
              {selectedLog.details && (
                <div>
                  <Label>Details</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                      {typeof selectedLog.details === 'string' 
                        ? selectedLog.details 
                        : JSON.stringify(selectedLog.details, null, 2)
                      }
                    </pre>
                  </div>
                </div>
              )}
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

export default AuditLogs;