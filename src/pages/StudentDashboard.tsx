import FloatingShield from "@/components/3d/FloatingShield";
import ThreeDBackground from "@/components/3d/ThreeDBackground";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { useTest } from "@/context/TestContext";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  Award,
  BarChart3,
  Bell,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  History,
  LogOut,
  Play,
  Settings,
  Shield,
  Target,
  TrendingUp,
  Trophy,
  User
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const { tests } = useTest();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("available");
  const [showNotifications, setShowNotifications] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!user || user.role !== "student") {
      navigate("/login");
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  // Get only published tests that students can take
  const availableTests = tests.filter(test => test.status === "published");
  const completedTests = tests.filter(test => test.status === "completed");

  // Mock data for enhanced features
  const studentStats = {
    testsCompleted: completedTests.length,
    averageScore: 85,
    currentStreak: 5,
    totalScore: completedTests.length * 85,
    rank: 12,
    totalStudents: 150,
  };

  const recentActivity = [
    { id: 1, action: "Completed", test: "Mathematics Mid-term", score: 92, date: "2 hours ago", color: "text-green-500" },
    { id: 2, action: "Started", test: "Physics Quiz", score: null, date: "5 hours ago", color: "text-blue-500" },
    { id: 3, action: "Completed", test: "Chemistry Lab Test", score: 88, date: "1 day ago", color: "text-green-500" },
  ];

  const upcomingDeadlines = [
    { id: 1, test: "Computer Science Final", date: "Dec 25, 2024", daysLeft: 3 },
    { id: 2, test: "English Literature Essay", date: "Dec 28, 2024", daysLeft: 6 },
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-6">
      <ThreeDBackground />
      
      {/* Top Navigation */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex justify-between items-center mb-8 relative z-10"
      >
        <div className="flex items-center gap-3">
          <motion.div 
            className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg"
            whileHover={{ scale: 1.05, rotate: 5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Shield className="h-7 w-7 text-white" />
          </motion.div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Student Portal
            </h1>
            <p className="text-sm text-muted-foreground">Welcome back, {user.name.split(" ")[0]}!</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button 
              variant="outline" 
              size="icon"
              className="relative"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                2
              </span>
            </Button>
          </motion.div>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button variant="outline" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </motion.div>

          <Button variant="ghost" onClick={handleLogout} className="flex items-center gap-2">
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </motion.div>

      {/* Notifications Dropdown */}
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
              {upcomingDeadlines.map((deadline) => (
                <div key={deadline.id} className="p-3 border-b hover:bg-muted/50">
                  <p className="text-sm font-medium">{deadline.test}</p>
                  <p className="text-xs text-muted-foreground">Due: {deadline.date}</p>
                  <Badge variant="secondary" className="mt-1 text-xs">
                    {deadline.daysLeft} days left
                  </Badge>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          whileHover={{ scale: 1.02 }}
        >
          <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20 hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-blue-500/20">
                  <Trophy className="h-6 w-6 text-blue-500" />
                </div>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </div>
              <p className="text-sm text-muted-foreground mb-1">Tests Completed</p>
              <h3 className="text-3xl font-bold">{studentStats.testsCompleted}</h3>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          whileHover={{ scale: 1.02 }}
        >
          <Card className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/20 hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-emerald-500/20">
                  <Target className="h-6 w-6 text-emerald-500" />
                </div>
                <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500">
                  +5%
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-1">Average Score</p>
              <h3 className="text-3xl font-bold">{studentStats.averageScore}%</h3>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          whileHover={{ scale: 1.02 }}
        >
          <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20 hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-purple-500/20">
                  <Award className="h-6 w-6 text-purple-500" />
                </div>
                <Badge variant="secondary" className="bg-purple-500/10 text-purple-500">
                  Top 10%
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-1">Class Rank</p>
              <h3 className="text-3xl font-bold">#{studentStats.rank}</h3>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          whileHover={{ scale: 1.02 }}
        >
          <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/20 hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-orange-500/20">
                  <Calendar className="h-6 w-6 text-orange-500" />
                </div>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </div>
              <p className="text-sm text-muted-foreground mb-1">Current Streak</p>
              <h3 className="text-3xl font-bold">{studentStats.currentStreak} days</h3>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
        {/* Left Column - Profile & Quick Stats */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7 }}
          className="lg:col-span-1 space-y-6"
        >
          <Card className="bg-card/95 backdrop-blur-md border-primary/20 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Student Profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center mb-6">
                <motion.div 
                  className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mb-4 shadow-lg"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="text-3xl font-bold text-white">
                    {user.name.split(" ").map(n => n[0]).join("")}
                  </div>
                </motion.div>
                <h3 className="text-xl font-semibold">{user.name}</h3>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                <Badge variant="secondary" className="mt-2">
                  {user.course || "Computer Science"}
                </Badge>
              </div>
              
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Performance</span>
                    <span className="text-sm text-primary font-semibold">{studentStats.averageScore}%</span>
                  </div>
                  <Progress value={studentStats.averageScore} className="h-2" />
                </div>

                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Completion Rate</span>
                    <span className="text-sm text-primary font-semibold">92%</span>
                  </div>
                  <Progress value={92} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/95 backdrop-blur-md border-primary/20 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className={`p-2 rounded-full ${activity.score ? 'bg-green-500/10' : 'bg-blue-500/10'}`}>
                      {activity.score ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <Play className="h-4 w-4 text-blue-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{activity.test}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs ${activity.color}`}>{activity.action}</span>
                        {activity.score && (
                          <Badge variant="secondary" className="text-xs">
                            {activity.score}%
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{activity.date}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/95 backdrop-blur-md border-primary/20 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Security Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">Identity Verified</span>
                  </div>
                  <Badge variant="secondary" className="bg-green-500/10 text-green-500">Active</Badge>
                </div>
                <p className="text-xs text-muted-foreground px-3">
                  Your exam environment is secure. The system will monitor your activity during tests to ensure academic integrity.
                </p>
              </div>
              <div className="w-full h-32 mt-4">
                <FloatingShield />
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        {/* Right Column - Tests & Performance */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8 }}
          className="lg:col-span-2"
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-muted/50 h-12">
              <TabsTrigger value="available" className="data-[state=active]:bg-background">
                <BookOpen className="h-4 w-4 mr-2" />
                Available ({availableTests.length})
              </TabsTrigger>
              <TabsTrigger value="completed" className="data-[state=active]:bg-background">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Completed ({completedTests.length})
              </TabsTrigger>
              <TabsTrigger value="analytics" className="data-[state=active]:bg-background">
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </TabsTrigger>
            </TabsList>

            <TabsContent value="available" className="mt-6">
              <Card className="bg-card/95 backdrop-blur-md border-primary/20">
                <CardHeader>
                  <CardTitle>Available Tests</CardTitle>
                  <CardDescription>Start any test to begin your examination</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {availableTests.length > 0 ? (
                      availableTests.map((test, index) => (
                        <motion.div
                          key={test.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          whileHover={{ scale: 1.02, x: 5 }}
                          className="group relative p-5 rounded-xl bg-gradient-to-r from-accent to-accent/50 hover:from-primary/10 hover:to-primary/5 border border-primary/10 hover:border-primary/30 transition-all cursor-pointer"
                          onClick={() => navigate(`/take-test/${test.id}`)}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <FileText className="h-5 w-5 text-primary" />
                                <h4 className="text-lg font-semibold group-hover:text-primary transition-colors">
                                  {test.title}
                                </h4>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {test.subject} • {test.questions.length} Questions
                              </p>
                            </div>
                            <Badge variant="secondary" className="bg-primary/10 text-primary">
                              <Clock className="h-3 w-3 mr-1" />
                              {test.duration} min
                            </Badge>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Target className="h-4 w-4" />
                                {test.totalMarks || test.questions.length * 4} marks
                              </span>
                            </div>
                            <Button 
                              size="sm" 
                              className="group-hover:bg-primary group-hover:text-white transition-all"
                            >
                              Start Test
                              <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </Button>
                          </div>

                          <motion.div
                            className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                            initial={{ x: "-100%" }}
                            whileHover={{ x: "100%" }}
                            transition={{ duration: 0.8 }}
                          />
                        </motion.div>
                      ))
                    ) : (
                      <div className="text-center py-16">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 200 }}
                          className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4"
                        >
                          <AlertCircle className="h-8 w-8 text-muted-foreground" />
                        </motion.div>
                        <h3 className="text-xl font-medium mb-2">No tests available</h3>
                        <p className="text-muted-foreground">
                          There are no tests available for you at the moment.
                          Check back later or contact your instructor.
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="completed" className="mt-6">
              <Card className="bg-card/95 backdrop-blur-md border-primary/20">
                <CardHeader>
                  <CardTitle>Completed Tests</CardTitle>
                  <CardDescription>View your past test results and performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {completedTests.length > 0 ? (
                      completedTests.map((test, index) => (
                        <motion.div
                          key={test.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="p-5 rounded-xl bg-gradient-to-r from-accent to-accent/50 border border-primary/10"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                                <h4 className="text-lg font-semibold">{test.title}</h4>
                              </div>
                              <p className="text-sm text-muted-foreground mb-3">
                                {test.subject} • Completed on {new Date().toLocaleDateString()}
                              </p>
                              <div className="flex items-center gap-4">
                                <Badge variant="secondary" className="bg-green-500/10 text-green-500">
                                  Score: 85%
                                </Badge>
                                <Badge variant="outline">
                                  {test.questions.length} Questions
                                </Badge>
                              </div>
                            </div>
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="text-center py-16">
                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                          <FileText className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-xl font-medium mb-2">No completed tests</h3>
                        <p className="text-muted-foreground">
                          You haven't completed any tests yet.
                          Start with available tests to see your results here.
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="mt-6">
              <Card className="bg-card/95 backdrop-blur-md border-primary/20">
                <CardHeader>
                  <CardTitle>Performance Analytics</CardTitle>
                  <CardDescription>Track your progress and improvement over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
                        <p className="text-sm text-muted-foreground mb-2">Total Tests</p>
                        <p className="text-3xl font-bold">{studentStats.testsCompleted}</p>
                      </div>
                      <div className="p-4 rounded-lg bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
                        <p className="text-sm text-muted-foreground mb-2">Average Score</p>
                        <p className="text-3xl font-bold">{studentStats.averageScore}%</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Mathematics</span>
                          <span className="text-sm text-primary">92%</span>
                        </div>
                        <Progress value={92} className="h-2" />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Physics</span>
                          <span className="text-sm text-primary">85%</span>
                        </div>
                        <Progress value={85} className="h-2" />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Chemistry</span>
                          <span className="text-sm text-primary">88%</span>
                        </div>
                        <Progress value={88} className="h-2" />
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <h4 className="font-semibold mb-4 flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-green-500" />
                        Performance Trend
                      </h4>
                      <div className="text-center py-8 bg-muted/30 rounded-lg">
                        <p className="text-sm text-muted-foreground">
                          Your performance has improved by <span className="text-green-500 font-semibold">15%</span> in the last month!
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
};

export default StudentDashboard;
