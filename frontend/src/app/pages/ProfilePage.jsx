import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Lock, Bell } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { apiRequest } from "../lib/api";
import { useAuth } from "../providers/AuthProvider";

function initials(name) {
  return (name || "User")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function ProfilePage() {
  const navigate = useNavigate();
  const { setUser, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [profile, setProfile] = useState({
    full_name: "",
    email: "",
    phone: "",
    created_at: "",
    notify_payment_reminders: true,
    notify_winner_announcements: true,
    notify_new_member_alerts: false,
    notify_email_updates: true,
  });
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  });

  useEffect(() => {
    let ignore = false;

    async function loadProfile() {
      try {
        const response = await apiRequest("/api/users/profile");
        if (!ignore) {
          setProfile(response.user);
          setUser(response.user);
        }
      } catch (error) {
        if (!ignore) {
          if (error.status === 401 || error.status === 403) {
            logout();
            navigate("/login", { replace: true });
            return;
          }

          window.alert(error.message);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadProfile();
    return () => {
      ignore = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleUpdateProfile() {
    setSaving(true);
    setSaveSuccess(false);
    try {
      const response = await apiRequest("/api/users/profile", {
        method: "PUT",
        body: {
          full_name: profile.full_name,
          email: profile.email,
          phone: profile.phone,
          bio: profile.bio,
        },
      });
      setProfile((current) => ({ ...current, ...response.user }));
      setUser(response.user);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      window.alert(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword() {
    if (passwords.new !== passwords.confirm) {
      window.alert("New passwords do not match.");
      return;
    }

    try {
      await apiRequest("/api/users/change-password", {
        method: "PUT",
        body: {
          current_password: passwords.current,
          new_password: passwords.new,
        },
      });
      setPasswords({ current: "", new: "", confirm: "" });
      window.alert("Password changed successfully!");
    } catch (error) {
      window.alert(error.message);
    }
  }

  async function handleSavePreferences() {
    try {
      const response = await apiRequest("/api/users/profile/preferences", {
        method: "PUT",
        body: {
          notify_payment_reminders: Boolean(profile.notify_payment_reminders),
          notify_winner_announcements: Boolean(profile.notify_winner_announcements),
          notify_new_member_alerts: Boolean(profile.notify_new_member_alerts),
          notify_email_updates: Boolean(profile.notify_email_updates),
        },
      });

      setProfile((current) => ({ ...current, ...response.preferences }));
      window.alert("Notification preferences updated!");
    } catch (error) {
      window.alert(error.message);
    }
  }

  if (loading) {
    return <div className="text-gray-600">Loading profile...</div>;
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
        <p className="text-gray-600 mt-1">Manage your account and preferences</p>
      </div>

      <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] rounded-lg text-white">
        <Avatar className="w-16 h-16">
          <AvatarFallback className="bg-white text-[#1E3A8A] text-xl">
            {initials(profile.full_name)}
          </AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-xl font-bold">{profile.full_name}</h2>
          <p className="text-blue-100 text-sm">{profile.email}</p>
          <p className="text-blue-100 text-xs mt-1">
            Member since {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : "-"}
          </p>
        </div>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">
            <User className="w-4 h-4 mr-2" />
            Profile Info
          </TabsTrigger>
          <TabsTrigger value="security">
            <Lock className="w-4 h-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="w-4 h-4 mr-2" />
            Notifications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={profile.full_name || ""}
                  onChange={(event) => setProfile({ ...profile, full_name: event.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email || ""}
                  onChange={(event) => setProfile({ ...profile, email: event.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+251911234567"
                  value={profile.phone || ""}
                  onChange={(event) => setProfile({ ...profile, phone: event.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Input
                  id="bio"
                  placeholder="Tell us a bit about yourself"
                  value={profile.bio || ""}
                  onChange={(event) => setProfile({ ...profile, bio: event.target.value })}
                />
              </div>
              <div className="flex items-center gap-3">
                <Button
                  className="bg-[#1E3A8A] hover:bg-[#1E3A8A]/90"
                  onClick={handleUpdateProfile}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
                {saveSuccess && (
                  <span className="text-sm text-green-600 font-medium">✓ Profile updated successfully</span>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={passwords.current}
                  onChange={(event) => setPasswords({ ...passwords, current: event.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwords.new}
                  onChange={(event) => setPasswords({ ...passwords, new: event.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwords.confirm}
                  onChange={(event) => setPasswords({ ...passwords, confirm: event.target.value })}
                />
              </div>
              <Button className="bg-[#1E3A8A] hover:bg-[#1E3A8A]/90" onClick={handleChangePassword}>
                Update Password
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Payment Reminders</p>
                  <p className="text-sm text-gray-500">Get notified before payment due dates</p>
                </div>
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded"
                  checked={Boolean(profile.notify_payment_reminders)}
                  onChange={(event) =>
                    setProfile({ ...profile, notify_payment_reminders: event.target.checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Winner Announcements</p>
                  <p className="text-sm text-gray-500">Notifications when winners are selected</p>
                </div>
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded"
                  checked={Boolean(profile.notify_winner_announcements)}
                  onChange={(event) =>
                    setProfile({ ...profile, notify_winner_announcements: event.target.checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">New Member Alerts</p>
                  <p className="text-sm text-gray-500">When someone joins your groups</p>
                </div>
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded"
                  checked={Boolean(profile.notify_new_member_alerts)}
                  onChange={(event) =>
                    setProfile({ ...profile, notify_new_member_alerts: event.target.checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-gray-500">Receive updates via email</p>
                </div>
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded"
                  checked={Boolean(profile.notify_email_updates)}
                  onChange={(event) =>
                    setProfile({ ...profile, notify_email_updates: event.target.checked })
                  }
                />
              </div>
              <Button className="bg-[#1E3A8A] hover:bg-[#1E3A8A]/90" onClick={handleSavePreferences}>
                Save Preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
