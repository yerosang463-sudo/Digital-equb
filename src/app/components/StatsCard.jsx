
import { Card, CardContent } from "./ui/card";









export function StatsCard({ icon: Icon, label, value, change, iconColor = "bg-blue-100 text-blue-600" }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-gray-600">{label}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {change &&
            <p className="text-xs text-green-600">{change}</p>
            }
          </div>
          <div className={`p-3 rounded-lg ${iconColor}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>);

}