import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import confetti from "canvas-confetti";
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
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

  // Auto-scroll and celebrate when something big happens
  useEffect(() => {
    const isCompleted = details?.group?.status === "completed";
    const hasWinner = !!details?.group?.current_winner_name;

    if ((isCompleted || hasWinner) && details?.group?.my_role === "admin") {
      // 1. Smoothly glide to the top so news is visible
      window.scrollTo({ top: 0, behavior: "smooth" });

      // 2. Fire the celebration!
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#1E3A8A", "#3B82F6", "#F59E0B", "#10B981"],
      });
    }
  }, [details?.group?.status, details?.group?.current_winner_name]);

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
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* ── Cycle Completed Celebration Modal ───────────────────────── */}
      <Dialog open={group.status === "completed" && isAdmin} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-xl border-4 border-yellow-400 shadow-2xl bg-gradient-to-br from-yellow-50 via-white to-orange-50 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-400"></div>
          
          <DialogHeader className="pt-8 flex flex-col items-center">
            <div className="text-8xl mb-6 animate-bounce">🏆</div>
            <DialogTitle className="text-4xl font-black text-gray-900 text-center leading-tight">
              Congratulations!<br />Cycle Successfully Completed
            </DialogTitle>
            <DialogDescription className="text-center text-xl text-gray-600 mt-4 px-4 leading-relaxed">
              Fantastic job. You have managed this group perfectly and every single member has received their payout.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-8 px-6">
            <Button
              className="w-full bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 py-8 text-xl font-bold shadow-xl shadow-blue-900/20"
              onClick={handleRestartCycle}
              disabled={busyAction === "restartCycle"}
            >
              {busyAction === "restartCycle" ? (
                "Restarting..."
              ) : (
                <>
                  <span className="mr-3">🔄</span>
                  Start a New Cycle (Round 1)
                </>
              )}
            </Button>
            
            <div className="flex gap-4">
              <Button
                variant="outline"
                className="flex-1 border-gray-300 text-gray-600 py-6 text-base hover:bg-gray-100"
                onClick={handleViewReport}
              >
                <FileText className="w-4 h-4 mr-2" />
                View Final Report
              </Button>
              <Button
              variant="outline"
              className="flex-1 border-red-400 text-red-600 hover:bg-red-50 py-6 text-base"
              onClick={handleCloseGroup}
              disabled={busyAction === "closeGroup"}
            >
                {busyAction === "closeGroup" ? "Closing..." : (
                  <>
                    <span className="mr-2">🏁</span>
                    Finish & Close Group
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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

      {/* ── Stats Cards ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Members</p>
                <p className="text-xl font-bold text-gray-900">{group.member_count}/{group.max_members}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-green-50 text-green-600 rounded-xl">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Round Pool</p>
                <p className="text-xl font-bold text-gray-900">{Number(group.contribution_amount) * Number(group.member_count)} Birr</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Next Payment</p>
                <p className="text-base font-bold text-gray-900">{formatDate(group.next_payment_date)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-yellow-50 text-yellow-600 rounded-xl">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Paid This Round</p>
                <p className="text-xl font-bold text-gray-900">{paidMembers}/{members.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Current Winner Banner ──────────────────────────────────── */}
      {latestWinnerName ? (
        <div className="flex items-center gap-5 bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-5">
          <div className="flex-shrink-0 w-14 h-14 bg-yellow-400 rounded-full flex items-center justify-center shadow-md">
            <Award className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-widest text-yellow-700 mb-0.5">
              {latestWinnerRound ? `Round ${latestWinnerRound} Winner` : "Latest Winner"}
            </p>
            <p className="text-2xl font-bold text-gray-900 truncate">{latestWinnerName}</p>
            <p className="text-sm text-gray-500 mt-0.5">
              Received {Number(group.contribution_amount) * Number(group.member_count)} Birr
              {group.current_round_number ? ` · Round ${group.current_round_number} now active` : ""}
            </p>
          </div>
        </div>
      ) : null}

      {/* ── Main 2-col Layout ─────────────────────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-6 items-start">

        {/* LEFT — Members + Snapshot + History */}
        <div className="lg:col-span-2 space-y-6">

          {/* Members Table */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="w-4 h-4 text-[#1E3A8A]" />
                Members
                <Badge className="ml-auto bg-blue-50 text-blue-700 border-blue-200 font-semibold">{members.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/70">
                    <TableHead className="pl-6">Member</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right pr-6">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member.user_id} className="hover:bg-gray-50/50">
                      <TableCell className="pl-6">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="bg-[#1E3A8A] text-white text-xs font-bold">
                              {initials(member.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm text-gray-900">{member.full_name}</p>
                            {member.role === "admin" ? (
                              <span className="text-xs text-blue-600 font-medium">Admin</span>
                            ) : null}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-500 text-sm">{member.phone}</TableCell>
                      <TableCell className="text-gray-500 text-sm">
                        {member.joined_at ? new Date(member.joined_at).toLocaleDateString() : "—"}
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex items-center justify-end gap-2">
                          {member.has_paid_current_round ? (
                            <Badge className="bg-green-50 text-green-700 border-green-200">✓ Paid</Badge>
                          ) : (
                            <Badge className="bg-amber-50 text-amber-700 border-amber-200">Pending</Badge>
                          )}
                          {isAdmin && member.role !== "admin" ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 h-7 px-2 text-xs"
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

          {/* Group Snapshot + Winner History side by side */}
          <div className="grid sm:grid-cols-2 gap-4">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Group Snapshot</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                {[
                  { label: "Total collected", value: `${report.total_collected || 0} Birr`, color: "text-green-600" },
                  { label: "Pending payments", value: report.pending_payments || 0, color: "text-amber-600" },
                  { label: "Paid out", value: `${report.total_paid_out || 0} Birr`, color: "text-blue-600" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex items-center justify-between py-1.5 border-b last:border-b-0">
                    <span className="text-sm text-gray-500">{label}</span>
                    <span className={`text-sm font-bold ${color}`}>{value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {details.payouts?.length ? (
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Winner History</CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-2 max-h-56 overflow-y-auto">
                  {details.payouts
                    .slice()
                    .reverse()
                    .map((payout) => (
                      <div key={payout.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                        <div>
                          <p className="text-sm font-semibold text-gray-800">Round {payout.round_number}</p>
                          <p className="text-xs text-gray-500">{payout.recipient_name}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-gray-900">{payout.amount} Birr</p>
                          <span className="text-xs px-1.5 py-0.5 rounded bg-green-50 text-green-700 font-medium capitalize">{payout.status}</span>
                        </div>
                      </div>
                    ))}
                </CardContent>
              </Card>
            ) : (
              <Card className="border-0 shadow-sm bg-gray-50/60">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center text-gray-400">
                  <Award className="w-10 h-10 mb-3 opacity-30" />
                  <p className="text-sm">No winners yet</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* RIGHT — Action Panel */}
        <div className="space-y-4 lg:sticky lg:top-6">
          {isAdmin ? (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3 border-b bg-gradient-to-r from-[#1E3A8A]/5 to-blue-50 rounded-t-xl">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Crown className="w-4 h-4 text-yellow-500" />
                  Admin Controls
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-2.5">
                {/* Admin payment button */}
                {members.find((m) => m.role === "admin" && !m.has_paid_current_round) ? (
                  <Button
                    className="w-full justify-start bg-green-600 hover:bg-green-700 text-sm h-10"
                    onClick={() => navigate(`/dashboard/payments?groupId=${groupId}`)}
                  >
                    <DollarSign className="w-4 h-4 mr-2" />
                    Make My Payment — Round {group.current_round_number || 1}
                  </Button>
                ) : null}

                {/* Select Winner */}
                <Button
                  className="w-full justify-start bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-sm h-10"
                  onClick={handleSelectWinner}
                  disabled={busyAction === "selectWinner" || !allMembersPaid || !details.current_round}
                >
                  <Award className="w-4 h-4 mr-2" />
                  {busyAction === "selectWinner" ? "Selecting..." : "Select Random Winner"}
                </Button>

                {/* Payment status hint */}
                <div className={`rounded-lg px-3 py-2.5 text-xs font-medium flex items-center gap-2 ${allMembersPaid ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
                  <span>{allMembersPaid ? "✅" : "⏳"}</span>
                  {allMembersPaid
                    ? "All members paid — winner selection ready!"
                    : `${paidMembers} of ${members.length} members paid`}
                </div>

                <div className="border-t pt-2.5 space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start text-sm h-9"
                    onClick={handleSendReminder}
                    disabled={busyAction === "sendReminder"}
                  >
                    <Bell className="w-4 h-4 mr-2 text-gray-500" />
                    Send Payment Reminders
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-sm h-9"
                    onClick={handleToggleGroupStatus}
                    disabled={busyAction === "settings"}
                  >
                    <Settings className="w-4 h-4 mr-2 text-gray-500" />
                    Edit Group Settings
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-sm h-9"
                    onClick={handleViewReport}
                  >
                    <FileText className="w-4 h-4 mr-2 text-gray-500" />
                    View Full Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-sm text-gray-700">Group Info</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                {[
                  { label: "Contribution", value: `${group.contribution_amount} Birr` },
                  { label: "Frequency", value: group.frequency },
                  { label: "Status", value: group.display_status || group.status },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center py-1 border-b last:border-b-0">
                    <span className="text-sm text-gray-500">{label}</span>
                    <span className="text-sm font-semibold capitalize text-gray-900">{value}</span>
                  </div>
                ))}
                <div className="pt-2">
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
                      <DollarSign className="w-4 h-4 mr-2" />
                      Make Payment
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}


