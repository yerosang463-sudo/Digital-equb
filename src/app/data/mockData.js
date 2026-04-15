












































export const currentUser = {
  id: "user-1",
  name: "Abebe Bekele",
  email: "abebe@example.com",
  phone: "+251912345678",
  joinedAt: "2025-01-15"
};

export const mockGroups = [
{
  id: "group-1",
  name: "Family Savings Circle",
  admin: "Abebe Bekele",
  members: [
  { id: "user-1", name: "Abebe Bekele", email: "abebe@example.com", phone: "+251912345678", joinedAt: "2025-01-15", hasPaid: true, isAdmin: true },
  { id: "user-2", name: "Tigist Alemayehu", email: "tigist@example.com", phone: "+251923456789", joinedAt: "2025-01-16", hasPaid: true },
  { id: "user-3", name: "Daniel Haile", email: "daniel@example.com", phone: "+251934567890", joinedAt: "2025-01-17", hasPaid: true },
  { id: "user-4", name: "Sara Mulugeta", email: "sara@example.com", phone: "+251945678901", joinedAt: "2025-01-18", hasPaid: false },
  { id: "user-5", name: "Yohannes Tadesse", email: "yohannes@example.com", phone: "+251956789012", joinedAt: "2025-01-19", hasPaid: true }],

  maxMembers: 10,
  contributionAmount: 500,
  frequency: "monthly",
  currentRound: 2,
  totalRounds: 10,
  status: "active",
  createdAt: "2025-01-15",
  nextPaymentDate: "2026-05-01",
  currentWinner: "Tigist Alemayehu"
},
{
  id: "group-2",
  name: "Tech Professionals Equb",
  admin: "Dawit Alemu",
  members: [
  { id: "user-1", name: "Abebe Bekele", email: "abebe@example.com", phone: "+251912345678", joinedAt: "2025-02-01", hasPaid: true },
  { id: "user-6", name: "Dawit Alemu", email: "dawit@example.com", phone: "+251967890123", joinedAt: "2025-02-01", hasPaid: true, isAdmin: true },
  { id: "user-7", name: "Meron Kebede", email: "meron@example.com", phone: "+251978901234", joinedAt: "2025-02-02", hasPaid: true },
  { id: "user-8", name: "Ephrem Tesfaye", email: "ephrem@example.com", phone: "+251989012345", joinedAt: "2025-02-03", hasPaid: true },
  { id: "user-9", name: "Helen Girma", email: "helen@example.com", phone: "+251990123456", joinedAt: "2025-02-04", hasPaid: false },
  { id: "user-10", name: "Samuel Desta", email: "samuel@example.com", phone: "+251901234567", joinedAt: "2025-02-05", hasPaid: true },
  { id: "user-11", name: "Ruth Assefa", email: "ruth@example.com", phone: "+251911111111", joinedAt: "2025-02-06", hasPaid: true },
  { id: "user-12", name: "Biniam Wondimu", email: "biniam@example.com", phone: "+251922222222", joinedAt: "2025-02-07", hasPaid: true }],

  maxMembers: 8,
  contributionAmount: 1000,
  frequency: "monthly",
  currentRound: 1,
  totalRounds: 8,
  status: "full",
  createdAt: "2025-02-01",
  nextPaymentDate: "2026-05-01",
  currentWinner: "Dawit Alemu"
},
{
  id: "group-3",
  name: "Women Entrepreneurs Fund",
  admin: "Hanna Tesfaye",
  members: [
  { id: "user-13", name: "Hanna Tesfaye", email: "hanna@example.com", phone: "+251933333333", joinedAt: "2025-03-01", hasPaid: true, isAdmin: true },
  { id: "user-14", name: "Almaz Wolde", email: "almaz@example.com", phone: "+251944444444", joinedAt: "2025-03-02", hasPaid: true },
  { id: "user-15", name: "Selamawit Negash", email: "selamawit@example.com", phone: "+251955555555", joinedAt: "2025-03-03", hasPaid: false }],

  maxMembers: 12,
  contributionAmount: 2000,
  frequency: "monthly",
  currentRound: 1,
  totalRounds: 12,
  status: "active",
  createdAt: "2025-03-01",
  nextPaymentDate: "2026-05-01"
}];


export const mockPayments = [
{
  id: "pay-1",
  groupId: "group-1",
  groupName: "Family Savings Circle",
  amount: 500,
  date: "2026-04-01",
  status: "completed",
  method: "telebirr",
  round: 2
},
{
  id: "pay-2",
  groupId: "group-2",
  groupName: "Tech Professionals Equb",
  amount: 1000,
  date: "2026-04-01",
  status: "completed",
  method: "telebirr",
  round: 1
},
{
  id: "pay-3",
  groupId: "group-1",
  groupName: "Family Savings Circle",
  amount: 500,
  date: "2026-03-01",
  status: "completed",
  method: "telebirr",
  round: 1
},
{
  id: "pay-4",
  groupId: "group-2",
  groupName: "Tech Professionals Equb",
  amount: 1000,
  date: "2026-05-01",
  status: "pending",
  method: "telebirr",
  round: 2
}];


export const mockNotifications = [
{
  id: "notif-1",
  type: "success",
  message: "Your payment of 500 Birr to Family Savings Circle was successful!",
  timestamp: "2 hours ago",
  read: false
},
{
  id: "notif-2",
  type: "warning",
  message: "Payment due for Tech Professionals Equb on May 1, 2026",
  timestamp: "1 day ago",
  read: false
},
{
  id: "notif-3",
  type: "info",
  message: "Tigist Alemayehu won this month's round in Family Savings Circle!",
  timestamp: "3 days ago",
  read: true
}];