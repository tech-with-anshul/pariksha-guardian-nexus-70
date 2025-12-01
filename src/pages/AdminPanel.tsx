import MaintenanceModeDialog from "@/components/admin/MaintenanceModeDialog";
import StatsCard from "@/components/admin/StatsCard";
import UserForm, { UserFormData } from "@/components/admin/UserForm";
import UserTable from "@/components/admin/UserTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { useAuth, User, UserRole } from "@/context/AuthContext";
import { useMaintenance } from "@/context/MaintenanceContext";
import { AnimatePresence, motion } from "framer-motion";
import { Activity, AlertTriangle, Bell, ChevronRight, Database, Download, FileText, Filter, Layout, RefreshCw, Search, Settings, Shield, TrendingUp, UserPlus, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const AdminPanel = () => {
  const [activeMainTab, setActiveMainTab] = useState("dashboard");
  const [activeUserTab, setActiveUserTab] = useState("faculty");
  const [facultyList, setFacultyList] = useState<User[]>([]);
  const [studentsList, setStudentsList] = useState<User[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [activityLogs, setActivityLogs] = useState<string[]>([
    "Admin logged in at 09:23 AM",
    "New faculty member added at 10:15 AM",
    "Student record updated at 11:30 AM",
    "System backup completed at 12:00 PM",
  ]);
  const [systemHealth, setSystemHealth] = useState({
    cpu: 45,
    memory: 62,
    storage: 38,
    database: "healthy"
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, message: "New faculty member registered", time: "2 min ago", unread: true },
    { id: 2, message: "System backup completed", time: "1 hour ago", unread: true },
    { id: 3, message: "Test results published", time: "3 hours ago", unread: false },
  ]);
  const [showMaintenanceDialog, setShowMaintenanceDialog] = useState(false);
  const { isMaintenanceMode, enableMaintenanceMode, disableMaintenanceMode } = useMaintenance();
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, getUsers, addUser, updateUser, deleteUser } = useAuth();

  // Load users on mount
  useEffect(() => {
    const loadUsers = async () => {
      if (user && (user.role === "admin" || (user.role === "faculty" && user.permissions?.includes("manage_users")))) {
        const facultyData = await getUsers("faculty");
        const studentsData = await getUsers("student");
        setFacultyList(facultyData);
        setStudentsList(studentsData);
      }
    };
    
    loadUsers();
  }, [user, getUsers]);

  // Check if user is authenticated and has admin role
  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    
    // Check if user has permissions to access admin panel
    const hasAdminAccess = user.role === "admin" || 
      (user.role === "faculty" && user.permissions?.includes("manage_users"));
      
    if (!hasAdminAccess) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access the admin panel",
        variant: "destructive",
      });
      navigate(user.role === "faculty" ? "/faculty-dashboard" : "/student-dashboard");
    }
  }, [user, navigate, toast]);

  if (!user) {
    return null;
  }

  // Filter users based on search and filters
  const filteredFaculty = facultyList.filter(faculty => {
    const matchesSearch = faculty.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faculty.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faculty.erpId?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = filterDepartment === "all" || faculty.department === filterDepartment;
    return matchesSearch && matchesDepartment;
  });

  const filteredStudents = studentsList.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.erpId?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Get unique departments
  const departments = Array.from(new Set(facultyList.map(f => f.department).filter(Boolean)));

  const handleExportUsers = () => {
    const currentList = activeUserTab === "faculty" ? filteredFaculty : filteredStudents;
    const csv = [
      ['Name', 'Email', 'ERP ID', activeUserTab === "faculty" ? 'Department' : 'Course'].join(','),
      ...currentList.map(u => [
        u.name,
        u.email,
        u.erpId || '',
        activeUserTab === "faculty" ? u.department || '' : u.course || ''
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeUserTab}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    
    toast({
      title: "Export Successful",
      description: `${currentList.length} ${activeUserTab} exported to CSV`,
    });
    addActivityLog(`Exported ${activeUserTab} data`);
  };

  const handleBulkDelete = async () => {
    if (selectedUsers.length === 0) return;
    
    try {
      for (const userId of selectedUsers) {
        await deleteUser(userId);
      }
      
      const facultyData = await getUsers("faculty");
      const studentsData = await getUsers("student");
      setFacultyList(facultyData);
      setStudentsList(studentsData);
      setSelectedUsers([]);
      
      toast({
        title: "Success",
        description: `${selectedUsers.length} users deleted successfully`,
      });
      addActivityLog(`Bulk deleted ${selectedUsers.length} users`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete some users",
        variant: "destructive",
      });
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleAddUser = async (userData: UserFormData) => {
    const role = activeUserTab === "faculty" ? "faculty" as UserRole : "student" as UserRole;
    
    if (!userData.name || !userData.email || !userData.password) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const newUserData = {
        name: userData.name,
        email: userData.email,
        role: role,
        erpId: userData.erpId,
        password: userData.password,
        permissions: userData.permissions,
        [role === "faculty" ? "department" : "course"]: role === "faculty" ? userData.department : userData.course,
      };
      
      const success = await addUser(newUserData);
      
      if (success) {
        // Refresh user lists
        const facultyData = await getUsers("faculty");
        const studentsData = await getUsers("student");
        setFacultyList(facultyData);
        setStudentsList(studentsData);
        
        toast({
          title: "Success",
          description: `New ${role} added successfully`,
        });
        
        addActivityLog(`Added ${role}: ${userData.name}`);
        setIsDialogOpen(false);
      } else {
        toast({
          title: "Error",
          description: "Failed to add user. Email or ERP ID may already exist.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error adding user:", error);
      toast({
        title: "Error",
        description: "Failed to add user. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsDialogOpen(true);
  };

  const handleUpdateUser = async (userData: UserFormData) => {
    if (!editingUser) return;
    
    const role = editingUser.id.startsWith("f") ? "faculty" as UserRole : "student" as UserRole;
    
    // Only send password if it's provided (not empty)
    const updateData: Partial<User> & { password?: string } = {
      name: userData.name,
      email: userData.email,
      erpId: userData.erpId,
      permissions: userData.permissions,
      [role === "faculty" ? "department" : "course"]: 
        role === "faculty" ? userData.department : userData.course,
    };
    
    if (userData.password) {
      updateData.password = userData.password;
    }
    
    try {
      const success = await updateUser(editingUser.id, updateData);
      
      if (success) {
        // Refresh user lists
        const facultyData = await getUsers("faculty");
        const studentsData = await getUsers("student");
        setFacultyList(facultyData);
        setStudentsList(studentsData);
        
        toast({
          title: "Success",
          description: `${role === "faculty" ? "Faculty" : "Student"} updated successfully`,
        });
        
        addActivityLog(`Updated ${role}: ${userData.name}`);
        setEditingUser(null);
        setIsDialogOpen(false);
      } else {
        toast({
          title: "Error",
          description: "Failed to update user",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while updating the user",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (id: string, role: UserRole) => {
    const userToDelete = role === "faculty" 
      ? facultyList.find(f => f.id === id)
      : studentsList.find(s => s.id === id);
    
    if (!userToDelete) return;
    
    try {
      const success = await deleteUser(id);
      
      if (success) {
        // Refresh user lists
        const facultyData = await getUsers("faculty");
        const studentsData = await getUsers("student");
        setFacultyList(facultyData);
        setStudentsList(studentsData);
        
        toast({
          title: "Success",
          description: `${role === "faculty" ? "Faculty" : "Student"} deleted successfully`,
        });
        
        addActivityLog(`Deleted ${role}: ${userToDelete.name}`);
      } else {
        toast({
          title: "Error",
          description: "Failed to delete user",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while deleting the user",
        variant: "destructive",
      });
    }
  };

  const addActivityLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setActivityLogs((prev) => [`${message} at ${timestamp}`, ...prev.slice(0, 9)]);
  };

  const handleDialogClose = () => {
    setEditingUser(null);
    setIsDialogOpen(false);
  };

  const handleMainTabChange = (value: string) => {
    setActiveMainTab(value);
    addActivityLog(`Navigated to ${value} section`);
  };

  // Simulate real-time system health updates
  useEffect(() => {
    const interval = setInterval(() => {
      setSystemHealth(prev => ({
        cpu: Math.min(100, Math.max(0, prev.cpu + (Math.random() * 10 - 5))),
        memory: Math.min(100, Math.max(0, prev.memory + (Math.random() * 10 - 5))),
        storage: Math.min(100, Math.max(0, prev.storage + (Math.random() * 2 - 1))),
        database: prev.database
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    const facultyData = await getUsers("faculty");
    const studentsData = await getUsers("student");
    setFacultyList(facultyData);
    setStudentsList(studentsData);
    
    toast({
      title: "Refreshed",
      description: "User data updated successfully",
    });
    
    addActivityLog("Refreshed user data");
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const markNotificationAsRead = (id: number) => {
    setNotifications(prev => 
      prev.map(notif => notif.id === id ? { ...notif, unread: false } : notif)
    );
  };

  const unreadCount = notifications.filter(n => n.unread).length;

  const handleEnableMaintenanceMode = (message: string, estimatedEndTime?: string) => {
    enableMaintenanceMode(message, estimatedEndTime);
    toast({
      title: "Maintenance Mode Enabled",
      description: "System is now in maintenance mode",
      variant: "default",
    });
    addActivityLog("Enabled maintenance mode");
  };

  const handleDisableMaintenanceMode = () => {
    disableMaintenanceMode();
    toast({
      title: "Maintenance Mode Disabled",
      description: "System is now accessible to all users",
    });
    addActivityLog("Disabled maintenance mode");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Maintenance Mode Banner */}
          {isMaintenanceMode && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 bg-yellow-500/10 border-2 border-yellow-500/30 rounded-lg p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  <div>
                    <h3 className="font-semibold text-yellow-700 dark:text-yellow-500">
                      Maintenance Mode Active
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      System is currently in maintenance mode. Only admins can access the panel.
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDisableMaintenanceMode}
                  className="border-yellow-500/30 hover:bg-yellow-500/10"
                >
                  Disable
                </Button>
              </div>
            </motion.div>
          )}

          <div className="flex items-center justify-between mb-8">
            <motion.div 
              className="flex items-center gap-2"
              initial={{ x: -20 }}
              animate={{ x: 0 }}
            >
              <div className="relative">
                <Layout className="h-8 w-8 text-primary" />
                <motion.div
                  className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Admin Panel
              </h1>
              <Badge variant="secondary" className="ml-2">v2.0</Badge>
            </motion.div>
            <div className="flex gap-2">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  variant="outline" 
                  size="icon"
                  className="relative"
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              </motion.div>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="absolute right-6 top-20 w-80 bg-card border rounded-lg shadow-xl z-50"
                  >
                    <div className="p-4 border-b">
                      <h3 className="font-semibold">Notifications</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.map((notif) => (
                        <motion.div
                          key={notif.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={`p-3 border-b hover:bg-muted/50 cursor-pointer ${notif.unread ? 'bg-primary/5' : ''}`}
                          onClick={() => markNotificationAsRead(notif.id)}
                        >
                          <div className="flex items-start justify-between">
                            <p className="text-sm flex-1">{notif.message}</p>
                            {notif.unread && (
                              <div className="h-2 w-2 bg-primary rounded-full mt-1" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{notif.time}</p>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </Button>
              </motion.div>

              <Button variant="outline" onClick={() => navigate(user.role === "admin" ? "/" : "/faculty-dashboard")}>
                Back to {user.role === "admin" ? "Home" : "Dashboard"}
              </Button>
            </div>
          </div>
          
          <Tabs value={activeMainTab} onValueChange={handleMainTabChange} className="w-full">
            <TabsList className="mb-6 bg-muted/50 p-1">
              <TabsTrigger value="dashboard" className="data-[state=active]:bg-background">
                <TrendingUp className="h-4 w-4 mr-2" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="users" className="data-[state=active]:bg-background">
                <Users className="h-4 w-4 mr-2" />
                Users
              </TabsTrigger>
              <TabsTrigger value="settings" className="data-[state=active]:bg-background">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </TabsTrigger>
              <TabsTrigger value="security" className="data-[state=active]:bg-background">
                <Shield className="h-4 w-4 mr-2" />
                Security
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
                  <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
                    <StatsCard 
                      title="Total Faculty" 
                      value={facultyList.length} 
                      icon={<Users className="h-8 w-8" />}
                      trend="+12%"
                      trendUp={true}
                    />
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
                    <StatsCard 
                      title="Total Students" 
                      value={studentsList.length} 
                      icon={<Users className="h-8 w-8" />}
                      trend="+8%"
                      trendUp={true}
                    />
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
                    <StatsCard 
                      title="Active Tests" 
                      value="3" 
                      icon={<FileText className="h-8 w-8" />}
                      trend="+2"
                      trendUp={true}
                    />
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
                    <StatsCard 
                      title="System Health" 
                      value="Good" 
                      icon={<Activity className="h-8 w-8" />}
                      trend="Optimal"
                      trendUp={true}
                    />
                  </motion.div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card className="lg:col-span-2 hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5 text-primary" />
                        System Overview
                      </CardTitle>
                      <CardDescription>Real-time system performance metrics</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 }}
                        >
                          <div className="flex justify-between mb-2">
                            <span className="text-sm font-medium">CPU Usage</span>
                            <span className="text-sm text-muted-foreground">{systemHealth.cpu.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                            <motion.div 
                              className="bg-primary rounded-full h-2" 
                              initial={{ width: 0 }}
                              animate={{ width: `${systemHealth.cpu}%` }}
                              transition={{ duration: 0.5 }}
                            />
                          </div>
                        </motion.div>
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.2 }}
                        >
                          <div className="flex justify-between mb-2">
                            <span className="text-sm font-medium">Memory Usage</span>
                            <span className="text-sm text-muted-foreground">{systemHealth.memory.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                            <motion.div 
                              className="bg-blue-500 rounded-full h-2" 
                              initial={{ width: 0 }}
                              animate={{ width: `${systemHealth.memory}%` }}
                              transition={{ duration: 0.5 }}
                            />
                          </div>
                        </motion.div>
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 }}
                        >
                          <div className="flex justify-between mb-2">
                            <span className="text-sm font-medium">Storage Usage</span>
                            <span className="text-sm text-muted-foreground">{systemHealth.storage.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                            <motion.div 
                              className="bg-green-500 rounded-full h-2" 
                              initial={{ width: 0 }}
                              animate={{ width: `${systemHealth.storage}%` }}
                              transition={{ duration: 0.5 }}
                            />
                          </div>
                        </motion.div>
                        <div className="flex items-center justify-between pt-4 border-t">
                          <div className="flex items-center gap-2">
                            <Database className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Database Status</span>
                          </div>
                          <Badge variant="secondary" className="bg-green-500/10 text-green-500">
                            {systemHealth.database}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle>Quick Actions</CardTitle>
                      <CardDescription>Common administrative tasks</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <motion.div whileHover={{ x: 5 }} transition={{ type: "spring", stiffness: 300 }}>
                        <Button 
                          className="w-full justify-between group" 
                          variant="outline" 
                          onClick={() => setActiveMainTab("users")}
                        >
                          <span className="flex items-center">
                            <UserPlus className="mr-2 h-4 w-4" />
                            Add New User
                          </span>
                          <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </motion.div>
                      <motion.div whileHover={{ x: 5 }} transition={{ type: "spring", stiffness: 300 }}>
                        <Button 
                          className="w-full justify-between group" 
                          variant="outline" 
                          onClick={handleExportUsers}
                        >
                          <span className="flex items-center">
                            <Download className="mr-2 h-4 w-4" />
                            Export Reports
                          </span>
                          <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </motion.div>
                      <motion.div whileHover={{ x: 5 }} transition={{ type: "spring", stiffness: 300 }}>
                        <Button className="w-full justify-between group" variant="outline">
                          <span className="flex items-center">
                            <FileText className="mr-2 h-4 w-4" />
                            Create Test
                          </span>
                          <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </motion.div>
                      <motion.div whileHover={{ x: 5 }} transition={{ type: "spring", stiffness: 300 }}>
                        <Button 
                          className="w-full justify-between group" 
                          variant="outline" 
                          onClick={() => setActiveMainTab("settings")}
                        >
                          <span className="flex items-center">
                            <Settings className="mr-2 h-4 w-4" />
                            System Settings
                          </span>
                          <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </motion.div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="mt-6 hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-primary" />
                      Recent Activity
                    </CardTitle>
                    <CardDescription>Latest system events and user actions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <AnimatePresence>
                        {activityLogs.slice(0, 5).map((log, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-start gap-3 p-3 border-l-4 border-primary/30 bg-muted/30 rounded hover:bg-muted/50 transition-colors"
                          >
                            <Activity className="h-4 w-4 mt-0.5 text-primary" />
                            <span className="text-sm flex-1">{log}</span>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="users">
              <Card className="mb-6">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Manage Users</CardTitle>
                      <CardDescription>
                        Add, edit, or remove faculty and students from the system
                      </CardDescription>
                    </div>
                    {selectedUsers.length > 0 && (
                      <Badge variant="secondary">
                        {selectedUsers.length} selected
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search users by name, email, or ERP ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    {activeUserTab === "faculty" && (
                      <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                        <SelectTrigger className="w-full sm:w-[200px]">
                          <Filter className="h-4 w-4 mr-2" />
                          <SelectValue placeholder="Filter by department" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Departments</SelectItem>
                          {departments.map(dept => (
                            <SelectItem key={dept} value={dept || ""}>{dept}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <Button onClick={handleExportUsers} variant="outline">
                      <Download className="mr-2 h-4 w-4" />
                      Export
                    </Button>
                  </div>

                  {selectedUsers.length > 0 && (
                    <div className="flex gap-2 mb-4">
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={handleBulkDelete}
                      >
                        Delete Selected ({selectedUsers.length})
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedUsers([])}
                      >
                        Clear Selection
                      </Button>
                    </div>
                  )}

                  <Tabs 
                    value={activeUserTab} 
                    onValueChange={setActiveUserTab}
                    className="w-full"
                  >
                    <div className="flex justify-between items-center mb-6">
                      <TabsList>
                        <TabsTrigger value="faculty">
                          Faculty ({filteredFaculty.length})
                        </TabsTrigger>
                        <TabsTrigger value="students">
                          Students ({filteredStudents.length})
                        </TabsTrigger>
                      </TabsList>
                      
                      <Button onClick={() => setIsDialogOpen(true)}>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Add {activeUserTab === "faculty" ? "Faculty" : "Student"}
                      </Button>
                    </div>
                    
                    <TabsContent value="faculty">
                      <Card>
                        <CardContent className="p-0">
                          <UserTable 
                            users={filteredFaculty}
                            role="faculty"
                            onEdit={handleEditUser}
                            onDelete={handleDeleteUser}
                            selectedUsers={selectedUsers}
                            onToggleSelect={toggleUserSelection}
                          />
                        </CardContent>
                      </Card>
                    </TabsContent>
                    
                    <TabsContent value="students">
                      <Card>
                        <CardContent className="p-0">
                          <UserTable 
                            users={filteredStudents}
                            role="student"
                            onEdit={handleEditUser}
                            onDelete={handleDeleteUser}
                            selectedUsers={selectedUsers}
                            onToggleSelect={toggleUserSelection}
                          />
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>General Settings</CardTitle>
                    <CardDescription>Configure system-wide settings</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <label className="text-sm font-medium">Email Notifications</label>
                        <p className="text-sm text-muted-foreground">Send email alerts for important events</p>
                      </div>
                      <Checkbox defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <label className="text-sm font-medium">Auto Backup</label>
                        <p className="text-sm text-muted-foreground">Automatically backup data daily</p>
                      </div>
                      <Checkbox defaultChecked />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-yellow-500/20">
                      <div className="space-y-0.5 flex-1">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                          <label className="text-sm font-medium">Maintenance Mode</label>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Enable system maintenance mode for all users
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {isMaintenanceMode && (
                          <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500">
                            Active
                          </Badge>
                        )}
                        <Button
                          size="sm"
                          variant={isMaintenanceMode ? "destructive" : "default"}
                          onClick={() => {
                            if (isMaintenanceMode) {
                              handleDisableMaintenanceMode();
                            } else {
                              setShowMaintenanceDialog(true);
                            }
                          }}
                        >
                          {isMaintenanceMode ? "Disable" : "Enable"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Test Configuration</CardTitle>
                    <CardDescription>Default test settings</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Default Test Duration</label>
                      <Select defaultValue="60">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="30">30 minutes</SelectItem>
                          <SelectItem value="60">60 minutes</SelectItem>
                          <SelectItem value="90">90 minutes</SelectItem>
                          <SelectItem value="120">120 minutes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Passing Score</label>
                      <Input type="number" defaultValue="40" min="0" max="100" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Database Management</CardTitle>
                    <CardDescription>Manage system database</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button className="w-full" variant="outline">
                      <Database className="mr-2 h-4 w-4" />
                      Backup Database
                    </Button>
                    <Button className="w-full" variant="outline">
                      <Download className="mr-2 h-4 w-4" />
                      Export Data
                    </Button>
                    <Button className="w-full" variant="destructive">
                      Clear Cache
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Activity Logs</CardTitle>
                    <CardDescription>View system activity history</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {activityLogs.slice(0, 5).map((log, index) => (
                        <div 
                          key={index} 
                          className="text-sm p-2 border-l-4 border-primary/30 pl-3 bg-muted/30"
                        >
                          {log}
                        </div>
                      ))}
                    </div>
                    <Button className="w-full mt-4" variant="outline" size="sm">
                      View All Logs
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="security">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Security Settings</CardTitle>
                    <CardDescription>Configure security and access controls</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <label className="text-sm font-medium">Two-Factor Authentication</label>
                        <p className="text-sm text-muted-foreground">Require 2FA for all users</p>
                      </div>
                      <Checkbox />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <label className="text-sm font-medium">Password Expiry</label>
                        <p className="text-sm text-muted-foreground">Force password change every 90 days</p>
                      </div>
                      <Checkbox defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <label className="text-sm font-medium">Session Timeout</label>
                        <p className="text-sm text-muted-foreground">Auto-logout after inactivity</p>
                      </div>
                      <Checkbox defaultChecked />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Access Logs</CardTitle>
                    <CardDescription>Recent login attempts and activities</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <p className="text-sm font-medium">Successful Login</p>
                          <p className="text-xs text-muted-foreground">admin@example.com</p>
                        </div>
                        <Badge variant="secondary" className="bg-green-500/10 text-green-500">
                          Success
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <p className="text-sm font-medium">Failed Login Attempt</p>
                          <p className="text-xs text-muted-foreground">unknown@example.com</p>
                        </div>
                        <Badge variant="secondary" className="bg-red-500/10 text-red-500">
                          Failed
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {editingUser 
                    ? `Edit ${editingUser.id.startsWith('f') ? 'Faculty' : 'Student'}`
                    : `Add New ${activeUserTab === "faculty" ? "Faculty" : "Student"}`}
                </DialogTitle>
                <DialogDescription>
                  {editingUser
                    ? "Update the details below to modify this user."
                    : "Fill in the details below to add a new user to the system."}
                </DialogDescription>
              </DialogHeader>
              
              <UserForm
                role={editingUser 
                  ? (editingUser.id.startsWith('f') ? "faculty" : "student") as UserRole 
                  : activeUserTab === "faculty" ? "faculty" : "student"}
                onSubmit={editingUser ? handleUpdateUser : handleAddUser}
                onCancel={handleDialogClose}
                editingUser={editingUser}
              />
            </DialogContent>
          </Dialog>

          <MaintenanceModeDialog
            isOpen={showMaintenanceDialog}
            onClose={() => setShowMaintenanceDialog(false)}
            onEnable={handleEnableMaintenanceMode}
          />
        </motion.div>
      </div>
    </div>
  );
};

export default AdminPanel;
