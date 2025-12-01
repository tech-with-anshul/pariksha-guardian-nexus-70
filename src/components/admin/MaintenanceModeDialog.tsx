import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Clock } from "lucide-react";
import { useState } from "react";

interface MaintenanceModeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onEnable: (message: string, estimatedEndTime?: string) => void;
}

const MaintenanceModeDialog = ({ isOpen, onClose, onEnable }: MaintenanceModeDialogProps) => {
  const [message, setMessage] = useState("System is currently under maintenance. Please check back later.");
  const [estimatedEndTime, setEstimatedEndTime] = useState("");

  const handleEnable = () => {
    onEnable(message, estimatedEndTime || undefined);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            <DialogTitle>Enable Maintenance Mode</DialogTitle>
          </div>
          <DialogDescription>
            This will prevent all users (except admins) from accessing the system.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="message">Maintenance Message</Label>
            <Textarea
              id="message"
              placeholder="Enter a message to display to users..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="endTime" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Estimated Completion Time (Optional)
            </Label>
            <Input
              id="endTime"
              type="datetime-local"
              value={estimatedEndTime}
              onChange={(e) => setEstimatedEndTime(e.target.value)}
            />
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> You will still be able to access the admin panel while maintenance mode is active.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleEnable} variant="destructive">
            Enable Maintenance Mode
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MaintenanceModeDialog;
