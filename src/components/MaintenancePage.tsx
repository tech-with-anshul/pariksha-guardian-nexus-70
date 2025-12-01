import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useMaintenance } from "@/context/MaintenanceContext";
import { motion } from "framer-motion";
import { AlertTriangle, Clock, Settings } from "lucide-react";

const MaintenancePage = () => {
  const { maintenanceMessage, estimatedEndTime } = useMaintenance();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl w-full"
      >
        <Card className="border-2">
          <CardHeader className="text-center pb-4">
            <motion.div
              className="flex justify-center mb-4"
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Settings className="h-16 w-16 text-primary" />
            </motion.div>
            <CardTitle className="text-3xl font-bold">System Under Maintenance</CardTitle>
            <CardDescription className="text-lg mt-2">
              We're making improvements to serve you better
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted/50 rounded-lg p-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                <Badge variant="outline" className="text-base px-4 py-1">
                  Temporarily Unavailable
                </Badge>
              </div>
              <p className="text-muted-foreground mt-4">{maintenanceMessage}</p>
            </div>

            {estimatedEndTime && (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Estimated Completion Time</h3>
                </div>
                <p className="text-sm text-muted-foreground">{estimatedEndTime}</p>
              </div>
            )}

            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Thank you for your patience. We'll be back online shortly.
              </p>
              <motion.div
                className="flex justify-center gap-2 mt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="h-2 w-2 bg-primary rounded-full"
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                  />
                ))}
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default MaintenancePage;
