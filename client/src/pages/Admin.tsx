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