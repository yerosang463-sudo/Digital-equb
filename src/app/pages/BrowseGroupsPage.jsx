import { useState } from "react";
import { Plus, Search, Filter } from "lucide-react";
import { GroupCard } from "../components/GroupCard";
import { mockGroups } from "../data/mockData";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";

export function BrowseGroupsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newGroup, setNewGroup] = useState({
    name: "",
    contributionAmount: "",
    maxMembers: "",
    frequency: "monthly"
  });

  const filteredGroups = mockGroups.filter((group) => {
    const matchesSearch = group.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === "all" || group.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleCreateGroup = () => {
    // Mock create - in production, this would save to backend
    console.log("Creating group:", newGroup);
    setIsCreateModalOpen(false);
    setNewGroup({ name: "", contributionAmount: "", maxMembers: "", frequency: "monthly" });
  };

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
                Set up your own Equb group. You'll be the admin and can manage members.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="groupName">Group Name</Label>
                <Input
                  id="groupName"
                  placeholder="Family Savings Circle"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })} />
                
              </div>
              <div className="space-y-2">
                <Label htmlFor="contribution">Monthly Contribution (Birr)</Label>
                <Input
                  id="contribution"
                  type="number"
                  placeholder="500"
                  value={newGroup.contributionAmount}
                  onChange={(e) => setNewGroup({ ...newGroup, contributionAmount: e.target.value })} />
                
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxMembers">Maximum Members</Label>
                <Input
                  id="maxMembers"
                  type="number"
                  placeholder="10"
                  value={newGroup.maxMembers}
                  onChange={(e) => setNewGroup({ ...newGroup, maxMembers: e.target.value })} />
                
              </div>
              <div className="space-y-2">
                <Label htmlFor="frequency">Payment Frequency</Label>
                <Select value={newGroup.frequency} onValueChange={(value) => setNewGroup({ ...newGroup, frequency: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-gray-700">
                  ℹ️ As the group creator, you'll become the admin and can manage settings, select winners, and send reminders.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button className="bg-[#1E3A8A] hover:bg-[#1E3A8A]/90" onClick={handleCreateGroup}>
                Create Group
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Search groups..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)} />
          
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Groups</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="full">Full</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGroups.map((group) => {
          const progress = group.currentRound / group.totalRounds * 100;
          return (
            <GroupCard
              key={group.id}
              id={group.id}
              name={group.name}
              members={group.members.length}
              maxMembers={group.maxMembers}
              contributionAmount={group.contributionAmount}
              progress={progress}
              admin={group.admin}
              status={group.status} />);


        })}
      </div>

      {filteredGroups.length === 0 &&
      <div className="text-center py-12">
          <p className="text-gray-500">No groups found matching your criteria.</p>
        </div>
      }
    </div>);

}