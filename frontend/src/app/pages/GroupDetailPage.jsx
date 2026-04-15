import { useParams } from "react-router";
import { mockGroups, currentUser } from "../data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { Crown, Users, DollarSign, Calendar, Award, Bell, Settings, UserMinus, FileText, CheckCircle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";

export function GroupDetailPage() {
  const { groupId } = useParams();
  const group = mockGroups.find((g) => g.id === groupId);

  if (!group) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Group not found</p>
      </div>);

  }

  const isAdmin = group.admin === currentUser.name;
  const progress = group.currentRound / group.totalRounds * 100;
  const paidMembers = group.members.filter((m) => m.hasPaid).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] text-white rounded-lg p-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{group.name}</h1>
            <p className="text-blue-100 flex items-center gap-2">
              <Crown className="w-4 h-4" />
              Admin: {group.admin}
              {isAdmin && <Badge className="ml-2 bg-yellow-500 text-gray-900">You are admin</Badge>}
            </p>
          </div>
          <div className="text-right">
            <p className="text-blue-100 text-sm">Round Progress</p>
            <p className="text-2xl font-bold">
              {group.currentRound} / {group.totalRounds}
            </p>
          </div>
        </div>
        <div className="mt-6">
          <Progress value={progress} className="h-3 bg-blue-900" />
          <div className="flex justify-between text-sm mt-2 text-blue-100">
            <span>{progress.toFixed(0)}% Complete</span>
            <span>{group.totalRounds - group.currentRound} rounds remaining</span>
          </div>
        </div>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Members</p>
                <p className="text-2xl font-bold">
                  {group.members.length}/{group.maxMembers}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 text-green-600 rounded-lg">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Monthly Pool</p>
                <p className="text-2xl font-bold">{group.contributionAmount * group.members.length} Birr</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Next Payment</p>
                <p className="text-lg font-bold">May 1, 2026</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-100 text-yellow-600 rounded-lg">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Paid This Round</p>
                <p className="text-2xl font-bold">
                  {paidMembers}/{group.members.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Winner */}
      {group.currentWinner &&
      <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-yellow-400 rounded-full">
                <Award className="w-8 h-8 text-gray-900" />
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Current Round Winner</p>
                <p className="text-2xl font-bold text-gray-900">{group.currentWinner}</p>
                <p className="text-sm text-gray-600 mt-1">
                  Receiving {group.contributionAmount * group.members.length} Birr this round
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      }

      <div className="grid md:grid-cols-3 gap-8">
        {/* Members Section */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Members ({group.members.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {group.members.map((member) =>
                  <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback className="bg-[#1E3A8A] text-white">
                              {member.name.split(" ").map((n) => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{member.name}</p>
                            {member.isAdmin && <span className="text-xs text-gray-500">👑 Admin</span>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600">{member.phone}</TableCell>
                      <TableCell className="text-gray-600">{member.joinedAt}</TableCell>
                      <TableCell className="text-right">
                        {member.hasPaid ?
                      <Badge className="bg-green-100 text-green-800">Paid</Badge> :

                      <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                      }
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Admin Controls */}
        <div>
          {isAdmin ?
          <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-yellow-600" />
                  Admin Controls
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start bg-[#1E3A8A] hover:bg-[#1E3A8A]/90">
                  <Award className="w-4 h-4 mr-2" />
                  Select Winner
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Bell className="w-4 h-4 mr-2" />
                  Send Reminder
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="w-4 h-4 mr-2" />
                  Edit Group Settings
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <UserMinus className="w-4 h-4 mr-2" />
                  Remove Member
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="w-4 h-4 mr-2" />
                  View Reports
                </Button>
                <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Close Round
                </Button>
              </CardContent>
            </Card> :

          <Card>
              <CardHeader>
                <CardTitle>Group Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Contribution Amount</p>
                  <p className="text-lg font-semibold">{group.contributionAmount} Birr</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Frequency</p>
                  <p className="text-lg font-semibold capitalize">{group.frequency}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Created</p>
                  <p className="text-lg font-semibold">{group.createdAt}</p>
                </div>
                <Button className="w-full bg-[#1E3A8A] hover:bg-[#1E3A8A]/90">
                  Make Payment
                </Button>
              </CardContent>
            </Card>
          }
        </div>
      </div>
    </div>);

}