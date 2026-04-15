import { Bell, Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";

export function TopBar() {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search groups, members..."
              className="pl-10 bg-gray-50 border-gray-200" />
            
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Bell className="w-5 h-5 text-gray-600" />
            <Badge className="absolute -top-1 -right-1 bg-red-500 text-white px-1.5 py-0 text-xs min-w-[20px] h-5 flex items-center justify-center">
              3
            </Badge>
          </button>

          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src="" />
              <AvatarFallback className="bg-[#1E3A8A] text-white">AB</AvatarFallback>
            </Avatar>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-gray-900">Abebe Bekele</p>
              <p className="text-xs text-gray-500">Member</p>
            </div>
          </div>
        </div>
      </div>
    </div>);

}