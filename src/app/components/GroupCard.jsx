import { Users } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";
import { Link } from "react-router";












export function GroupCard({
  id,
  name,
  members,
  maxMembers,
  contributionAmount,
  progress,
  admin,
  status = "active"
}) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">{name}</CardTitle>
          {status === "full" &&
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
            <p className="text-sm text-gray-600">Monthly</p>
            <p className="font-semibold text-[#1E3A8A]">{contributionAmount} Birr</p>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Link to={`/dashboard/groups/${id}`} className="w-full">
          <Button className="w-full bg-[#1E3A8A] hover:bg-[#1E3A8A]/90">
            {status === "full" ? "View Details" : "Join Group"}
          </Button>
        </Link>
      </CardFooter>
    </Card>);

}