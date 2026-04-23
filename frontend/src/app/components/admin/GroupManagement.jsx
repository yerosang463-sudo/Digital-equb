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
  Users,
  DollarSign,
  Calendar,
  AlertTriangle,
  Eye,
  Edit,
  XCircle,
  Trash2,
  UserPlus,
  UserMinus,
  UserCheck
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

const GroupManagement = () => {
  const [groups, setGroups] = useState([]);
  const [filteredGroups, setFilteredGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showForceCloseDialog, setShowForceCloseDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showMembersDialog, setShowMembersDialog] = useState(false);
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);
  const [showRemoveMemberDialog, setShowRemoveMemberDialog] = useState(false);
  const [password, setPassword] = useState('');
  const [reason, setReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [groupMembers, setGroupMembers] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedUserToAdd, setSelectedUserToAdd] = useState(null);
  const [memberSearch, setMemberSearch] = useState('');

  useEffect(() => {
    fetchGroups();
  }, [page]);

  useEffect(() => {
    filterGroups();
  }, [groups, searchTerm, statusFilter]);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await apiRequest(`/api/admin/groups?page=${page}&limit=10`);
      
      if (response.success) {
        setGroups(response.data.groups);
        setTotalPages(response.data.pagination.pages);
      }
    } catch (err) {
      console.error('Failed to fetch groups:', err);
      setError('Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  const filterGroups = () => {
    let filtered = [...groups];
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(group => 
        group.name?.toLowerCase().includes(term) ||
        group.description?.toLowerCase().includes(term) ||
        group.creator_name?.toLowerCase().includes(term)
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(group => group.status === statusFilter);
    }
    
    setFilteredGroups(filtered);
  };

  const handleForceCloseGroup = async (groupId) => {
    try {
      setActionLoading(true);
      
      const response = await apiRequest(`/api/admin/groups/${groupId}/force-close`, {
        method: 'POST',
        body: { password, reason }
      });
      
      if (response.success) {
        // Update group status in local state
        setGroups(prevGroups => 
          prevGroups.map(group => 
            group.id === groupId ? { ...group, status: 'cancelled' } : group
          )
        );
        setShowForceCloseDialog(false);
        setPassword('');
        setReason('');
        setSelectedGroup(null);
      }
    } catch (err) {
      console.error('Failed to force close group:', err);
      setError(err.message || 'Failed to force close group');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateGroup = async (groupId, updates) => {
    try {
      setActionLoading(true);
      
      const response = await apiRequest(`/api/admin/groups/${groupId}`, {
        method: 'PUT',
        body: updates
      });
      
      if (response.success) {
        // Update group in local state
        setGroups(prevGroups => 
          prevGroups.map(group => 
            group.id === groupId ? { ...group, ...updates } : group
          )
        );
        setShowEditDialog(false);
        setSelectedGroup(null);
      }
    } catch (err) {
      console.error('Failed to update group:', err);
      setError(err.message || 'Failed to update group');
    } finally {
      setActionLoading(false);
    }
  };

  const fetchGroupDetails = async (groupId) => {
    try {
      setActionLoading(true);
      
      const response = await apiRequest(`/api/admin/groups/${groupId}`);
      
      if (response.success) {
        setSelectedGroup(response.data.group);
        setShowDetailsDialog(true);
      }
    } catch (err) {
      console.error('Failed to fetch group details:', err);
      setError(err.message || 'Failed to fetch group details');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteGroup = async (groupId) => {
    try {
      setActionLoading(true);

      const response = await apiRequest(`/api/admin/groups/${groupId}`, {
        method: 'DELETE',
        body: { password }
      });

      if (response.success) {
        setGroups(prevGroups => prevGroups.filter(group => group.id !== groupId));
        setShowDeleteDialog(false);
        setPassword('');
        setSelectedGroup(null);
      }
    } catch (err) {
      console.error('Failed to delete group:', err);
      setError(err.message || 'Failed to delete group');
    } finally {
      setActionLoading(false);
    }
  };

  const fetchGroupMembers = async (groupId) => {
    try {
      setActionLoading(true);
      
      const response = await apiRequest(`/api/admin/groups/${groupId}`);
      
      if (response.success) {
        setGroupMembers(response.data.members || []);
        setSelectedGroup(response.data.group);
        setShowMembersDialog(true);
      }
    } catch (err) {
      console.error('Failed to fetch group members:', err);
      setError(err.message || 'Failed to fetch group members');
    } finally {
      setActionLoading(false);
    }
  };

  const fetchAvailableUsers = async () => {
    try {
      setActionLoading(true);
      
      const response = await apiRequest('/api/admin/users?limit=100');
      
      if (response.success) {
        // Filter out users who are already members of the selected group
        const currentMemberIds = groupMembers.map(member => member.id);
        const available = response.data.users.filter(user => 
          !currentMemberIds.includes(user.id) && user.is_active
        );
        setAvailableUsers(available);
      }
    } catch (err) {
      console.error('Failed to fetch available users:', err);
      setError(err.message || 'Failed to fetch available users');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddMember = async () => {
    if (!selectedUserToAdd || !selectedGroup) return;

    try {
      setActionLoading(true);
      
      const response = await apiRequest(`/api/admin/groups/${selectedGroup.id}/members`, {
        method: 'POST',
        body: { 
          user_id: selectedUserToAdd.id,
          password 
        }
      });
      
      if (response.success) {
        // Refresh group members
        await fetchGroupMembers(selectedGroup.id);
        setShowAddMemberDialog(false);
        setPassword('');
        setSelectedUserToAdd(null);
        setAvailableUsers([]);
      }
    } catch (err) {
      console.error('Failed to add member:', err);
      setError(err.message || 'Failed to add member');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!selectedMember || !selectedGroup) return;

    try {
      setActionLoading(true);
      
      const response = await apiRequest(`/api/admin/groups/${selectedGroup.id}/members/${selectedMember.id}`, {
        method: 'DELETE',
        body: { password }
      });
      
      if (response.success) {
        // Refresh group members
        await fetchGroupMembers(selectedGroup.id);
        setShowRemoveMemberDialog(false);
        setPassword('');
        setSelectedMember(null);
      }
    } catch (err) {
      console.error('Failed to remove member:', err);
      setError(err.message || 'Failed to remove member');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      open: { color: 'bg-blue-100 text-blue-800', label: 'Open' },
      active: { color: 'bg-yellow-100 text-yellow-800', label: 'Active' },
      completed: { color: 'bg-green-100 text-green-800', label: 'Completed' },
      cancelled: { color: 'bg-red-100 text-red-800', label: 'Cancelled' }
    };
    
    const config = statusConfig[status] || statusConfig.open;
    
    return (
      <Badge className={`${config.color} hover:${config.color}`}>
        {config.label}
      </Badge>
    );
  };

  const getVisibilityBadge = (isPublic) => {
    return isPublic ? (
      <Badge variant="outline">Public</Badge>
    ) : (
      <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Private</Badge>
    );
  };

  if (loading && groups.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading groups...</p>
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
            placeholder="Search groups by name, description, or creator..."
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
            <option value="open">Open</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Groups Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Group</TableHead>
              <TableHead>Creator</TableHead>
              <TableHead>Members</TableHead>
              <TableHead>Contribution</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Visibility</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredGroups.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  No groups found
                </TableCell>
              </TableRow>
            ) : (
              filteredGroups.map((group) => (
                <TableRow key={group.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{group.name}</p>
                      <p className="text-sm text-gray-500 truncate max-w-xs">
                        {group.description || 'No description'}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{group.creator_name}</p>
                      <p className="text-sm text-gray-500">{group.creator_email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span>{group.current_members}/{group.max_members}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      <span>${group.contribution_amount}</span>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(group.status)}</TableCell>
                  <TableCell>{getVisibilityBadge(group.is_public)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {new Date(group.created_at).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedGroup(group);
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
                          setSelectedGroup(group);
                          setPassword('');
                          setShowDeleteDialog(true);
                        }}
                        className="hover:bg-red-50 hover:border-red-200 text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="hover:bg-gray-100 p-2">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => fetchGroupDetails(group.id)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem onClick={() => fetchGroupMembers(group.id)}>
                          <Users className="h-4 w-4 mr-2" />
                          Manage Members
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem onClick={() => {
                          setSelectedGroup(group);
                          setShowEditDialog(true);
                        }}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Group
                        </DropdownMenuItem>
                        
                        <DropdownMenuSeparator />
                        
                        {group.status !== 'completed' && group.status !== 'cancelled' && (
                          <DropdownMenuItem 
                            className="text-red-600 hover:bg-red-50 focus:bg-red-50"
                            onClick={() => {
                              setSelectedGroup(group);
                              setPassword('');
                              setReason('');
                              setShowForceCloseDialog(true);
                            }}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Force Close
                          </DropdownMenuItem>
                        )}

                        <DropdownMenuItem
                          className="text-red-600 hover:bg-red-50 focus:bg-red-50"
                          onClick={() => {
                            setSelectedGroup(group);
                            setPassword('');
                            setShowDeleteDialog(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Group
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

      {/* Force Close Group Dialog */}
      <Dialog open={showForceCloseDialog} onOpenChange={setShowForceCloseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Force Close Group</DialogTitle>
            <DialogDescription>
              Are you sure you want to force close "{selectedGroup?.name}"? This action cannot be undone and requires password confirmation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reason">Reason for Force Closure</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Provide a detailed reason for force closing this group..."
                rows={3}
              />
            </div>
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
            <Button variant="outline" onClick={() => setShowForceCloseDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => handleForceCloseGroup(selectedGroup?.id)}
              disabled={!reason || reason.length < 10 || actionLoading}
            >
              {actionLoading ? 'Processing...' : 'Force Close Group'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Group Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Group</DialogTitle>
            <DialogDescription>
              Permanently delete "{selectedGroup?.name}" and all related records. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="delete-group-password">Confirm Your Password</Label>
              <Input
                id="delete-group-password"
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
              onClick={() => handleDeleteGroup(selectedGroup?.id)}
              disabled={actionLoading}
            >
              {actionLoading ? 'Processing...' : 'Delete Group'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Group Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Group</DialogTitle>
            <DialogDescription>
              Update group information for "{selectedGroup?.name}".
            </DialogDescription>
          </DialogHeader>
          {selectedGroup && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Group Name</Label>
                <Input
                  id="name"
                  defaultValue={selectedGroup.name}
                  onChange={(e) => setSelectedGroup({...selectedGroup, name: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  defaultValue={selectedGroup.description || ''}
                  onChange={(e) => setSelectedGroup({...selectedGroup, description: e.target.value})}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={selectedGroup.status}
                  onChange={(e) => setSelectedGroup({...selectedGroup, status: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="open">Open</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_public"
                  defaultChecked={selectedGroup.is_public === 1}
                  onChange={(e) => setSelectedGroup({...selectedGroup, is_public: e.target.checked ? 1 : 0})}
                />
                <Label htmlFor="is_public">Public Group</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => handleUpdateGroup(selectedGroup?.id, {
                name: selectedGroup?.name,
                description: selectedGroup?.description,
                status: selectedGroup?.status,
                is_public: selectedGroup?.is_public
              })}
              disabled={actionLoading}
            >
              {actionLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Group Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Group Details</DialogTitle>
            <DialogDescription>
              Detailed information about "{selectedGroup?.name}"
            </DialogDescription>
          </DialogHeader>
          {selectedGroup && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Group Name</Label>
                  <p className="font-medium">{selectedGroup.name}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedGroup.status)}</div>
                </div>
                <div>
                  <Label>Creator</Label>
                  <p>{selectedGroup.creator_name}</p>
                  <p className="text-sm text-gray-500">{selectedGroup.creator_email}</p>
                </div>
                <div>
                  <Label>Members</Label>
                  <p>{selectedGroup.current_members}/{selectedGroup.max_members}</p>
                </div>
                <div>
                  <Label>Contribution Amount</Label>
                  <p>${selectedGroup.contribution_amount}</p>
                </div>
                <div>
                  <Label>Frequency</Label>
                  <p className="capitalize">{selectedGroup.frequency}</p>
                </div>
                <div>
                  <Label>Total Rounds</Label>
                  <p>{selectedGroup.cycle_total_rounds || 'Not set'}</p>
                </div>
                <div>
                  <Label>Visibility</Label>
                  <div className="mt-1">{getVisibilityBadge(selectedGroup.is_public)}</div>
                </div>
              </div>
              
              {selectedGroup.description && (
                <div>
                  <Label>Description</Label>
                  <p className="text-sm text-gray-700 mt-1">{selectedGroup.description}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Created</Label>
                  <p className="text-sm">{new Date(selectedGroup.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <Label>Last Updated</Label>
                  <p className="text-sm">{new Date(selectedGroup.updated_at).toLocaleString()}</p>
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

      {/* Group Members Management Dialog */}
      <Dialog open={showMembersDialog} onOpenChange={setShowMembersDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Manage Group Members</DialogTitle>
            <DialogDescription>
              View and manage members of "{selectedGroup?.name}"
            </DialogDescription>
          </DialogHeader>
          {selectedGroup && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">
                    {groupMembers.length} / {selectedGroup.max_members} members
                  </p>
                </div>
                <Button
                  onClick={() => {
                    fetchAvailableUsers();
                    setShowAddMemberDialog(true);
                  }}
                  disabled={groupMembers.length >= selectedGroup.max_members}
                  size="sm"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Member
                </Button>
              </div>

              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupMembers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                          No members found
                        </TableCell>
                      </TableRow>
                    ) : (
                      groupMembers.map((member) => (
                        <TableRow key={member.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <UserCheck className="h-4 w-4 text-green-600" />
                              <span className="font-medium">{member.full_name}</span>
                            </div>
                          </TableCell>
                          <TableCell>{member.email}</TableCell>
                          <TableCell>{member.phone || 'N/A'}</TableCell>
                          <TableCell>
                            {new Date(member.joined_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Badge className={member.member_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                              {member.member_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center gap-2 justify-end">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedMember(member);
                                  setPassword('');
                                  setShowRemoveMemberDialog(true);
                                }}
                                className="hover:bg-red-50 hover:border-red-200 text-red-600"
                              >
                                <UserMinus className="h-4 w-4 mr-1" />
                                Remove
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowMembersDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Member Dialog */}
      <Dialog open={showAddMemberDialog} onOpenChange={setShowAddMemberDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Member to Group</DialogTitle>
            <DialogDescription>
              Select a user to add to "{selectedGroup?.name}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="user-select">Select User</Label>
              <select
                id="user-select"
                value={selectedUserToAdd?.id || ''}
                onChange={(e) => {
                  const user = availableUsers.find(u => u.id === parseInt(e.target.value));
                  setSelectedUserToAdd(user);
                }}
                className="w-full border rounded-lg px-3 py-2 mt-1"
              >
                <option value="">Choose a user...</option>
                {availableUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.full_name} ({user.email})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="add-member-password">Confirm Your Password</Label>
              <Input
                id="add-member-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password to confirm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddMemberDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddMember}
              disabled={!selectedUserToAdd || !password || actionLoading}
            >
              {actionLoading ? 'Adding...' : 'Add Member'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Member Dialog */}
      <Dialog open={showRemoveMemberDialog} onOpenChange={setShowRemoveMemberDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Member from Group</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove "{selectedMember?.full_name}" from "{selectedGroup?.name}"? This action requires password confirmation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="remove-member-password">Confirm Your Password</Label>
              <Input
                id="remove-member-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password to confirm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRemoveMemberDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemoveMember}
              disabled={!password || actionLoading}
            >
              {actionLoading ? 'Removing...' : 'Remove Member'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GroupManagement;
