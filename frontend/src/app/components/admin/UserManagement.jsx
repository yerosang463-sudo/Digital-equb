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
  Ban, 
  Edit, 
  Shield,
  ShieldOff,
  AlertTriangle,
  UserX,
  UserCheck,
  Mail,
  Trash2
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '../ui/dropdown-menu';
import { Badge } from '../ui/badge';
import { apiRequest } from '../../lib/api';
import { useAuth } from '../../providers/AuthProvider';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Label } from '../ui/label';

const UserManagement = () => {
  const { user: currentUser, token } = useAuth();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAssignAdminDialog, setShowAssignAdminDialog] = useState(false);
  const [showRevokeAdminDialog, setShowRevokeAdminDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showHardDeleteDialog, setShowHardDeleteDialog] = useState(false);
  const [password, setPassword] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [page]);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, statusFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await apiRequest(`/api/admin/users?page=${page}&limit=10`, {
        token: token || undefined
      });
      
      if (response.success) {
        setUsers(response.data.users);
        setTotalPages(response.data.pagination.pages);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(user => 
        user.full_name?.toLowerCase().includes(term) ||
        user.email?.toLowerCase().includes(term) ||
        user.phone?.includes(term)
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => 
        statusFilter === 'active' ? user.is_active === 1 : user.is_active === 0
      );
    }
    
    setFilteredUsers(filtered);
  };

  const handleBanUser = async (userId) => {
    try {
      setActionLoading(true);
      
      const response = await apiRequest(`/api/admin/users/${userId}/ban`, {
        method: 'POST',
        body: { password },
        token: token || undefined
      });
      
      if (response.success) {
        // Update user status in local state
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user.id === userId ? { ...user, is_active: 0 } : user
          )
        );
        setShowBanDialog(false);
        setPassword('');
        setSelectedUser(null);
      }
    } catch (err) {
      console.error('Failed to ban user:', err);
      setError(err.message || 'Failed to ban user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnbanUser = async (userId) => {
    try {
      setActionLoading(true);
      
      const response = await apiRequest(`/api/admin/users/${userId}/unban`, {
        method: 'POST',
        token: token || undefined
      });
      
      if (response.success) {
        // Update user status in local state
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user.id === userId ? { ...user, is_active: 1 } : user
          )
        );
      }
    } catch (err) {
      console.error('Failed to unban user:', err);
      setError(err.message || 'Failed to unban user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignAdminRole = async (userId) => {
    try {
      setActionLoading(true);
      
      const response = await apiRequest(`/api/admin/users/${userId}/roles`, {
        method: 'POST',
        body: { password },
        token: token || undefined
      });
      
      if (response.success) {
        // Update user roles in local state
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user.id === userId ? { ...user, roles: [...(user.roles || []), 'admin'] } : user
          )
        );
        setShowAssignAdminDialog(false);
        setPassword('');
        setSelectedUser(null);
      }
    } catch (err) {
      console.error('Failed to assign admin role:', err);
      setError(err.message || 'Failed to assign admin role');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      setActionLoading(true);

      const response = await apiRequest(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        body: { password },
        token: token || undefined
      });

      if (response.success) {
        setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
        setShowDeleteDialog(false);
        setPassword('');
        setSelectedUser(null);
      }
    } catch (err) {
      console.error('Failed to delete user:', err);
      setError(err.message || 'Failed to delete user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleHardDeleteUser = async (userId) => {
    try {
      setActionLoading(true);

      const response = await apiRequest(`/api/admin/users/${userId}/hard`, {
        method: 'DELETE',
        body: { password },
        token: token || undefined
      });

      if (response.success) {
        setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
        setShowHardDeleteDialog(false);
        setPassword('');
        setSelectedUser(null);
      }
    } catch (err) {
      console.error('Failed to hard delete user:', err);
      setError(err.message || 'Failed to hard delete user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevokeAdminRole = async (userId) => {
    try {
      setActionLoading(true);

      const response = await apiRequest(`/api/admin/users/${userId}/revoke-admin`, {
        method: 'POST',
        body: { password },
        token: token || undefined
      });

      if (response.success) {
        setUsers(prevUsers =>
          prevUsers.map(user =>
            user.id === userId
              ? { ...user, roles: (user.roles || []).filter((role) => role !== 'admin') }
              : user
          )
        );
        setShowRevokeAdminDialog(false);
        setPassword('');
        setSelectedUser(null);
      }
    } catch (err) {
      console.error('Failed to revoke admin role:', err);
      setError(err.message || 'Failed to revoke admin role');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateUser = async (userId, updates) => {
    try {
      setActionLoading(true);
      
      const response = await apiRequest(`/api/admin/users/${userId}`, {
        method: 'PUT',
        body: updates,
        token: token || undefined
      });
      
      if (response.success) {
        // Update user in local state
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user.id === userId ? { ...user, ...updates } : user
          )
        );
        setShowEditDialog(false);
        setSelectedUser(null);
      }
    } catch (err) {
      console.error('Failed to update user:', err);
      setError(err.message || 'Failed to update user');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (isActive) => {
    return isActive === 1 ? (
      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
        <UserCheck className="h-3 w-3 mr-1" />
        Active
      </Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
        <Ban className="h-3 w-3 mr-1" />
        Banned
      </Badge>
    );
  };

  const getRoleBadge = (roles) => {
    const isAdmin = roles?.includes('admin');
    return isAdmin ? (
      <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">
        <Shield className="h-3 w-3 mr-1" />
        Admin
      </Badge>
    ) : (
      <Badge variant="outline">User</Badge>
    );
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading users...</p>
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
            placeholder="Search users by name, email, or phone..."
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
            <option value="active">Active Only</option>
            <option value="inactive">Banned Only</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Groups</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="font-medium text-blue-800">
                          {user.full_name?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{user.full_name || 'Unknown User'}</p>
                        <p className="text-sm text-gray-500">ID: {user.id}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      {user.email}
                    </div>
                  </TableCell>
                  <TableCell>{user.phone || 'N/A'}</TableCell>
                  <TableCell>{getStatusBadge(user.is_active)}</TableCell>
                  <TableCell>{getRoleBadge(user.roles)}</TableCell>
                  <TableCell>
                    {user.groups && user.groups.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {user.groups.map((group) => (
                          <Badge 
                            key={group.id} 
                            variant="outline" 
                            className="text-xs bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                          >
                            {group.name}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">No groups</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(user.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(user);
                          setShowEditDialog(true);
                        }}
                        className="hover:bg-blue-50 hover:border-blue-200"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(user);
                          setPassword('');
                          setShowDeleteDialog(true);
                        }}
                        className="hover:bg-red-50 hover:border-red-200 text-red-600"
                      >
                        <UserX className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="hover:bg-gray-100 p-2">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                          setSelectedUser(user);
                          setShowEditDialog(true);
                        }}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit User
                        </DropdownMenuItem>
                        
                        <DropdownMenuSeparator />
                        
                        {user.is_active === 1 ? (
                          <DropdownMenuItem 
                            className="text-orange-600 hover:bg-orange-50 focus:bg-orange-50"
                            onClick={() => {
                              setSelectedUser(user);
                              setShowBanDialog(true);
                            }}>
                            <Ban className="h-4 w-4 mr-2" />
                            Ban User
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem 
                            className="text-green-600 hover:bg-green-50 focus:bg-green-50"
                            onClick={() => handleUnbanUser(user.id)}>
                            <UserCheck className="h-4 w-4 mr-2" />
                            Unban User
                          </DropdownMenuItem>
                        )}
                        
                        <DropdownMenuSeparator />
                        
                        {!user.roles?.includes('admin') && (
                          <DropdownMenuItem 
                            className="text-purple-600 hover:bg-purple-50 focus:bg-purple-50"
                            onClick={() => {
                              setSelectedUser(user);
                              setPassword('');
                              setShowAssignAdminDialog(true);
                            }}>
                            <Shield className="h-4 w-4 mr-2" />
                            Assign Admin Role
                          </DropdownMenuItem>
                        )}

                        {user.roles?.includes('admin') && Number(user.id) !== Number(currentUser?.id) && (
                          <DropdownMenuItem 
                            className="text-orange-600 hover:bg-orange-50 focus:bg-orange-50"
                            onClick={() => {
                              setSelectedUser(user);
                              setPassword('');
                              setShowRevokeAdminDialog(true);
                            }}>
                            <ShieldOff className="h-4 w-4 mr-2" />
                            Revoke Admin Role
                          </DropdownMenuItem>
                        )}
                        
                        <DropdownMenuSeparator />
                        
                          <DropdownMenuItem 
                            className="text-red-600 hover:bg-red-50 focus:bg-red-50"
                            onClick={() => {
                              setSelectedUser(user);
                              setPassword('');
                              setShowDeleteDialog(true);
                            }}>
                            <UserX className="h-4 w-4 mr-2" />
                            Soft Delete (Deactivate)
                          </DropdownMenuItem>

                          <DropdownMenuItem 
                            className="text-red-600 hover:bg-red-50 focus:bg-red-50"
                            onClick={() => {
                              setSelectedUser(user);
                              setPassword('');
                              setShowHardDeleteDialog(true);
                            }}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Permanently Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    </div>
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

      {/* Ban User Dialog */}
      <Dialog open={showBanDialog} onOpenChange={setShowBanDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ban User</DialogTitle>
            <DialogDescription>
              Are you sure you want to ban {selectedUser?.full_name}? This action requires password confirmation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="password">Confirm Your Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password to confirm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBanDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => handleBanUser(selectedUser?.id)}
              disabled={actionLoading}
            >
              {actionLoading ? 'Processing...' : 'Ban User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Permanently deactivate and anonymize {selectedUser?.full_name}. This cannot be undone and requires password confirmation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="delete-password">Confirm Your Password</Label>
              <Input
                id="delete-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password to confirm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleDeleteUser(selectedUser?.id)}
              disabled={actionLoading}
            >
              {actionLoading ? 'Processing...' : 'Delete User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hard Delete User Dialog */}
      <Dialog open={showHardDeleteDialog} onOpenChange={setShowHardDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Permanently Delete User
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to PERMANENTLY delete {selectedUser?.full_name}? This will remove their record and all role mappings from the database. This action is irreversible.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="hard-delete-password">Confirm Your Password</Label>
              <Input
                id="hard-delete-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password to confirm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowHardDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleHardDeleteUser(selectedUser?.id)}
              disabled={!password || actionLoading}
            >
              {actionLoading ? 'Deleting...' : 'Permanently Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke Admin Role Dialog */}
      <Dialog open={showRevokeAdminDialog} onOpenChange={setShowRevokeAdminDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke Admin Role</DialogTitle>
            <DialogDescription>
              Remove administrator role from {selectedUser?.full_name}. This action requires password confirmation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="revoke-admin-password">Confirm Your Password</Label>
              <Input
                id="revoke-admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password to confirm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRevokeAdminDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleRevokeAdminRole(selectedUser?.id)}
              disabled={actionLoading}
            >
              {actionLoading ? 'Processing...' : 'Revoke Admin Role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Admin Role Dialog */}
      <Dialog open={showAssignAdminDialog} onOpenChange={setShowAssignAdminDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Admin Role</DialogTitle>
            <DialogDescription>
              Assign administrator role to {selectedUser?.full_name}. This action requires password confirmation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="admin-password">Confirm Your Password</Label>
              <Input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password to confirm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignAdminDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => handleAssignAdminRole(selectedUser?.id)}
              disabled={actionLoading}
            >
              {actionLoading ? 'Processing...' : 'Assign Admin Role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information for {selectedUser?.full_name}.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  defaultValue={selectedUser.full_name}
                  onChange={(e) => setSelectedUser({...selectedUser, full_name: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  defaultValue={selectedUser.email}
                  onChange={(e) => setSelectedUser({...selectedUser, email: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  defaultValue={selectedUser.phone || ''}
                  onChange={(e) => setSelectedUser({...selectedUser, phone: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="bio">Bio</Label>
                <Input
                  id="bio"
                  defaultValue={selectedUser.bio || ''}
                  onChange={(e) => setSelectedUser({...selectedUser, bio: e.target.value})}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  defaultChecked={selectedUser.is_active === 1}
                  onChange={(e) => setSelectedUser({...selectedUser, is_active: e.target.checked ? 1 : 0})}
                />
                <Label htmlFor="is_active">Active Account</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => handleUpdateUser(selectedUser?.id, {
                full_name: selectedUser?.full_name,
                email: selectedUser?.email,
                phone: selectedUser?.phone,
                bio: selectedUser?.bio,
                is_active: selectedUser?.is_active
              })}
              disabled={actionLoading}
            >
              {actionLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;
