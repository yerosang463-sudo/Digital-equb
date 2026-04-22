import { Users } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";
import { Link } from "react-router";












function ActionArea({ id, isMember, display_status, onJoin }) {
  if (isMember) {
    return (
      <Link to={`/dashboard/groups/${id}`} className="w-full">
        <Button className="w-full bg-[#1E3A8A] hover:bg-[#1E3A8A]/90">View Details</Button>
      </Link>
    );
  }

  if (display_status === "open") {
    return (
      <Button className="w-full bg-[#1E3A8A] hover:bg-[#1E3A8A]/90" onClick={onJoin}>
        Join Group
      </Button>
    );
  }

  const labelMap = {
    active: "Active",
    full: "Full",
    completed: "Completed",
  };
  const label = labelMap[display_status] ?? display_status ?? "Unavailable";

  return (
    <Badge
      variant="secondary"
      className="w-full justify-center py-2 text-sm text-gray-500 bg-gray-100 border-gray-200 cursor-not-allowed"
    >
      {label}
    </Badge>
  );
}

export function GroupCard({
  id,
  name,
  members,
  maxMembers,
  contributionAmount,
  progress,
  admin,
  display_status,
  status = "active",
  frequency = "monthly",
  isMember = false,
  onJoin,
}) {
  const resolvedStatus = display_status ?? status;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">{name}</CardTitle>
          {resolvedStatus === "full" &&
          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Full</span>
          }
        </div>
        {admin &&
        <p className="text-sm text-gray-500">
            Admin: {admin} <span className="ml-1">👑</span>
          </p>
        }
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">Round Progress</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-600">
            <Users className="w-4 h-4" />
            <span className="text-sm">
              {members}/{maxMembers} members
            </span>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600 capitalize">{frequency}</p>
            <p className="font-semibold text-[#1E3A8A]">{contributionAmount} Birr</p>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <ActionArea id={id} isMember={isMember} display_status={resolvedStatus} onJoin={onJoin} />
      </CardFooter>
    </Card>
  );
}
