import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Filter } from "lucide-react";
import { GroupCard } from "../components/GroupCard";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { apiRequest } from "../lib/api";

export function BrowseGroupsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [groups, setGroups] = useState([]);
  const [newGroup, setNewGroup] = useState({
    name: "",
    contributionAmount: "",
    maxMembers: "",
    frequency: "monthly",
  });

  useEffect(() => {
    let ignore = false;

    async function loadGroups() {
      try {
        const response = await apiRequest("/api/groups?limit=100");
        if (!ignore) {
          setGroups(response.groups || []);
        }
      } catch (error) {
        if (!ignore) {
          setGroups([]);
        }
      }
    }

    loadGroups();
    return () => {
      ignore = true;
    };
  }, []);

  const filteredGroups = useMemo(() => {
    return groups.filter((group) => {
      const displayStatus = group.display_status || group.status;
      const matchesSearch = group.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filterStatus === "all" || displayStatus === filterStatus;
      return matchesSearch && matchesFilter;
    });
  }, [groups, searchQuery, filterStatus]);

  async function handleCreateGroup() {
    if (!newGroup.name || !newGroup.contributionAmount || !newGroup.maxMembers) {
      window.alert("Please fill in all required group fields.");
      return;
    }

    setIsSaving(true);
    try {
      const response = await apiRequest("/api/groups", {
        method: "POST",
        body: {
          name: newGroup.name,
          contribution_amount: Number(newGroup.contributionAmount),
          max_members: Number(newGroup.maxMembers),
          frequency: newGroup.frequency,
          winner_selection_mode: "random",
          auto_select_winner: true,
        },
      });

      setGroups((current) => [response.group, ...current]);
      setIsCreateModalOpen(false);
      setNewGroup({ name: "", contributionAmount: "", maxMembers: "", frequency: "monthly" });
    } catch (error) {
      window.alert(error.message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Browse Groups</h1>
          <p className="text-gray-600 mt-1">Find and join savings circles that match your goals</p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#1E3A8A] hover:bg-[#1E3A8A]/90">
              <Plus className="w-4 h-4 mr-2" />
              Create Group
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Group</DialogTitle>
              <DialogDescription>
                Set up your own Equb group. You&apos;ll be the admin and can manage members.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="groupName">Group Name</Label>
                <Input
                  id="groupName"
                  placeholder="Family Savings Circle"
                  value={newGroup.name}
                  onChange={(event) => setNewGroup({ ...newGroup, name: event.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contribution">Contribution (Birr)</Label>
                <Input
                  id="contribution"
                  type="number"
                  placeholder="500"
                  value={newGroup.contributionAmount}
                  onChange={(event) => setNewGroup({ ...newGroup, contributionAmount: event.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxMembers">Maximum Members</Label>
                <Input
                  id="maxMembers"
                  type="number"
                  placeholder="10"
                  value={newGroup.maxMembers}
                  onChange={(event) => setNewGroup({ ...newGroup, maxMembers: event.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="frequency">Payment Frequency</Label>
                <Select
                  value={newGroup.frequency}
                  onValueChange={(value) => setNewGroup({ ...newGroup, frequency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="biweekly">Biweekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-gray-700">
                  As the group creator, you&apos;ll be the admin and the backend will automatically support random
                  winner selection and simulated Telebirr payments.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button className="bg-[#1E3A8A] hover:bg-[#1E3A8A]/90" onClick={handleCreateGroup} disabled={isSaving}>
                {isSaving ? "Creating..." : "Create Group"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Search groups..."
            className="pl-10"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Groups</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="full">Full</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGroups.map((group) => (
          <GroupCard
            key={group.id}
            id={group.id}
            name={group.name}
            members={group.member_count}
            maxMembers={group.max_members}
            contributionAmount={Number(group.contribution_amount)}
            progress={group.progress_percentage}
            admin={group.admin_name || group.creator_name}
            status={group.display_status}
            frequency={group.frequency}
            isMember={Boolean(group.is_member)}
          />
        ))}
      </div>

      {filteredGroups.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No groups found matching your criteria.</p>
        </div>
      ) : null}
    </div>
  );
}
