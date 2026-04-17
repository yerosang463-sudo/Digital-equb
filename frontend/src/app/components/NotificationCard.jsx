import { Bell, CheckCircle, AlertCircle, Info } from "lucide-react";
import { Card, CardContent } from "./ui/card";







const iconMap = {
  success: CheckCircle,
  warning: AlertCircle,
  info: Info,
  payment_due: AlertCircle,
  payment_received: CheckCircle,
  payout: Info,
  group_update: Info,
  default: Bell
};

const colorMap = {
  success: "text-green-600 bg-green-100",
  warning: "text-yellow-600 bg-yellow-100",
  info: "text-blue-600 bg-blue-100",
  payment_due: "text-yellow-600 bg-yellow-100",
  payment_received: "text-green-600 bg-green-100",
  payout: "text-blue-600 bg-blue-100",
  group_update: "text-blue-600 bg-blue-100",
  default: "text-gray-600 bg-gray-100"
};

export function NotificationCard({ type, message, timestamp }) {
  const Icon = iconMap[type] || iconMap.default;
  const colorClass = colorMap[type] || colorMap.default;

  return (
    <Card className="hover:bg-gray-50 transition-colors cursor-pointer">
      <CardContent className="p-4">
        <div className="flex gap-3">
          <div className={`p-2 rounded-lg h-fit ${colorClass}`}>
            <Icon className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-900">{message}</p>
            <p className="text-xs text-gray-500 mt-1">{timestamp}</p>
          </div>
        </div>
      </CardContent>
    </Card>);

}
