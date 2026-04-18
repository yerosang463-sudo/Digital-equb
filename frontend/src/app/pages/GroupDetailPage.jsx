import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  Crown,
  Users,
  DollarSign,
  Calendar,
  Award,
  Bell,
  Settings,
  UserMinus,
  FileText,
  CheckCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { apiRequest } from "../lib/api";

function initials(name) {
  return (name || "User")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatDate(dateValue) {
  if (!dateValue) {
    return "Not scheduled";
  }

  return new Date(dateValue).toLocaleDateString();
}

export function GroupDetailPage() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState(null);
  const [busyAction, setBusyAction] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadGroup() {
      try {
        const response = await apiRequest(`/api/groups/${groupId}`);
        if (!ignore) {
          setDetails(response);
        }
      } catch (error) {
        if (!ignore) {
          setDetails(null);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadGroup();
    return () => {
      ignore = true;
    };
  }, [groupId]);

  async function refreshGroup() {
    const response = await apiRequest(`/api/groups/${groupId}`);
    setDetails(response);
  }

  async function runAction(actionKey, callback) {
    setBusyAction(actionKey);
    try {
      await callback();
      await refreshGroup();
    } catch (error) {
      window.alert(error.message);
    } finally {
      setBusyAction("");
    }
  }

  if (loading) {
    return <div className="text-gray-600">Loading group details...</div>;
  }

  if (!details?.group) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Group not found</p>
      </div>
    );
  }

  const { group, members = [], report = {} } = details;
  const isAdmin = group.my_role === "admin";
  const isMember = Boolean(group.my_role);
  const paidMembers = members.filter((member) => member.has_paid_current_round).length;
  const allMembersPaid = members.length > 0 && paidMembers === members.length;
  const latestWinnerName = group.latest_winner_name || group.current_winner_name;
  const latestWinnerRound = group.latest_winner_round_number;

  async function handleJoinGroup() {
    await runAction("join", async () => {
      await apiRequest(`/api/groups/${groupId}/join`, { method: "POST" });
    });
  }

  async function handleSelectWinner() {
    await runAction("selectWinner", async () => {
      await apiRequest(`/api/groups/${groupId}/winner/select`, { method: "POST", body: {} });
    });
  }

  async function handleSendReminder() {
    await runAction("sendReminder", async () => {
      const response = await apiRequest(`/api/groups/${groupId}/reminders`, { method: "POST" });
      window.alert(response.message);
    });
  }

  async function handleCloseRound() {
    await runAction("closeRound", async () => {
      const response = await apiRequest(`/api/groups/${groupId}/round/close`, { method: "POST" });
      window.alert(response.message);
    });
  }

  async function handleToggleGroupStatus() {
    const nextStatus = group.status === "open" ? "active" : "open";
    await runAction("settings", async () => {
      await apiRequest(`/api/groups/${groupId}`, {
        method: "PUT",
        body: {
          status: nextStatus,
          auto_select_winner: group.auto_select_winner ? false : true,
          winner_selection_mode: group.auto_select_winner ? "manual" : "random",
        },
      });
    });
  }

  async function handleSimulateAllPayments() {
    await runAction("simulateAll", async () => {
      const response = await apiRequest(`/api/groups/${groupId}/payments/simulate-all`, { method: "POST" });
      window.alert(response.message);
    });
  }

  async function handleRemoveMember(userId) {
    if (!window.confirm("Remove this member from the group?")) {
      return;
    }

    await runAction(`remove-${userId}`, async () => {
      await apiRequest(`/api/groups/${groupId}/members/${userId}`, { method: "DELETE" });
    });
  }

  async function handleViewReport() {
    try {
      const response = await apiRequest(`/api/groups/${groupId}/report`);
      window.alert(
        `Collected: ${response.report.total_collected} Birr\nPaid out: ${response.report.total_paid_out} Birr\nPending payments: ${response.report.pending_payments}`
      );
    } catch (error) {
      window.alert(error.message);
    }
  }

  async function handleRestartCycle() {
    if (!window.confirm("Restart a new payment cycle from Round 1? All members will need to pay again.")) {
      return;
    }
    await runAction("restartCycle", async () => {
      await apiRequest(`/api/groups/${groupId}/restart-cycle`, { method: "POST" });
    });
  }

  async function handleCloseGroup() {
    if (!window.confirm("Permanently close this group? This action cannot be undone.")) {
      return;
    }
    await runAction("closeGroup", async () => {
      await apiRequest(`/api/groups/${groupId}/close`, { method: "POST" });
    });
  }

  return (
    <div className="space-y-8">

      {/* ── Cycle Completed Banner ─────────────────────────────────── */}
      {group.status === "completed" && isAdmin ? (
        <div className="rounded-xl border-2 border-yellow-400 bg-gradient-to-r from-yellow-50 to-orange-50 p-8">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="text-5xl">🏆</div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">All Rounds Completed!</h2>
              <p className="text-gray-600 mt-1">
                Every member has received a payout. What would you like to do next?
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md mt-2">
              <Button
                className="flex-1 bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 py-6 text-base"
                onClick={handleRestartCycle}
                disabled={busyAction === "restartCycle"}
              >
                {busyAction === "restartCycle" ? (
                  "Restarting..."
                ) : (
                  <>
                    <span className="mr-2">🔄</span>
                    Start New Cycle (Round 1)
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                className="flex-1 border-red-400 text-red-600 hover:bg-red-50 py-6 text-base"
                onClick={handleCloseGroup}
                disabled={busyAction === "closeGroup"}
              >
                {busyAction === "closeGroup" ? (
                  "Closing..."
                ) : (
                  <>
                    <span className="mr-2">✅</span>
                    Close Group (Done)
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {/* ── Group Header ──────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] text-white rounded-lg p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">{group.name}</h1>
            <p className="text-blue-100 flex items-center gap-2 flex-wrap">
              <Crown className="w-4 h-4" />
              Admin: {group.admin_name || group.creator_name}
              {isAdmin ? <Badge className="ml-2 bg-yellow-500 text-gray-900">You are admin</Badge> : null}
            </p>
          </div>
          <div className="text-right">
            <p className="text-blue-100 text-sm">Round Progress</p>
            <p className="text-2xl font-bold">
              {group.current_round_number || 0} / {group.total_rounds || group.max_members}
            </p>
          </div>
        </div>
        <div className="mt-6">
          <Progress value={group.progress_percentage || 0} className="h-3 bg-blue-900" />
          <div className="flex justify-between text-sm mt-2 text-blue-100">
            <span>{group.progress_percentage || 0}% Complete</span>
            <span>{Math.max((group.total_rounds || 0) - (group.current_round_number || 0), 0)} rounds remaining</span>
          </div>
        </div>
      </div>

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
                  {group.member_count}/{group.max_members}
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
                <p className="text-sm text-gray-600">Round Pool</p>
                <p className="text-2xl font-bold">{Number(group.contribution_amount) * Number(group.member_count)} Birr</p>
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
                <p className="text-lg font-bold">{formatDate(group.next_payment_date)}</p>
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
                  {paidMembers}/{members.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {latestWinnerName ? (
        <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-yellow-400 rounded-full">
                <Award className="w-8 h-8 text-gray-900" />
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">
                  {latestWinnerRound ? `Round ${latestWinnerRound} Winner` : "Latest Winner"}
                </p>
                <p className="text-2xl font-bold text-gray-900">{latestWinnerName}</p>
                <p className="text-sm text-gray-600 mt-1">
                  Received {Number(group.contribution_amount) * Number(group.member_count)} Birr
                  {group.current_round_number ? ` and round ${group.current_round_number} is now active.` : "."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Members ({members.length})</CardTitle>
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
                  {members.map((member) => (
                    <TableRow key={member.user_id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback className="bg-[#1E3A8A] text-white">
                              {initials(member.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{member.full_name}</p>
                            {member.role === "admin" ? <span className="text-xs text-gray-500">Admin</span> : null}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600">{member.phone}</TableCell>
                      <TableCell className="text-gray-600">
                        {member.joined_at ? new Date(member.joined_at).toLocaleDateString() : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {member.has_paid_current_round ? (
                            <Badge className="bg-green-100 text-green-800">Paid</Badge>
                          ) : (
                            <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                          )}
                          {isAdmin && member.role !== "admin" ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemoveMember(member.user_id)}
                              disabled={busyAction === `remove-${member.user_id}`}
                            >
                              Remove
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div>
          {isAdmin ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-yellow-600" />
                  Admin Controls
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Admin must pay just like other members */}
                {members.find((m) => m.role === 'admin' && !m.has_paid_current_round) ? (
                  <Button
                    className="w-full justify-start bg-green-600 hover:bg-green-700"
                    onClick={() => navigate(`/dashboard/payments?groupId=${groupId}`)}
                  >
                    <DollarSign className="w-4 h-4 mr-2" />
                    Make My Payment (Round {group.current_round_number || 1})
                  </Button>
                ) : null}
                <Button
                  className="w-full justify-start bg-[#1E3A8A] hover:bg-[#1E3A8A]/90"
                  onClick={handleSelectWinner}
                  disabled={busyAction === "selectWinner" || !allMembersPaid || !details.current_round}
                >
                  <Award className="w-4 h-4 mr-2" />
                  {busyAction === "selectWinner" ? "Selecting..." : "Select Random Winner"}
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleSendReminder}
                  disabled={busyAction === "sendReminder"}
                >
                  <Bell className="w-4 h-4 mr-2" />
                  Send Payment Reminders
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleToggleGroupStatus}
                  disabled={busyAction === "settings"}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Edit Group Settings
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={handleViewReport}>
                  <FileText className="w-4 h-4 mr-2" />
                  View Reports
                </Button>
                <div className="rounded-lg border border-dashed border-gray-300 p-3 text-sm text-gray-600">
                  {allMembersPaid
                    ? "✅ All members have paid. You can now select a winner for this round."
                    : `⏳ ${paidMembers}/${members.length} members paid. Winner selection unlocks once everyone has paid.`}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Group Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Contribution Amount</p>
                  <p className="text-lg font-semibold">{group.contribution_amount} Birr</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Frequency</p>
                  <p className="text-lg font-semibold capitalize">{group.frequency}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className="text-lg font-semibold capitalize">{group.display_status || group.status}</p>
                </div>
                {!isMember ? (
                  <Button
                    className="w-full bg-[#1E3A8A] hover:bg-[#1E3A8A]/90"
                    onClick={handleJoinGroup}
                    disabled={busyAction === "join" || group.status !== "open"}
                  >
                    {busyAction === "join" ? "Joining..." : "Join Group"}
                  </Button>
                ) : (
                  <Button
                    className="w-full bg-[#1E3A8A] hover:bg-[#1E3A8A]/90"
                    onClick={() => navigate(`/dashboard/payments?groupId=${groupId}`)}
                  >
                    Make Payment
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Group Snapshot</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-gray-700">
              <div className="flex justify-between">
                <span>Total collected</span>
                <span className="font-semibold">{report.total_collected || 0} Birr</span>
              </div>
              <div className="flex justify-between">
                <span>Pending payments</span>
                <span className="font-semibold">{report.pending_payments || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Paid out</span>
                <span className="font-semibold">{report.total_paid_out || 0} Birr</span>
              </div>
            </CardContent>
          </Card>

          {details.payouts?.length ? (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Winner History</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {details.payouts
                  .slice()
                  .reverse()
                  .map((payout) => (
                    <div key={payout.id} className="flex items-center justify-between border-b last:border-b-0 pb-3 last:pb-0">
                      <div>
                        <p className="font-medium">Round {payout.round_number}</p>
                        <p className="text-sm text-gray-600">{payout.recipient_name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{payout.amount} Birr</p>
                        <p className="text-xs text-gray-500 capitalize">{payout.status}</p>
                      </div>
                    </div>
                  ))}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
