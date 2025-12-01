import React, { createContext, ReactNode, useContext, useEffect, useState } from "react";

interface MaintenanceContextType {
  isMaintenanceMode: boolean;
  maintenanceMessage: string;
  estimatedEndTime: string | null;
  enableMaintenanceMode: (message: string, estimatedEndTime?: string) => void;
  disableMaintenanceMode: () => void;
}

const MaintenanceContext = createContext<MaintenanceContextType | undefined>(undefined);

export const MaintenanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState(
    "System is currently under maintenance. Please check back later."
  );
  const [estimatedEndTime, setEstimatedEndTime] = useState<string | null>(null);

  // Load maintenance mode from localStorage on mount
  useEffect(() => {
    const savedMode = localStorage.getItem("maintenanceMode");
    const savedMessage = localStorage.getItem("maintenanceMessage");
    const savedEndTime = localStorage.getItem("maintenanceEndTime");

    if (savedMode === "true") {
      setIsMaintenanceMode(true);
      if (savedMessage) setMaintenanceMessage(savedMessage);
      if (savedEndTime) setEstimatedEndTime(savedEndTime);
    }
  }, []);

  const enableMaintenanceMode = (message: string, endTime?: string) => {
    setIsMaintenanceMode(true);
    setMaintenanceMessage(message);
    setEstimatedEndTime(endTime || null);

    localStorage.setItem("maintenanceMode", "true");
    localStorage.setItem("maintenanceMessage", message);
    if (endTime) {
      localStorage.setItem("maintenanceEndTime", endTime);
    } else {
      localStorage.removeItem("maintenanceEndTime");
    }
  };

  const disableMaintenanceMode = () => {
    setIsMaintenanceMode(false);
    setMaintenanceMessage("System is currently under maintenance. Please check back later.");
    setEstimatedEndTime(null);

    localStorage.removeItem("maintenanceMode");
    localStorage.removeItem("maintenanceMessage");
    localStorage.removeItem("maintenanceEndTime");
  };

  return (
    <MaintenanceContext.Provider
      value={{
        isMaintenanceMode,
        maintenanceMessage,
        estimatedEndTime,
        enableMaintenanceMode,
        disableMaintenanceMode,
      }}
    >
      {children}
    </MaintenanceContext.Provider>
  );
};

export const useMaintenance = () => {
  const context = useContext(MaintenanceContext);
  if (!context) {
    throw new Error("useMaintenance must be used within MaintenanceProvider");
  }
  return context;
};
