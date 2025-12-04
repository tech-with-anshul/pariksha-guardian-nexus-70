import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface SoundMonitorProps {
  onHighVolumeDetected?: (level: number) => void;
  onSoundLevelChange?: (level: number) => void;
  threshold?: number; // Volume threshold (0-100)
  enabled?: boolean;
}

const SoundMonitor = ({ 
  onHighVolumeDetected, 
  onSoundLevelChange,
  threshold = 40,
  enabled = true 
}: SoundMonitorProps) => {
  const [soundLevel, setSoundLevel] = useState(0);
  const [isHighVolume, setIsHighVolume] = useState(false);
  const [alertCount, setAlertCount] = useState(0);
  const [showAlert, setShowAlert] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      cleanup();
      return;
    }

    const initAudio = async () => {
      try {
        // Request microphone access
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: false
          } 
        });
        
        streamRef.current = stream;

        // Create audio context and analyser
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;
        
        const bufferLength = analyserRef.current.frequencyBinCount;
        dataArrayRef.current = new Uint8Array(bufferLength);

        // Connect microphone to analyser
        const source = audioContextRef.current.createMediaStreamSource(stream);
        source.connect(analyserRef.current);

        // Start monitoring
        monitorSound();
      } catch (error) {
        console.error("Error accessing microphone:", error);
      }
    };

    initAudio();

    return () => {
      cleanup();
    };
  }, [enabled, threshold]);

  const cleanup = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
  };

  const monitorSound = () => {
    if (!analyserRef.current || !dataArrayRef.current) return;

    analyserRef.current.getByteFrequencyData(dataArrayRef.current);

    // Calculate average volume level
    let sum = 0;
    for (let i = 0; i < dataArrayRef.current.length; i++) {
      sum += dataArrayRef.current[i];
    }
    const average = sum / dataArrayRef.current.length;
    const volumeLevel = Math.round((average / 255) * 100);

    setSoundLevel(volumeLevel);
    onSoundLevelChange?.(volumeLevel);

    // Check if volume exceeds threshold
    if (volumeLevel > threshold) {
      if (!isHighVolume) {
        setIsHighVolume(true);
        setShowAlert(true);
        setAlertCount(prev => prev + 1);
        onHighVolumeDetected?.(volumeLevel);

        // Hide alert after 3 seconds
        setTimeout(() => setShowAlert(false), 3000);
      }
    } else {
      setIsHighVolume(false);
    }

    // Continue monitoring
    animationFrameRef.current = requestAnimationFrame(monitorSound);
  };

  const getVolumeColor = () => {
    if (soundLevel < 30) return "text-green-500";
    if (soundLevel < 50) return "text-yellow-500";
    if (soundLevel < threshold) return "text-orange-500";
    return "text-red-500";
  };

  const getVolumeBgColor = () => {
    if (soundLevel < 30) return "bg-green-500";
    if (soundLevel < 50) return "bg-yellow-500";
    if (soundLevel < threshold) return "bg-orange-500";
    return "bg-red-500";
  };

  if (!enabled) return null;

  return (
    <>
      <Card className="bg-card/95 backdrop-blur-sm border-primary/20">
        <CardContent className="p-2 sm:p-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {soundLevel === 0 ? (
                  <VolumeX className={`h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground`} />
                ) : (
                  <Volume2 className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${getVolumeColor()}`} />
                )}
                <span className="text-xs sm:text-sm font-medium">Sound</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`text-xs sm:text-sm font-bold ${getVolumeColor()}`}>
                  {soundLevel}%
                </span>
                {alertCount > 0 && (
                  <Badge variant="destructive" className="text-[10px] sm:text-xs px-1 py-0 h-4">
                    {alertCount}
                  </Badge>
                )}
              </div>
            </div>

            {/* Volume meter */}
            <div className="relative h-1.5 sm:h-2 bg-secondary rounded-full overflow-hidden">
              <motion.div
                className={`h-full ${getVolumeBgColor()} rounded-full`}
                initial={{ width: 0 }}
                animate={{ width: `${soundLevel}%` }}
                transition={{ duration: 0.1 }}
              />
              {/* Threshold indicator */}
              <div 
                className="absolute top-0 bottom-0 w-0.5 bg-red-500/50"
                style={{ left: `${threshold}%` }}
              />
            </div>

            {/* Volume bars visualization - Simplified for mobile */}
            <div className="flex items-end gap-0.5 h-6 sm:h-8">
              {[...Array(12)].map((_, i) => {
                const barHeight = Math.max(0, soundLevel - (i * 8));
                return (
                  <motion.div
                    key={i}
                    className={`flex-1 rounded-t ${getVolumeBgColor()}`}
                    animate={{ height: `${Math.min(100, barHeight * 3)}%` }}
                    transition={{ duration: 0.1 }}
                  />
                );
              })}
            </div>

            <div className="text-[10px] sm:text-xs text-muted-foreground text-center">
              Threshold: {threshold}%
            </div>
          </div>
        </CardContent>
      </Card>

      {/* High Volume Alert - Compact for mobile */}
      <AnimatePresence>
        {showAlert && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm"
          >
            <Card className="bg-red-500/10 border-2 border-red-500 shadow-2xl">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <motion.div
                    animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                  >
                    <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-red-500 flex-shrink-0" />
                  </motion.div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-red-500 text-sm sm:text-base">High Volume!</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">
                      Please maintain silence
                    </p>
                  </div>
                  <Badge variant="destructive" className="text-xs sm:text-sm px-1.5 sm:px-2">
                    {soundLevel}%
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SoundMonitor;
