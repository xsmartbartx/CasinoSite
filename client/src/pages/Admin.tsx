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
import { Loader2, Users, Settings, ChevronRight, ChevronLeft, BarChart2, User as UserIcon, Shield, Copy, Check } from "lucide-react";
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
  // Mock game data
  const gameData = [
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
        isEnabled: true
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
        isEnabled: true
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
        isEnabled: true
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
        isEnabled: true
      }
    }
  ];

  // State for edited settings
  const [editedSettings, setEditedSettings] = useState<{[key: number]: any}>({});

  // Handler for saving changes (would call API)
  const handleSaveSettings = (gameId: number) => {
    console.log(`Save settings for game ${gameId}:`, editedSettings[gameId]);
    // Call API to save settings
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

  // Get current setting value (edited or original)
  const getSettingValue = (game: any, field: string) => {
    if (editedSettings[game.id] && editedSettings[game.id][field] !== undefined) {
      return editedSettings[game.id][field];
    }
    return game.settings[field];
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Game Settings</CardTitle>
          <CardDescription>
            Configure game parameters, betting limits, and house edge
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {gameData.map((game) => (
              <div key={game.id} className="p-6 border rounded-lg mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold">{game.name}</h3>
                  <div className="flex items-center space-x-2">
                    <Label htmlFor={`enable-${game.id}`}>Enabled</Label>
                    <Switch 
                      id={`enable-${game.id}`} 
                      checked={getSettingValue(game, 'isEnabled')}
                      onCheckedChange={(checked) => updateSetting(game.id, 'isEnabled', checked)}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor={`minBet-${game.id}`}>Minimum Bet</Label>
                    <Input 
                      id={`minBet-${game.id}`}
                      type="number"
                      min="0"
                      value={getSettingValue(game, 'minBet')}
                      onChange={(e) => updateSetting(game.id, 'minBet', parseFloat(e.target.value))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor={`maxBet-${game.id}`}>Maximum Bet</Label>
                    <Input 
                      id={`maxBet-${game.id}`}
                      type="number"
                      min="0"
                      value={getSettingValue(game, 'maxBet')}
                      onChange={(e) => updateSetting(game.id, 'maxBet', parseFloat(e.target.value))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor={`maxWin-${game.id}`}>Maximum Win</Label>
                    <Input 
                      id={`maxWin-${game.id}`}
                      type="number"
                      min="0"
                      value={getSettingValue(game, 'maxWin')}
                      onChange={(e) => updateSetting(game.id, 'maxWin', parseFloat(e.target.value))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor={`houseEdge-${game.id}`}>House Edge (%)</Label>
                    <Input 
                      id={`houseEdge-${game.id}`}
                      type="number"
                      min="0"
                      max="50"
                      step="0.1"
                      value={getSettingValue(game, 'houseEdge') * 100}
                      onChange={(e) => updateSetting(game.id, 'houseEdge', parseFloat(e.target.value) / 100)}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end mt-4">
                  <Button
                    onClick={() => handleSaveSettings(game.id)}
                    disabled={!editedSettings[game.id]}
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Analytics Dashboard Component
function AnalyticsDashboard() {
  // State for date range selection
  const [dateRange, setDateRange] = useState("last7days");

  // Mock analytics data
  const dailyData = [
    { date: "Aug 9", users: 345, bets: 2453, wagered: 12450, profit: 423 },
    { date: "Aug 10", users: 389, bets: 2367, wagered: 13800, profit: 455 },
    { date: "Aug 11", users: 483, bets: 3290, wagered: 16750, profit: 589 },
    { date: "Aug 12", users: 562, bets: 3812, wagered: 19320, profit: 722 },
    { date: "Aug 13", users: 689, bets: 4521, wagered: 22680, profit: 834 },
    { date: "Aug 14", users: 782, bets: 5324, wagered: 26950, profit: 971 },
    { date: "Aug 15", users: 724, bets: 4928, wagered: 23780, profit: 829 }
  ];

  // Mock game breakdown data
  const gameBreakdown = [
    { game: "Slots", bets: 9876, wagered: 49380, profit: 1728 },
    { game: "Roulette", bets: 7624, wagered: 38120, profit: 1029 },
    { game: "Dice", bets: 5843, wagered: 29215, profit: 438 },
    { game: "Crash", bets: 8342, wagered: 41710, profit: 1251 }
  ];

  // Mock user metrics
  const userMetrics = {
    totalUsers: 3721,
    newUsers: 124,
    activeUsers: 1259,
    averageSessionTime: "18 mins",
    returningUsers: "32%"
  };

  // Mock financial metrics
  const financialMetrics = {
    totalWagered: "$135,730",
    totalProfitLoss: "$4,823",
    houseEdge: "3.55%",
    averageBetSize: "$21.36"
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
        <Select 
          value={dateRange}
          onValueChange={setDateRange}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select date range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="yesterday">Yesterday</SelectItem>
            <SelectItem value="last7days">Last 7 days</SelectItem>
            <SelectItem value="last30days">Last 30 days</SelectItem>
            <SelectItem value="thisMonth">This month</SelectItem>
            <SelectItem value="lastMonth">Last month</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Wagered
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{financialMetrics.totalWagered}</div>
            <p className="text-xs text-muted-foreground">
              During selected period
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              House Profit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{financialMetrics.totalProfitLoss}</div>
            <p className="text-xs text-muted-foreground">
              {financialMetrics.houseEdge} effective house edge
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Active Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userMetrics.activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              {userMetrics.newUsers} new registrations
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Bets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dailyData.reduce((total, day) => total + day.bets, 0)}</div>
            <p className="text-xs text-muted-foreground">
              Avg. {financialMetrics.averageBetSize} per bet
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Time series charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Daily Activity</CardTitle>
            <CardDescription>
              User activity and bets over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="users" 
                  stroke="#8884d8" 
                  name="Active Users" 
                  strokeWidth={2} 
                />
                <Line 
                  type="monotone" 
                  dataKey="bets" 
                  stroke="#82ca9d" 
                  name="Total Bets" 
                  strokeWidth={2} 
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Financial Performance</CardTitle>
            <CardDescription>
              Amount wagered and profit over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="wagered" 
                  stroke="#ff9800" 
                  yAxisId="left"
                  name="Amount Wagered" 
                  strokeWidth={2} 
                />
                <Line 
                  type="monotone" 
                  dataKey="profit" 
                  stroke="#f44336" 
                  yAxisId="right"
                  name="House Profit" 
                  strokeWidth={2} 
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Game breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Game Performance</CardTitle>
          <CardDescription>
            Breakdown of activity and profit by game
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={gameBreakdown}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="game" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Bar yAxisId="left" dataKey="bets" fill="#8884d8" name="Number of Bets" />
              <Bar yAxisId="right" dataKey="profit" fill="#f44336" name="Profit" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Detailed metrics table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Game Metrics</CardTitle>
          <CardDescription>
            Complete breakdown of all games and performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Game</TableHead>
                <TableHead className="text-right">Total Bets</TableHead>
                <TableHead className="text-right">Amount Wagered</TableHead>
                <TableHead className="text-right">House Profit</TableHead>
                <TableHead className="text-right">Effective RTP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {gameBreakdown.map((game) => (
                <TableRow key={game.game}>
                  <TableCell className="font-medium">{game.game}</TableCell>
                  <TableCell className="text-right">{game.bets.toLocaleString()}</TableCell>
                  <TableCell className="text-right">${game.wagered.toLocaleString()}</TableCell>
                  <TableCell className="text-right">${game.profit.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    {(100 - (game.profit / game.wagered * 100)).toFixed(2)}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableCaption>
              Data for period: {dateRange === "last7days" ? "Last 7 days" : dateRange}
            </TableCaption>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}