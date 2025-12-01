import ThreeDBackground from "@/components/3d/ThreeDBackground";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { useAuth, UserRole } from "@/context/AuthContext";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, BookOpen, CheckCircle2, Eye, EyeOff, GraduationCap, IdCard, Loader2, Lock, Mail, Shield, Sparkles, TrendingUp, User, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("faculty");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const { toast } = useToast();
  const { login } = useAuth();
  const navigate = useNavigate();

  // Track mouse position for interactive effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!identifier || !password) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields to continue",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const success = await login(identifier, password, role);
      
      if (success) {
        toast({
          title: "Welcome back! 🎉",
          description: `Successfully signed in as ${role}`,
        });
        
        if (role === "faculty") {
          navigate("/faculty-dashboard");
        } else if (role === "student") {
          navigate("/student-dashboard");
        } else if (role === "admin") {
          navigate("/admin");
        }
      } else {
        toast({
          title: "Authentication Failed",
          description: "Invalid credentials. Please check and try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Connection Error",
        description: "Unable to connect. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getPlaceholder = () => {
    if (role === "faculty") return "DBUUF001 or email";
    if (role === "student") return "22BTCSE0200 or email";
    return "admin@pariksha.edu";
  };

  const getCredentialText = () => {
    if (role === "faculty") return "ERP ID or Email";
    if (role === "student") return "ERP ID or Email";
    return "Email Address";
  };

  const getInputIcon = () => {
    if (role === "admin") return <Mail className="h-4 w-4 text-muted-foreground" />;
    return <IdCard className="h-4 w-4 text-muted-foreground" />;
  };

  const getRoleIcon = () => {
    if (role === "faculty") return <User className="h-5 w-5" />;
    if (role === "student") return <GraduationCap className="h-5 w-5" />;
    return <Shield className="h-5 w-5" />;
  };

  const getRoleColor = () => {
    if (role === "faculty") return "from-blue-500 to-cyan-500";
    if (role === "student") return "from-emerald-500 to-teal-500";
    return "from-purple-500 to-pink-500";
  };

  const showDemoCredentials = () => {
    if (role === "faculty") {
      setIdentifier("DBUUF001");
      setPassword("123456");
      toast({
        title: "Demo Credentials Applied",
        description: "ERP ID: DBUUF001, Password: 123456",
      });
    } else if (role === "student") {
      setIdentifier("22BTCSE0200");
      setPassword("24042004");
      toast({
        title: "Demo Credentials Applied",
        description: "ERP ID: 22BTCSE0200, Password: 24042004",
      });
    } else {
      setIdentifier("admin@pariksha.edu");
      setPassword("admin123");
      toast({
        title: "Demo Credentials Applied",
        description: "Email: admin@pariksha.edu, Password: admin123",
      });
    }
  };

  const renderLoginForm = (roleType: UserRole) => (
    <form onSubmit={handleLogin}>
      <CardContent className="space-y-5 pt-4">
        {/* Role indicator with enhanced animation */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, type: "spring" }}
          className={`relative overflow-hidden flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r ${getRoleColor()} bg-opacity-10 border border-primary/20 shadow-lg`}
        >
          <motion.div 
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
          />
          <motion.div 
            className={`relative p-2.5 rounded-xl bg-gradient-to-br ${getRoleColor()} text-white shadow-lg`}
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            {getRoleIcon()}
          </motion.div>
          <div className="relative">
            <p className="text-sm font-semibold capitalize flex items-center gap-2">
              {roleType} Login
              <Sparkles className="h-3 w-3 text-primary animate-pulse" />
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {roleType === "faculty" && "Access exam management & monitoring"}
              {roleType === "student" && "Take exams & view results"}
              {roleType === "admin" && "System administration & settings"}
            </p>
          </div>
        </motion.div>

        {/* Identifier field with enhanced styling */}
        <motion.div 
          className="space-y-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Label htmlFor={`${roleType}-identifier`} className="text-sm font-medium flex items-center gap-2">
            {getCredentialText()}
            <span className="text-xs text-primary">(Required)</span>
          </Label>
          <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 transition-all group-focus-within:text-primary">
              {getInputIcon()}
            </div>
            <Input
              id={`${roleType}-identifier`}
              placeholder={getPlaceholder()}
              type={roleType === "admin" ? "email" : "text"}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              disabled={isLoading}
              required
              className="pl-10 h-12 transition-all focus:ring-2 focus:ring-primary/30 focus:border-primary border-2 group-hover:border-primary/30"
              autoComplete={roleType === "admin" ? "email" : "username"}
            />
          </div>
        </motion.div>

        {/* Password field with enhanced styling */}
        <motion.div 
          className="space-y-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-between">
            <Label htmlFor={`${roleType}-password`} className="text-sm font-medium flex items-center gap-2">
              Password
              <span className="text-xs text-primary">(Required)</span>
            </Label>
            <motion.button 
              type="button"
              className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1 group"
              onClick={(e) => {
                e.preventDefault();
                showDemoCredentials();
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Sparkles className="h-3 w-3 group-hover:animate-spin" />
              Use Demo
            </motion.button>
          </div>
          <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 transition-all group-focus-within:text-primary">
              <Lock className="h-4 w-4 text-muted-foreground" />
            </div>
            <Input
              id={`${roleType}-password`}
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              disabled={isLoading}
              required
              className="pl-10 pr-12 h-12 transition-all focus:ring-2 focus:ring-primary/30 focus:border-primary border-2 group-hover:border-primary/30"
              placeholder="Enter your password"
            />
            <motion.button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors p-1"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </motion.button>
          </div>
        </motion.div>

        {/* Remember me & Forgot password */}
        <motion.div 
          className="flex items-center justify-between"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center space-x-2">
            <Checkbox 
              id={`${roleType}-remember`}
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(checked as boolean)}
              className="border-2"
            />
            <label
              htmlFor={`${roleType}-remember`}
              className="text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none"
            >
              Remember me
            </label>
          </div>
          <motion.button
            type="button"
            className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
            onClick={() => toast({ title: "Password Reset", description: "Contact your administrator to reset password." })}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Forgot password?
          </motion.button>
        </motion.div>
      </CardContent>

      <CardFooter className="flex flex-col gap-4 pb-6">
        <motion.div 
          className="w-full"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button 
            type="submit" 
            className={`w-full h-12 font-semibold bg-gradient-to-r ${getRoleColor()} hover:opacity-90 transition-all shadow-xl shadow-primary/30 relative overflow-hidden group`}
            disabled={isLoading}
          >
            <motion.div
              className="absolute inset-0 bg-white/20"
              initial={{ x: "-100%" }}
              whileHover={{ x: "100%" }}
              transition={{ duration: 0.5 }}
            />
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                {getRoleIcon()}
                <span className="ml-2">Sign in as {roleType}</span>
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </Button>
        </motion.div>
        
        <p className="text-xs text-center text-muted-foreground">
          By signing in, you agree to our{" "}
          <a href="#" className="text-primary hover:underline font-medium">Terms of Service</a>
          {" "}and{" "}
          <a href="#" className="text-primary hover:underline font-medium">Privacy Policy</a>
        </p>
      </CardFooter>
    </form>
  );

  // Stats data
  const stats = [
    { icon: Users, label: "Active Users", value: "5000+", color: "text-blue-500" },
    { icon: BookOpen, label: "Exams Conducted", value: "1250+", color: "text-emerald-500" },
    { icon: TrendingUp, label: "Success Rate", value: "98%", color: "text-purple-500" },
  ];

  const features = [
    "Real-time proctoring & monitoring",
    "Secure exam environment",
    "Automated evaluation system",
    "Advanced analytics & insights",
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 overflow-hidden relative">
      <ThreeDBackground />
      
      {/* Animated gradient orbs */}
      <motion.div
        className="absolute top-20 left-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl"
        animate={{
          x: [0, 100, 0],
          y: [0, 50, 0],
        }}
        transition={{ duration: 10, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"
        animate={{
          x: [0, -100, 0],
          y: [0, -50, 0],
        }}
        transition={{ duration: 12, repeat: Infinity }}
      />

      <div className="z-10 w-full max-w-6xl flex gap-8 items-center">
        {/* Left side - Branding & Info */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="hidden lg:flex flex-col gap-8 flex-1"
        >
          <div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-flex items-center gap-3 mb-6"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-2xl shadow-primary/30">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  Pariksha Protector
                </h1>
                <p className="text-sm text-muted-foreground">Secure Examination System</p>
              </div>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-4xl font-bold mb-4 leading-tight"
            >
              Welcome to the Future of{" "}
              <span className="bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                Online Examinations
              </span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-muted-foreground text-lg mb-8"
            >
              Experience seamless, secure, and smart examination management with advanced AI-powered proctoring.
            </motion.p>

            {/* Features list */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="space-y-3 mb-8"
            >
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  className="flex items-center gap-3 group"
                >
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                    {feature}
                  </span>
                </motion.div>
              ))}
            </motion.div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8 + index * 0.1, type: "spring" }}
                  whileHover={{ scale: 1.05 }}
                  className="bg-card/50 backdrop-blur-sm border border-primary/10 rounded-xl p-4 text-center hover:border-primary/30 transition-all"
                >
                  <stat.icon className={`h-8 w-8 ${stat.color} mx-auto mb-2`} />
                  <p className="text-2xl font-bold mb-1">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Right side - Login Form */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full lg:max-w-md"
        >
          <Card className="bg-card/95 backdrop-blur-xl border-2 border-primary/10 shadow-2xl relative overflow-hidden">
            {/* Animated border gradient */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-primary/20 via-purple-500/20 to-primary/20"
              animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
              transition={{ duration: 5, repeat: Infinity }}
              style={{ backgroundSize: "200% 100%" }}
            />
            
            <div className="relative">
              <CardHeader className="space-y-3 text-center pb-2">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-xl shadow-primary/30 relative"
                >
                  <Shield className="w-8 h-8 text-white relative z-10" />
                  <motion.div
                    className="absolute inset-0 rounded-2xl bg-white/20"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </motion.div>
                <div>
                  <CardTitle className="text-2xl font-bold tracking-tight">
                    Sign In
                  </CardTitle>
                  <CardDescription className="text-sm mt-1">
                    Choose your role and enter your credentials
                  </CardDescription>
                </div>
              </CardHeader>
              
              <Tabs 
                defaultValue="faculty" 
                onValueChange={(value) => {
                  setRole(value as UserRole);
                  setIdentifier("");
                  setPassword("");
                }}
                className="mt-2"
              >
                <TabsList className="grid grid-cols-3 mx-6 h-12 bg-muted/50 border border-primary/10">
                  <TabsTrigger 
                    value="faculty" 
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white transition-all data-[state=active]:shadow-lg"
                  >
                    <User className="w-4 h-4 mr-1.5" />
                    Faculty
                  </TabsTrigger>
                  <TabsTrigger 
                    value="student"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white transition-all data-[state=active]:shadow-lg"
                  >
                    <GraduationCap className="w-4 h-4 mr-1.5" />
                    Student
                  </TabsTrigger>
                  <TabsTrigger 
                    value="admin"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white transition-all data-[state=active]:shadow-lg"
                  >
                    <Shield className="w-4 h-4 mr-1.5" />
                    Admin
                  </TabsTrigger>
                </TabsList>
                
                <AnimatePresence mode="wait">
                  <TabsContent value="faculty" className="mt-0">
                    {renderLoginForm("faculty")}
                  </TabsContent>
                  
                  <TabsContent value="student" className="mt-0">
                    {renderLoginForm("student")}
                  </TabsContent>
                  
                  <TabsContent value="admin" className="mt-0">
                    {renderLoginForm("admin")}
                  </TabsContent>
                </AnimatePresence>
              </Tabs>
            </div>
          </Card>

          {/* Footer branding */}
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-center text-xs text-muted-foreground mt-6 flex items-center justify-center gap-2"
          >
            <Shield className="h-3 w-3" />
            © 2025 Pariksha Protector. All rights reserved.
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;