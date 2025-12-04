import ThreeDBackground from "@/components/3d/ThreeDBackground";
import { TestIDVerification } from "@/components/TestIDVerification";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";
import { useTest } from "@/context/TestContext";
import { motion } from "framer-motion";
import { AlertTriangle, Eye, FileImage, FullscreenIcon, TabletSmartphone, Timer } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import BackgroundAppManager from "@/components/BackgroundAppManager";
import SoundMonitor from "@/components/SoundMonitor";
import { Badge } from "@/components/ui/badge";
import { WebcamStatus } from "@/components/ui/webcam-status";
import WebcamMonitor from "@/components/WebcamMonitor";
import { useSupabaseTestSession } from "@/hooks/useSupabaseTestSession";
import { useTestMonitoring } from "@/hooks/useTestMonitoring";
import { useWebcamMonitoring } from "@/hooks/useWebcamMonitoring";

const TakeTest = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { getTestById } = useTest();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [test, setTest] = useState<any | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | boolean>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [warningCount, setWarningCount] = useState(0);
  const [imageFiles, setImageFiles] = useState<Record<string, File | null>>({});
  const [imagePreviewUrls, setImagePreviewUrls] = useState<Record<string, string>>({});
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evaluations, setEvaluations] = useState<Record<string, any>>({});
  const [testIdVerified, setTestIdVerified] = useState(false);
  const [systemReady, setSystemReady] = useState(false);
  const [systemWarnings, setSystemWarnings] = useState<string[]>([]);

  // Simplified state - webcam handled by WebcamMonitor component
  const [lastTabSwitchTime, setLastTabSwitchTime] = useState<number | null>(null);
  const [rapidTabSwitches, setRapidTabSwitches] = useState(0);

  // Sound monitoring state
  const [soundAlerts, setSoundAlerts] = useState<number>(0);
  const [soundLogs, setSoundLogs] = useState<Array<{time: string, level: number}>>([]);

  // Draggable state for SoundMonitor
  const [soundMonitorPosition, setSoundMonitorPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Draggable state for WebcamMonitor
  const [webcamPosition, setWebcamPosition] = useState({ x: 0, y: 0 });
  const [isWebcamDragging, setIsWebcamDragging] = useState(false);
  const [webcamDragOffset, setWebcamDragOffset] = useState({ x: 0, y: 0 });

  // Supabase session for real-time monitoring
  const supabaseSession = useSupabaseTestSession();
  
  // Test monitoring hook
  const {
    isFullscreen: monitorFullscreen,
    warningCount: monitoringWarnings,
    tabSwitchCount,
    isMonitoring,
    requestFullscreen,
    startMonitoring,
    stopMonitoring,
    resetWarnings,
    totalViolations
  } = useTestMonitoring({
    onFullscreenExit: () => handleSubmit(true),
    onTabSwitch: () => handleSubmit(true),
    warningThreshold: 1,
    autoTerminateOnThreshold: true
  });

  // Webcam monitoring hook
  const webcamMonitoring = useWebcamMonitoring({
    onViolationThreshold: (violations) => {
      supabaseSession.logMonitoringEvent("webcam_violation_threshold", { 
        violation_count: violations.length 
      });
      toast({
        title: "Test Terminated",
        description: `Test terminated due to excessive violations (${violations.length}).`,
        variant: "destructive",
      });
      handleSubmit(true);
    },
    violationThreshold: 5,
    warningThreshold: 3
  });

  // Update existing warningCount to include webcam violations
  const totalWarningCount = warningCount + monitoringWarnings + webcamMonitoring.violationCount;

  // Handle SoundMonitor dragging
  const handleSoundMonitorMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, input, select')) return;
    setIsDragging(true);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleSoundMonitorTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('button, input, select')) return;
    setIsDragging(true);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const touch = e.touches[0];
    setDragOffset({
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    });
  };

  // Handle WebcamMonitor dragging
  const handleWebcamMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, input, select')) return;
    setIsWebcamDragging(true);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setWebcamDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleWebcamTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('button, input, select')) return;
    setIsWebcamDragging(true);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const touch = e.touches[0];
    setWebcamDragOffset({
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    });
  };

  // Sound monitoring handlers
  const handleHighVolumeDetected = (level: number) => {
    setSoundAlerts(prev => prev + 1);
    
    const timestamp = new Date().toLocaleTimeString();
    setSoundLogs(prev => [...prev, { time: timestamp, level }]);
    
    supabaseSession.logMonitoringEvent("high_volume_detected", { level, timestamp });
    
    toast({
      title: "⚠️ High Volume Detected",
      description: `Sound level: ${level}%. Please maintain silence.`,
      variant: "destructive",
    });
  };

  const handleSoundLevelChange = (level: number) => {
    // Optionally log continuous sound levels if needed
  };

  // System preparation handlers
  const handleSystemReady = () => {
    setSystemReady(true);
    setSystemWarnings([]);
    toast({
      title: "System Ready",
      description: "Your system has been prepared for the exam. You can now proceed.",
    });
  };

  const handleSystemNotReady = (warnings: string[]) => {
    setSystemReady(false);
    setSystemWarnings(warnings);
    toast({
      title: "System Issues Detected",
      description: `${warnings.length} issue(s) need attention before starting the exam.`,
      variant: "destructive",
    });
  };

  // Handle drag movements
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const maxX = window.innerWidth - 200;
        const maxY = window.innerHeight - 200;
        
        setSoundMonitorPosition({
          x: Math.max(0, Math.min(maxX, e.clientX - dragOffset.x)),
          y: Math.max(0, Math.min(maxY, e.clientY - dragOffset.y))
        });
      }
      
      if (isWebcamDragging) {
        const webcamWidth = window.innerWidth < 640 ? 180 : 240;
        const webcamHeight = window.innerWidth < 640 ? 135 : 180;
        const maxX = window.innerWidth - webcamWidth;
        const maxY = window.innerHeight - webcamHeight;
        
        setWebcamPosition({
          x: Math.max(0, Math.min(maxX, e.clientX - webcamDragOffset.x)),
          y: Math.max(0, Math.min(maxY, e.clientY - webcamDragOffset.y))
        });
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      
      if (isDragging) {
        const maxX = window.innerWidth - 200;
        const maxY = window.innerHeight - 200;
        
        setSoundMonitorPosition({
          x: Math.max(0, Math.min(maxX, touch.clientX - dragOffset.x)),
          y: Math.max(0, Math.min(maxY, touch.clientY - dragOffset.y))
        });
      }
      
      if (isWebcamDragging) {
        const webcamWidth = window.innerWidth < 640 ? 180 : 240;
        const webcamHeight = window.innerWidth < 640 ? 135 : 180;
        const maxX = window.innerWidth - webcamWidth;
        const maxY = window.innerHeight - webcamHeight;
        
        setWebcamPosition({
          x: Math.max(0, Math.min(maxX, touch.clientX - webcamDragOffset.x)),
          y: Math.max(0, Math.min(maxY, touch.clientY - webcamDragOffset.y))
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsWebcamDragging(false);
    };

    if (isDragging || isWebcamDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchend', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, isWebcamDragging, dragOffset, webcamDragOffset]);

  // Redirect if not authenticated as student
  useEffect(() => {
    if (!user || user.role !== "student") {
      navigate("/login");
      return;
    }

    if (!id) return;

    const t = getTestById(id);
    if (!t || t.status !== "published") {
      navigate("/student-dashboard");
      toast({
        title: "Test not found",
        description: "The test you're looking for is not available.",
        variant: "destructive",
      });
      return;
    }

    setTest(t);
    setTimeLeft(t.duration * 60);

    const initSupabaseSession = async () => {
      if (!user?.id) return;
      const newSessionId = await supabaseSession.createSession(t.id, user.id);
      if (newSessionId) {
        setSessionId(newSessionId);
        supabaseSession.logMonitoringEvent("session_started", { test_title: t.title });
      }
    };
    initSupabaseSession();

    loadEvaluations(t.id);
  }, [id, user, navigate, getTestById, toast]);

  // Load evaluations (local placeholder)
  const loadEvaluations = async (_testId: string) => {
    setEvaluations({});
  };

  // Timer effect
  useEffect(() => {
    if (!timeLeft || timeLeft <= 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev && prev > 0) {
          return prev - 1;
        } else {
          clearInterval(timer);
          handleSubmit(false);
          return 0;
        }
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [timeLeft]);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle fullscreen
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement
      );
      
      setIsFullscreen(isCurrentlyFullscreen);
      
      if (!isCurrentlyFullscreen && test) {
        const newWarningCount = warningCount + 1;
        setWarningCount(newWarningCount);
        
        supabaseSession.logMonitoringEvent("fullscreen_exit", { warning_count: newWarningCount });
        supabaseSession.updateWarnings(newWarningCount, tabSwitchCount, newWarningCount);
        
        toast({
          title: `Warning (${newWarningCount}/3)`,
          description: "Please return to fullscreen mode or your test may be invalidated.",
          variant: "destructive",
        });
        
        if (newWarningCount >= 3) {
          handleSubmit(true);
        }
      }
    };
    
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
    };
  }, [test, warningCount, toast, tabSwitchCount, supabaseSession]);

  // Monitoring integration
  useEffect(() => {
    if (test && testIdVerified && monitorFullscreen && !isMonitoring) {
      startMonitoring();
      webcamMonitoring.startMonitoring();
      toast({
        title: "Monitoring Active",
        description: "AI-powered test monitoring is now active. Stay in fullscreen and on this tab.",
      });
    }
    
    if (!monitorFullscreen && isMonitoring) {
      stopMonitoring();
      webcamMonitoring.stopMonitoring();
    }
  }, [test, testIdVerified, monitorFullscreen, isMonitoring]);

  // Enhanced tab switching prevention
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && test && isFullscreen) {
        supabaseSession.logMonitoringEvent("tab_switch", { reason: "visibility_hidden" });
        supabaseSession.updateWarnings(warningCount + 1, tabSwitchCount + 1, warningCount);
        
        toast({
          title: "Test Terminated",
          description: "Tab switching detected. Test has been automatically terminated.",
          variant: "destructive",
        });
        handleSubmit(true);
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (test && isFullscreen) {
        e.preventDefault();
        e.returnValue = 'Are you sure you want to leave? Your test will be terminated.';
        return e.returnValue;
      }
    };

    const handleBlur = () => {
      if (test && isFullscreen) {
        supabaseSession.logMonitoringEvent("window_blur", { reason: "focus_lost" });
        
        toast({
          title: "Test Terminated", 
          description: "Window lost focus. Test has been automatically terminated.",
          variant: "destructive",
        });
        handleSubmit(true);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (test && isFullscreen) {
        if (
          (e.ctrlKey && (e.key === 't' || e.key === 'w' || e.key === 'Tab')) ||
          (e.altKey && e.key === 'Tab') ||
          e.key === 'F11' ||
          (e.ctrlKey && e.shiftKey && e.key === 'T')
        ) {
          e.preventDefault();
          supabaseSession.logMonitoringEvent("blocked_shortcut", { key: e.key });
          toast({
            title: "Action Blocked",
            description: "This action is not allowed during the test.",
            variant: "destructive",
          });
        }
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      if (test && isFullscreen) {
        e.preventDefault();
      }
    };
    
    if (test && isFullscreen) {
      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('beforeunload', handleBeforeUnload);
      window.addEventListener('blur', handleBlur);
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('contextmenu', handleContextMenu);
    }
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [test, isFullscreen, toast, supabaseSession, warningCount, tabSwitchCount]);

  // Save answer after change (debounced)
  useEffect(() => {
    const saveTimeout = setTimeout(async () => {
      if (!user || !test || !sessionId) return;
      const currentQuestion = test.questions[currentQuestionIndex];
      if (!currentQuestion) return;
      const answer = answers[currentQuestion.id];
      if (answer === undefined) return;

      try {
        const answersKey = `pariksha_answers_${test.id}_${user.id}`;
        const existing = JSON.parse(localStorage.getItem(answersKey) || '{}');
        existing[currentQuestion.id] = answer;
        localStorage.setItem(answersKey, JSON.stringify(existing));
      } catch (error) {
        console.error("Error saving answer (local):", error);
      }
    }, 500);

    return () => clearTimeout(saveTimeout);
  }, [answers, currentQuestionIndex, test, user, sessionId]);

  const handleAnswerChange = (questionId: string, value: string | boolean) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleImageUpload = async (questionId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !user || !test) return;
    
    const file = e.target.files[0];
    const previewUrl = URL.createObjectURL(file);
    
    setImageFiles(prev => ({
      ...prev,
      [questionId]: file
    }));
    
    setImagePreviewUrls(prev => ({
      ...prev,
      [questionId]: previewUrl
    }));
    
    setAnswers(prev => ({
      ...prev,
      [questionId]: "image_uploaded"
    }));
    
    try {
      const reader = new FileReader();
      const dataUrl: string = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const imagesKey = `pariksha_images_${test.id}_${user.id}`;
      const existingImages = JSON.parse(localStorage.getItem(imagesKey) || '{}');
      existingImages[questionId] = dataUrl;
      localStorage.setItem(imagesKey, JSON.stringify(existingImages));

      const answersKey = `pariksha_answers_${test.id}_${user.id}`;
      const existingAnswers = JSON.parse(localStorage.getItem(answersKey) || '{}');
      existingAnswers[questionId] = "image_uploaded";
      localStorage.setItem(answersKey, JSON.stringify(existingAnswers));

      toast({
        title: "Image saved",
        description: "Your image has been saved locally for this test.",
      });
    } catch (error) {
      console.error("Error processing image upload (local):", error);
      toast({
        title: "Save failed",
        description: "An error occurred while saving your image locally.",
        variant: "destructive",
      });
    }
  };

  const handleNextQuestion = () => {
    if (test && currentQuestionIndex < test.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async (forced = false) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      stopMonitoring();
      webcamMonitoring.stopMonitoring();
      
      Object.values(imagePreviewUrls).forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
      
      const status = forced ? "terminated" : "submitted";
      await supabaseSession.updateStatus(status);
      
      navigate("/student-dashboard");
      toast({
        title: forced ? "Test Terminated" : "Test Submitted",
        description: forced 
          ? `Test terminated due to security violations. Total violations: ${totalViolations}` 
          : "Your answers have been submitted successfully.",
        variant: forced ? "destructive" : "default",
      });
    } catch (error) {
      console.error("Error submitting test:", error);
      toast({
        title: "Submission Error",
        description: "There was an error submitting your test. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitClick = () => {
    handleSubmit(false);
  };

  if (!test) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Loading test...</h2>
          <p>If the test doesn't load, please return to the dashboard.</p>
        </div>
      </div>
    );
  }

  const currentQuestion = test.questions[currentQuestionIndex];
  const hasEvaluation = currentQuestion && evaluations[currentQuestion.id];

  return (
    <>
      <ThreeDBackground />
      <div className="min-h-screen p-2 sm:p-4 md:p-6 relative z-10">
        {!systemReady ? (
          <div className="flex items-center justify-center h-screen">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-4xl mx-auto px-4"
            >
              <BackgroundAppManager
                onSystemReady={handleSystemReady}
                onSystemNotReady={handleSystemNotReady}
              />
              
              {systemWarnings.length > 0 && (
                <Card className="mt-6 bg-card/90 backdrop-blur-md border-destructive/20">
                  <CardContent className="p-4 sm:p-6">
                    <div className="space-y-4">
                      <h3 className="font-semibold text-destructive">Issues that need attention:</h3>
                      <ul className="space-y-2">
                        {systemWarnings.map((warning, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{warning}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                        <Button 
                          onClick={() => {
                            setSystemReady(false);
                            setSystemWarnings([]);
                          }}
                          variant="outline"
                          className="w-full sm:w-auto"
                        >
                          Try Again
                        </Button>
                        <Button 
                          onClick={() => setSystemReady(true)}
                          variant="destructive"
                          className="w-full sm:w-auto"
                        >
                          Proceed Anyway (Not Recommended)
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              <div className="mt-6 text-center">
                <Button 
                  variant="outline" 
                  onClick={() => navigate("/student-dashboard")}
                >
                  Return to Dashboard
                </Button>
              </div>
            </motion.div>
          </div>
        ) : !isFullscreen ? (
          <div className="flex items-center justify-center h-screen">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center max-w-md mx-auto px-4"
            >
              <Card className="bg-card/90 backdrop-blur-md border-primary/20">
                <CardContent className="p-4 sm:p-6">
                  <h2 className="text-xl sm:text-2xl font-bold mb-4">{test.title}</h2>
                  {test.unique_id && (
                    <p className="text-sm bg-primary/10 text-primary inline-block px-2 py-1 rounded mb-4">
                      Test ID: {test.unique_id}
                    </p>
                  )}
                  <p className="mb-6 text-sm sm:text-base">
                    This test requires fullscreen mode with advanced monitoring. 
                    Exiting fullscreen or switching tabs will result in warnings and potential test termination.
                  </p>
                  <div className="flex flex-col gap-4">
                    <Button 
                      onClick={requestFullscreen} 
                      className="flex items-center gap-2"
                    >
                      <FullscreenIcon className="h-5 w-5" />
                      <span className="truncate">Enter Fullscreen & Start Monitoring</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => navigate("/student-dashboard")}
                    >
                      Return to Dashboard
                    </Button>
                  </div>
                  <div className="mt-6 text-sm text-muted-foreground">
                    <p>⚠️ <strong>Security Notice:</strong></p>
                    <ul className="text-left mt-2 space-y-1">
                      <li>• Exiting fullscreen mode</li>
                      <li>• Switching browser tabs</li>
                      <li>• Looking away from camera</li>
                      <li>• Multiple people detected</li>
                    </ul>
                    <p className="mt-2">Any 3 violations will automatically terminate your test.</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        ) : !testIdVerified ? (
          <div className="flex items-center justify-center h-screen px-4">
            <TestIDVerification 
              expectedTestId={test.unique_id || ''} 
              onSuccess={() => {
                setTestIdVerified(true);
                toast({
                  title: "Verification Successful",
                  description: "You can now proceed with the test.",
                });
              }}
              testTitle={test.title}
            />
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="container mx-auto py-3 sm:py-6 px-2 sm:px-4"
          >
            {/* Monitoring status */}
            <div className="mb-3 sm:mb-4">
              <WebcamStatus
                isActive={webcamMonitoring.isMonitoring}
                peopleCount={webcamMonitoring.status.peopleCount}
                faceDirection={webcamMonitoring.status.faceDirection}
                violationCount={webcamMonitoring.violationCount}
                isFullscreen={monitorFullscreen}
              />
            </div>

            {/* WebcamMonitor component - Draggable with smaller size */}
            <div
              className="fixed z-50 touch-none"
              style={{
                left: webcamPosition.x || 'auto',
                top: webcamPosition.y || '70px',
                right: webcamPosition.x ? 'auto' : '0.5rem',
                width: window.innerWidth < 640 ? '180px' : '240px',
                cursor: isWebcamDragging ? 'grabbing' : 'grab'
              }}
              onMouseDown={handleWebcamMouseDown}
              onTouchStart={handleWebcamTouchStart}
            >
              <div className="bg-card/95 backdrop-blur-sm border border-primary/20 rounded-lg shadow-lg overflow-hidden w-full">
                <div className="bg-primary/10 px-3 py-1.5 border-b border-primary/20">
                  <p className="text-[10px] sm:text-xs font-medium text-center truncate">Camera (Drag)</p>
                </div>
                <div className="w-full aspect-video relative overflow-hidden">
                  <WebcamMonitor
                    isActive={webcamMonitoring.isMonitoring}
                    onViolation={webcamMonitoring.addViolation}
                    onStatusUpdate={webcamMonitoring.updateStatus}
                  />
                </div>
              </div>
            </div>

            {/* Test header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-4 sm:mb-6 gap-3">
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold truncate max-w-[280px] sm:max-w-none">{test.title}</h1>
                <div className="flex flex-wrap gap-2 items-center mt-1">
                  <p className="text-sm sm:text-base text-muted-foreground">{test.subject}</p>
                  {test.unique_id && (
                    <p className="text-xs sm:text-sm bg-primary/10 text-primary px-2 py-0.5 rounded truncate max-w-[120px] sm:max-w-none">
                      ID: {test.unique_id}
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full lg:w-auto">
                <div className="flex items-center gap-1 sm:gap-2 bg-primary/20 text-primary px-2 py-1.5 sm:p-2 rounded-md text-xs sm:text-sm">
                  <Timer className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  <span className="font-mono">{timeLeft !== null ? formatTime(timeLeft) : "00:00"}</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-2 bg-primary/20 text-primary px-2 py-1.5 sm:p-2 rounded-md text-xs sm:text-sm">
                  <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  <span className="hidden sm:inline">Total Violations:</span>
                  <span className="sm:hidden">Violations:</span>
                  <span className="font-semibold">{totalViolations}/9</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-2 bg-primary/20 text-primary px-2 py-1.5 sm:p-2 rounded-md text-xs sm:text-sm">
                  <Eye className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  <span className="hidden sm:inline">Warnings:</span>
                  <span className="font-semibold">{warningCount}/3</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-2 bg-primary/20 text-primary px-2 py-1.5 sm:p-2 rounded-md text-xs sm:text-sm">
                  <TabletSmartphone className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  <span className="hidden sm:inline">Tab Shifts:</span>
                  <span className="font-semibold">{rapidTabSwitches}/3</span>
                </div>
              </div>
            </div>
            
            {/* Question card */}
            <Card className="bg-card/90 backdrop-blur-md border-primary/20 mb-4 sm:mb-6">
              <CardContent className="p-4 sm:p-6">
                {currentQuestion ? (
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium text-muted-foreground">
                          Question {currentQuestionIndex + 1} of {test.questions.length}
                        </span>
                        <span className="text-sm font-medium text-muted-foreground">
                          {currentQuestion.marks} marks
                        </span>
                      </div>
                      
                      {/* Show evaluation if available */}
                      {hasEvaluation && (
                        <div className="mb-4 p-4 bg-primary/10 rounded-lg">
                          <div className="font-medium">Evaluation Result:</div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-lg font-bold">
                              {evaluations[currentQuestion.id].score} / {currentQuestion.marks}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              ({((evaluations[currentQuestion.id].score / currentQuestion.marks) * 100).toFixed(1)}%)
                            </span>
                          </div>
                          {evaluations[currentQuestion.id].feedback && (
                            <div className="mt-2 text-sm">
                              <span className="font-medium">Feedback: </span>
                              {evaluations[currentQuestion.id].feedback}
                            </div>
                          )}
                        </div>
                      )}
                      
                      <h3 className="text-lg sm:text-xl font-semibold mb-4">{currentQuestion.text}</h3>
                      
                      {/* MCQ Question */}
                      {currentQuestion.type === "mcq" && currentQuestion.options && (
                        <div className="space-y-3">
                          {currentQuestion.options.map((option: string, index: number) => (
                            <div 
                              key={index}
                              onClick={() => handleAnswerChange(currentQuestion.id, option)}
                              className={`p-2.5 sm:p-3 border rounded-lg cursor-pointer transition-colors text-sm sm:text-base ${
                                answers[currentQuestion.id] === option 
                                  ? "border-primary bg-primary/10" 
                                  : "border-border hover:border-primary/50"
                              }`}
                            >
                              {option}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* True/False Question */}
                      {currentQuestion.type === "truefalse" && (
                        <div className="flex gap-3">
                          <div 
                            onClick={() => handleAnswerChange(currentQuestion.id, true)}
                            className={`p-2.5 sm:p-3 border rounded-lg cursor-pointer transition-colors flex-1 text-center text-sm sm:text-base ${
                              answers[currentQuestion.id] === true 
                                ? "border-primary bg-primary/10" 
                                : "border-border hover:border-primary/50"
                            }`}
                          >
                            True
                          </div>
                          <div 
                            onClick={() => handleAnswerChange(currentQuestion.id, false)}
                            className={`p-2.5 sm:p-3 border rounded-lg cursor-pointer transition-colors flex-1 text-center text-sm sm:text-base ${
                              answers[currentQuestion.id] === false 
                                ? "border-primary bg-primary/10" 
                                : "border-border hover:border-primary/50"
                            }`}
                          >
                            False
                          </div>
                        </div>
                      )}
                      
                      {/* Essay Question */}
                      {currentQuestion.type === "essay" && (
                        <textarea
                          className="w-full p-2.5 sm:p-3 border rounded-lg h-32 sm:h-36 bg-background text-sm sm:text-base"
                          value={answers[currentQuestion.id] as string || ""}
                          onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                          placeholder="Type your answer here..."
                        />
                      )}
                      
                      {/* Short Answer Question */}
                      {currentQuestion.type === "short" && (
                        <div className="space-y-2">
                          <Input
                            className="w-full text-sm sm:text-base"
                            value={answers[currentQuestion.id] as string || ""}
                            onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                            placeholder={currentQuestion.answerHint || "Type your answer here..."}
                          />
                          {currentQuestion.answerHint && (
                            <div className="text-sm text-muted-foreground">
                              Hint: {currentQuestion.answerHint}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Long Answer Question */}
                      {currentQuestion.type === "long" && (
                        <div className="space-y-2">
                          <textarea
                            className="w-full p-2.5 sm:p-3 border rounded-lg h-48 sm:h-64 bg-background text-sm sm:text-base"
                            value={answers[currentQuestion.id] as string || ""}
                            onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                            placeholder={currentQuestion.answerHint || "Type your detailed answer here..."}
                          />
                          {currentQuestion.answerHint && (
                            <div className="text-sm text-muted-foreground">
                              Hint: {currentQuestion.answerHint}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Image Upload Question */}
                      {currentQuestion.type === "image" && (
                        <div className="space-y-3">
                          {imagePreviewUrls[currentQuestion.id] ? (
                            <div className="space-y-3">
                              <div className="border rounded-lg overflow-hidden">
                                <img 
                                  src={imagePreviewUrls[currentQuestion.id]} 
                                  alt="Your uploaded image" 
                                  className="max-w-full h-auto"
                                />
                              </div>
                              <Button
                                variant="outline"
                                className="w-full sm:w-auto"
                                onClick={() => {
                                  // Clear the image
                                  if (imagePreviewUrls[currentQuestion.id]) {
                                    URL.revokeObjectURL(imagePreviewUrls[currentQuestion.id]);
                                  }
                                  
                                  setImageFiles(prev => ({
                                    ...prev,
                                    [currentQuestion.id]: null
                                  }));
                                  
                                  setImagePreviewUrls(prev => {
                                    const newUrls = {...prev};
                                    delete newUrls[currentQuestion.id];
                                    return newUrls;
                                  });
                                  
                                  setAnswers(prev => {
                                    const newAnswers = {...prev};
                                    delete newAnswers[currentQuestion.id];
                                    return newAnswers;
                                  });
                                }}
                              >
                                Change Image
                              </Button>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <label 
                                htmlFor={`image-upload-${currentQuestion.id}`}
                                className="border border-dashed rounded-lg p-6 sm:p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-accent/50 transition-colors"
                              >
                                <FileImage className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-3 sm:mb-4" />
                                <p className="text-center text-sm sm:text-base">
                                  {currentQuestion.imagePrompt || "Click to upload an image or drag and drop"}
                                </p>
                                <p className="text-sm text-muted-foreground mt-2">
                                  PNG or JPG (max. 5MB)
                                </p>
                              </label>
                              <input
                                id={`image-upload-${currentQuestion.id}`}
                                type="file"
                                className="hidden"
                                accept="image/png, image/jpeg"
                                onChange={(e) => handleImageUpload(currentQuestion.id, e)}
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No questions available for this test.</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Navigation buttons */}
            <div className="flex flex-col sm:flex-row justify-between gap-2 sm:gap-0">
              <Button 
                variant="outline" 
                onClick={handlePreviousQuestion}
                disabled={currentQuestionIndex === 0}
                className="order-1 sm:order-none"
              >
                Previous
              </Button>
              
              <Button 
                onClick={handleSubmitClick}
                variant="destructive"
                disabled={isSubmitting}
                className="order-3 sm:order-none"
              >
                {isSubmitting ? "Submitting..." : "Submit Test"}
              </Button>
              
              <Button 
                onClick={handleNextQuestion}
                disabled={currentQuestionIndex === test.questions.length - 1}
                className="order-2 sm:order-none"
              >
                Next
              </Button>
            </div>

            {/* Sound Monitor - Draggable and adjustable for mobile */}
            <div
              className="fixed z-50 touch-none"
              style={{
                left: soundMonitorPosition.x || 'auto',
                top: soundMonitorPosition.y || 'auto',
                right: soundMonitorPosition.x ? 'auto' : '0.5rem',
                bottom: soundMonitorPosition.y ? 'auto' : '0.5rem',
                width: window.innerWidth < 640 ? '180px' : '240px',
                cursor: isDragging ? 'grabbing' : 'grab'
              }}
              onMouseDown={handleSoundMonitorMouseDown}
              onTouchStart={handleSoundMonitorTouchStart}
            >
              <div className="bg-card/95 backdrop-blur-sm border border-primary/20 rounded-lg shadow-lg">
                <div className="bg-primary/10 px-2 py-1 border-b border-primary/20">
                  <p className="text-xs font-medium text-center">Volume Monitor (Drag to Move)</p>
                </div>
                <div className="pointer-events-auto">
                  <SoundMonitor
                    onHighVolumeDetected={handleHighVolumeDetected}
                    onSoundLevelChange={handleSoundLevelChange}
                    threshold={40}
                    enabled={isFullscreen && testIdVerified}
                  />
                </div>
              </div>
              
              {/* Sound Alerts Summary - Compact for mobile */}
              {soundAlerts > 0 && (
                <Card className="mt-1 sm:mt-2 bg-card/95 backdrop-blur-sm border-red-500/30 pointer-events-auto">
                  <CardContent className="p-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-red-500">Violations</span>
                      <Badge variant="destructive" className="text-xs px-1 py-0 h-4">{soundAlerts}</Badge>
                    </div>
                    <div className="space-y-0.5 max-h-16 sm:max-h-20 overflow-y-auto">
                      {soundLogs.slice(-2).reverse().map((log, index) => (
                        <div key={index} className="text-[10px] text-muted-foreground truncate">
                          {log.time} - {log.level}%
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </>
  );
};

export default TakeTest;
