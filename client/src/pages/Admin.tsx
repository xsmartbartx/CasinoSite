import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Users, Settings, ChevronRight, ChevronLeft, BarChart2, User as UserIcon, Shield, Copy, Check, ChevronUp, ChevronDown } from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Admin Dashboard Component
export default function Admin() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("dashboard");

  // Check if user is admin
  useEffect(() => {
    if (!user || (user.role !== "admin" && user.role !== "superadmin")) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access the admin panel.",
        variant: "destructive"
      });
      navigate("/");
    }
  }, [user, navigate, toast]);

if (!user || (user.role !== "admin" && user.role !== "superadmin")) {
    return (
      <div className="container mx-auto py-8 flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You don't have permission to access this page.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/")} className="w-full">
              Return to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Panel</h1>
          <p className="text-muted-foreground">
            Manage users, games, and view analytics.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center gap-2 bg-muted px-3 py-1 rounded-full">
            <Shield size={16} className="text-amber-500" />
            <span className="text-sm font-medium capitalize">{user.role}</span>
          </div>
        </div>
      </div>

<Tabs defaultValue="dashboard" className="w-full" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 md:w-auto">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="games">Games</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard">
          <AdminDashboard />
        </TabsContent>
        
        <TabsContent value="users">
          <UserManagement />
        </TabsContent>
        
        <TabsContent value="games">
          <GameSettings />
        </TabsContent>
        
        <TabsContent value="analytics">
          <AnalyticsDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Admin Dashboard Component
function AdminDashboard() {
  // Mock data for dashboard summary
  const summaryData = [
    {
      title: "Total Users",
      value: "3,721",
      change: "+12%",
      description: "from last month"
    },
    {
      title: "Active Players",
      value: "1,259",
      change: "+18%",
      description: "daily active users"
    },
    {
      title: "Total Bets",
      value: "92,475",
      change: "+5.2%",
      description: "from previous week"
    },
    {
      title: "House Edge",
      value: "$28,392",
      change: "+7.3%",
      description: "profit this month"
    }
  ];

  // Mock data for activity chart
  const activityData = [
    { name: "Mon", users: 345, bets: 2453 },
    { name: "Tue", users: 389, bets: 2367 },
    { name: "Wed", users: 483, bets: 3290 },
    { name: "Thu", users: 562, bets: 3812 },
    { name: "Fri", users: 689, bets: 4521 },
    { name: "Sat", users: 782, bets: 5324 },
    { name: "Sun", users: 724, bets: 4928 }
  ];

  // Mock recent activity data
  const recentActivity = [
    { id: 1, user: "player123", action: "New registration", time: "5 mins ago" },
    { id: 2, user: "winmaster", action: "Won $350 in Crash", time: "12 mins ago" },
    { id: 3, user: "gambler479", action: "Updated profile", time: "47 mins ago" },
    { id: 4, user: "luckystar", action: "Placed 20 bets", time: "1 hour ago" },
    { id: 5, user: "admin2", action: "Modified game settings", time: "2 hours ago" }
  ];

  return (
    <div className="grid gap-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
        {summaryData.map((item, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {item.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{item.value}</div>
              <p className="text-xs text-muted-foreground">
                <span className={item.change.startsWith('+') ? "text-emerald-500" : "text-rose-500"}>
                  {item.change}
                </span>{" "}
                {item.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Activity chart */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Weekly Activity</CardTitle>
          <CardDescription>
            Overview of user activity and bets over the past week
          </CardDescription>
        </CardHeader>
        <CardContent className="pl-2">
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={activityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
              <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
              <Tooltip />
              <Bar yAxisId="left" dataKey="users" fill="#8884d8" name="Active Users" />
              <Bar yAxisId="right" dataKey="bets" fill="#82ca9d" name="Total Bets" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

            {/* Recent activity */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Latest actions performed on the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentActivity.map((activity) => (
                <TableRow key={activity.id}>
                  <TableCell className="font-medium">{activity.user}</TableCell>
                  <TableCell>{activity.action}</TableCell>
                  <TableCell>{activity.time}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// User Management Component
function UserManagement() {
  const { toast } = useToast();
  // For pagination
  const [page, setPage] = useState(1);
  const [pageSize] = useState(8);

  // For search and filters
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // For transaction history modal
  const [isTransactionsOpen, setIsTransactionsOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [userTransactions, setUserTransactions] = useState<any[]>([]);
  
  // For password reset modal
  const [isPasswordResetOpen, setIsPasswordResetOpen] = useState(false);
  const [resetResult, setResetResult] = useState<{ tempPassword: string } | null>(null);

  // Mock user data
  const userData = [
    { id: 1, username: "player123", email: "player123@example.com", role: "user", balance: 3450, isActive: true, lastLogin: "2023-08-10T14:32:13" },
    { id: 2, username: "admin_jane", email: "jane@admin.com", role: "admin", balance: 10000, isActive: true, lastLogin: "2023-08-15T09:15:22" },
    { id: 3, username: "gambler479", email: "gambler479@example.com", role: "user", balance: 1250, isActive: true, lastLogin: "2023-08-12T18:45:37" },
    { id: 4, username: "luckystar", email: "lucky@example.com", role: "user", balance: 7890, isActive: true, lastLogin: "2023-08-14T11:23:45" },
    { id: 5, username: "bigwinner", email: "winner@example.com", role: "user", balance: 12340, isActive: false, lastLogin: "2023-07-29T15:12:08" },
    { id: 6, username: "superadmin", email: "super@admin.com", role: "superadmin", balance: 50000, isActive: true, lastLogin: "2023-08-15T10:05:18" },
    { id: 7, username: "casual_player", email: "casual@example.com", role: "user", balance: 2100, isActive: true, lastLogin: "2023-08-13T20:34:19" },
    { id: 8, username: "inactive_user", email: "inactive@example.com", role: "user", balance: 500, isActive: false, lastLogin: "2023-06-20T08:17:22" },
    { id: 9, username: "highroller", email: "highroller@example.com", role: "user", balance: 25000, isActive: true, lastLogin: "2023-08-15T14:22:31" },
    { id: 10, username: "newbie", email: "newbie@example.com", role: "user", balance: 1000, isActive: true, lastLogin: "2023-08-15T08:45:12" }
  ];

  // Filter users based on search and filters
  const filteredUsers = userData.filter(user => {
    // Search filter
    const matchesSearch = searchQuery === "" || 
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());

    // Role filter
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    
    // Status filter
    const matchesStatus = 
      statusFilter === "all" || 
      (statusFilter === "active" && user.isActive) ||
      (statusFilter === "inactive" && !user.isActive);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

    // Paginate results
  const paginatedUsers = filteredUsers.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(filteredUsers.length / pageSize);

    // Format date to human-readable
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

    // Role update handler (would normally call API)
  const handleRoleUpdate = (userId: number, newRole: string) => {
    console.log(`Update user ${userId} role to ${newRole}`);
    // Call API to update role
  };

    // Status update handler (would normally call API)
  const handleStatusUpdate = (userId: number, isActive: boolean) => {
    console.log(`Update user ${userId} status to ${isActive ? 'active' : 'inactive'}`);
    // Call API to update status
  };

    // Handler for viewing transactions
  const handleViewTransactions = async (userId: number) => {
    setSelectedUserId(userId);
    setIsTransactionsOpen(true);

    try {
      const response = await apiRequest<any[]>(`/api/admin/users/${userId}/transactions`);
      setUserTransactions(response);
    } catch (error) {
      console.error("Error fetching user transactions:", error);
      toast({
        title: "Error",
        description: "Failed to load transaction history",
        variant: "destructive"
      });
      setUserTransactions([]);
    }
  };

    // Handler for resetting password
  const handleResetPassword = async (userId: number) => {
    setSelectedUserId(userId);
    setIsPasswordResetOpen(true);
    setResetResult(null);

    try {
      const response = await apiRequest<{ tempPassword: string }>(`/api/admin/users/${userId}/reset-password`, { 
        method: 'POST' 
      });
      setResetResult(response);
      toast({
        title: "Success",
        description: "Password has been reset successfully"
      });
    } catch (error) {
      console.error("Error resetting password:", error);
      toast({
        title: "Error",
        description: "Failed to reset password",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>
            Manage user accounts, roles, and permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search by username or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex gap-4">
              <div className="w-[150px]">
                <Select
                  value={roleFilter}
                  onValueChange={setRoleFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="superadmin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-[150px]">
                <Select
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

                    {/* Users table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.username}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Select
                        defaultValue={user.role}
                        onValueChange={(value) => handleRoleUpdate(user.id, value)}
                      >
                        <SelectTrigger className="w-[130px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          {/* Only superadmins can change to superadmin */}
                          <SelectItem value="superadmin" disabled={true}>Super Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>${user.balance.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={user.isActive}
                          onCheckedChange={(checked) => handleStatusUpdate(user.id, checked)}
                        />
                        <span>{user.isActive ? "Active" : "Inactive"}</span>
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(user.lastLogin)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewTransactions(user.id)}
                        >
                          Transactions
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleResetPassword(user.id)}
                        >
                          Reset Password
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

                    {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, filteredUsers.length)} of {filteredUsers.length} users
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Previous Page</span>
              </Button>
              <div className="text-sm">
                Page {page} of {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
                <span className="sr-only">Next Page</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

            {/* Transaction History Dialog */}
      <Dialog open={isTransactionsOpen} onOpenChange={setIsTransactionsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Transaction History</DialogTitle>
            <DialogDescription>
              Viewing transactions for user {selectedUserId ? userData.find(u => u.id === selectedUserId)?.username : ''}
            </DialogDescription>
          </DialogHeader>
          
          {userTransactions.length > 0 ? (
            <div className="max-h-[60vh] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Game</TableHead>
                    <TableHead>Bet Amount</TableHead>
                    <TableHead>Multiplier</TableHead>
                    <TableHead>Payout</TableHead>
                    <TableHead>Result</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>{transaction.game?.name || `Game #${transaction.gameId}`}</TableCell>
                      <TableCell>${transaction.bet.toLocaleString()}</TableCell>
                      <TableCell>x{transaction.multiplier.toFixed(2)}</TableCell>
                      <TableCell>${transaction.payout.toLocaleString()}</TableCell>
                      <TableCell>
                        <span className={transaction.result === 'win' ? 'text-green-500' : 'text-red-500'}>
                          {transaction.result === 'win' ? 'Win' : 'Loss'}
                        </span>
                      </TableCell>
                      <TableCell>{formatDate(transaction.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              No transaction history found for this user
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTransactionsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

       {/* Password Reset Dialog */}
      <Dialog open={isPasswordResetOpen} onOpenChange={setIsPasswordResetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Password Reset</DialogTitle>
            <DialogDescription>
              {resetResult ? 
                "Password has been reset successfully. Please share the temporary password with the user." :
                `Resetting password for user ${selectedUserId ? userData.find(u => u.id === selectedUserId)?.username : ''}`
              }
            </DialogDescription>
          </DialogHeader>
          
          {resetResult ? (
            <div className="my-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Temporary Password</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-2 bg-muted rounded-md">
                    <code className="text-sm font-mono">{resetResult.tempPassword}</code>
                    <CopyPasswordButton password={resetResult.tempPassword} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    The user will need to change this password on their next login.
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="py-6 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p>Resetting password...</p>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPasswordResetOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helper component for copying password
function CopyPasswordButton({ password }: { password: string }) {
  const [copied, setCopied] = useState(false);
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <Button variant="ghost" size="sm" onClick={copyToClipboard}>
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
    </Button>
  );
}

// Game Settings Component
function GameSettings() {
  const { toast } = useToast();
  
  // Fetch game settings from API
  const { data: gameData, isLoading, refetch } = useQuery({
    queryKey: ['/api/admin/games'],
    queryFn: () => apiRequest<any[]>('/api/admin/games'),
  });

  // State for edited settings
  const [editedSettings, setEditedSettings] = useState<{[key: number]: any}>({});
  // State for currently expanded advanced settings
  const [expandedGameId, setExpandedGameId] = useState<number | null>(null);

    // Default game data if API returns empty
  const defaultGameData = [
    { 
      id: 1, 
      name: "Slots", 
      rtp: 96.5, 
      type: "slot", 
      settings: {
        minBet: 1,
        maxBet: 1000,
        maxWin: 10000,
        houseEdge: 0.035,
        isEnabled: true,
        // Slot specific settings
        symbolFrequencies: {
          cherry: 15,
          lemon: 20, 
          orange: 20,
          plum: 15,
          bell: 12,
          bar: 10,
          seven: 5,
          wild: 3
        },
        payoutMultipliers: {
          threeInRow: 5,
          threeSevens: 15,
          threeWilds: 30,
          diagonal: 3
        }
      }
    },
    { 
      id: 2, 
      name: "Roulette", 
      rtp: 97.3, 
      type: "roulette", 
      settings: {
        minBet: 1,
        maxBet: 2000,
        maxWin: 35000,
        houseEdge: 0.027,
        isEnabled: true,
        // Roulette specific settings
        straightUpMaxBet: 100,
        splitMaxBet: 200,
        streetMaxBet: 300,
        cornerMaxBet: 400,
        columnMaxBet: 1000,
        dozenMaxBet: 1000,
        evenOddMaxBet: 2000,
        redBlackMaxBet: 2000
      }
    },
    { 
      id: 3, 
      name: "Dice", 
      rtp: 98.5, 
      type: "dice", 
      settings: {
        minBet: 1,
        maxBet: 500,
        maxWin: 9500,
        houseEdge: 0.015,
        isEnabled: true,
        // Dice specific settings
        minRange: 1,
        maxRange: 100,
        winMultiplierFormula: "98 / (100 - target)",
        probabilityRanges: {
          easy: [50, 75],
          medium: [25, 49],
          hard: [10, 24],
          expert: [1, 9]
        }
      }
    },
    { 
      id: 4, 
      name: "Crash", 
      rtp: 97.0, 
      type: "crash", 
      settings: {
        minBet: 5,
        maxBet: 1000,
        maxWin: 50000,
        houseEdge: 0.03,
        isEnabled: true,
        // Crash specific settings
        crashPointDistribution: {
          mean: 1.9,
          houseFactor: 0.97,
          variance: 0.2
        },
        gameSpeedMs: 40,
        waitTimeBeforeStartMs: 5000,
        maxMultiplier: 100
      }
    }
  ];

    // If loading, show skeleton UI
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Game Settings</CardTitle>
            <CardDescription>
              Loading game configuration...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {[1, 2, 3, 4].map((id) => (
                <div key={id} className="p-6 border rounded-lg mb-6 animate-pulse">
                  <div className="h-6 bg-muted rounded mb-4 w-1/4"></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((fieldId) => (
                      <div key={fieldId} className="space-y-2">
                        <div className="h-4 bg-muted rounded w-1/2"></div>
                        <div className="h-9 bg-muted rounded"></div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Handler for saving changes
  const handleSaveSettings = async (gameId: number) => {
    try {
      const settings = editedSettings[gameId];
      await apiRequest(`/api/admin/games/${gameId}/settings`, {
        method: 'PATCH',
        data: settings
      });
      
      toast({
        title: "Settings saved",
        description: "Game settings have been updated successfully.",
      });
      
      // Remove from edited settings after successful save
      const newEditedSettings = { ...editedSettings };
      delete newEditedSettings[gameId];
      setEditedSettings(newEditedSettings);

            // Refetch data
      refetch();
    } catch (error) {
      console.error("Failed to save game settings:", error);
      toast({
        title: "Error",
        description: "Failed to save game settings. Please try again.",
        variant: "destructive"
      });
    }
  };

    // Handler for updating a setting
  const updateSetting = (gameId: number, field: string, value: any) => {
    setEditedSettings({
      ...editedSettings,
      [gameId]: {
        ...(editedSettings[gameId] || {}),
        [field]: value
      }
    });
  };

    // Handler for updating a nested setting (for game-specific settings)
  const updateNestedSetting = (gameId: number, parentField: string, field: string, value: any) => {
    const currentParentValue = getSettingValue(
      gameData?.find(g => g.id === gameId) || defaultGameData.find(g => g.id === gameId),
      parentField
    );
    
    setEditedSettings({
      ...editedSettings,
      [gameId]: {
        ...(editedSettings[gameId] || {}),
        [parentField]: {
          ...currentParentValue,
          [field]: value
        }
      }
    });
  };

    // Get current setting value (edited or original)
  const getSettingValue = (game: any, field: string) => {
    if (editedSettings[game.id] && editedSettings[game.id][field] !== undefined) {
      return editedSettings[game.id][field];
    }
    return game.settings[field];
  };

  // Handler for toggling advanced settings view
  const toggleAdvancedSettings = (gameId: number) => {
    setExpandedGameId(expandedGameId === gameId ? null : gameId);
  };

  // Get the games data to display
  const games = gameData || defaultGameData;