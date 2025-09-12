// components/NotificationSettings.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Bell, BellOff, Settings, AlertTriangle, CheckCircle } from 'lucide-react';
import { FirearmRecord } from '@/types/firearm';
import { notificationService, NotificationSchedule } from '@/services/NotificationService';
import { useToast } from '@/hooks/use-toast';
import { Capacitor } from '@capacitor/core';

interface NotificationSettingsProps {
  firearms: FirearmRecord[];
  onFirearmNotificationToggle: (firearmId: string, enabled: boolean) => Promise<void>;
}

interface FirearmNotificationStatus {
  firearmId: string;
  enabled: boolean;
  scheduledCount: number;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  firearms,
  onFirearmNotificationToggle
}) => {
  const { toast } = useToast();
  const [isInitialized, setIsInitialized] = useState(false);
  const [notificationStatuses, setNotificationStatuses] = useState<FirearmNotificationStatus[]>([]);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load notification settings from localStorage
  const loadNotificationSettings = (): Record<string, boolean> => {
    try {
      const stored = localStorage.getItem('firearm_notification_settings');
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Failed to load notification settings:', error);
      return {};
    }
  };

  // Save notification settings to localStorage
  const saveNotificationSettings = (settings: Record<string, boolean>): void => {
    try {
      localStorage.setItem('firearm_notification_settings', JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save notification settings:', error);
    }
  };

  // Initialize notifications and load status
  useEffect(() => {
    const initializeNotifications = async () => {
      setIsLoading(true);
      
      if (Capacitor.isNativePlatform()) {
        const initialized = await notificationService.initialize();
        setIsInitialized(initialized);
        setPermissionGranted(initialized);
      } else {
        setIsInitialized(false);
        setPermissionGranted(false);
      }

      await updateNotificationStatuses();
      setIsLoading(false);
    };

    initializeNotifications();
  }, [firearms]);

  // Update notification statuses
  const updateNotificationStatuses = async () => {
    const settings = loadNotificationSettings();
    const schedules = await notificationService.getScheduledNotifications();
    
    const statuses: FirearmNotificationStatus[] = firearms.map(firearm => {
      const schedule = schedules.find(s => s.firearmId === firearm.id);
      return {
        firearmId: firearm.id,
        enabled: settings[firearm.id] ?? true, // Default to enabled
        scheduledCount: schedule?.notificationIds.length || 0
      };
    });

    setNotificationStatuses(statuses);
  };

  // Toggle notifications for a specific firearm
  const handleFirearmToggle = async (firearmId: string, enabled: boolean) => {
    try {
      const settings = loadNotificationSettings();
      settings[firearmId] = enabled;
      saveNotificationSettings(settings);

      // Update the status immediately
      setNotificationStatuses(prev => 
        prev.map(status => 
          status.firearmId === firearmId 
            ? { ...status, enabled } 
            : status
        )
      );

      // Call the parent handler to schedule/cancel notifications
      await onFirearmNotificationToggle(firearmId, enabled);

      // Refresh status after the operation
      await updateNotificationStatuses();

      toast({
        title: enabled ? "Notifications Enabled" : "Notifications Disabled",
        description: `Firearm expiry notifications have been ${enabled ? 'enabled' : 'disabled'}.`,
      });
    } catch (error) {
      console.error('Failed to toggle firearm notifications:', error);
      toast({
        title: "Error",
        description: "Failed to update notification settings.",
        variant: "destructive"
      });
    }
  };

  // Enable notifications for all firearms
  const handleEnableAll = async () => {
    try {
      const settings = loadNotificationSettings();
      
      for (const firearm of firearms) {
        settings[firearm.id] = true;
        await onFirearmNotificationToggle(firearm.id, true);
      }
      
      saveNotificationSettings(settings);
      await updateNotificationStatuses();
      
      toast({
        title: "All Notifications Enabled",
        description: "Expiry notifications enabled for all firearms.",
      });
    } catch (error) {
      console.error('Failed to enable all notifications:', error);
      toast({
        title: "Error",
        description: "Failed to enable all notifications.",
        variant: "destructive"
      });
    }
  };

  // Disable notifications for all firearms
  const handleDisableAll = async () => {
    try {
      const settings = loadNotificationSettings();
      
      for (const firearm of firearms) {
        settings[firearm.id] = false;
        await onFirearmNotificationToggle(firearm.id, false);
      }
      
      saveNotificationSettings(settings);
      await updateNotificationStatuses();
      
      toast({
        title: "All Notifications Disabled",
        description: "Expiry notifications disabled for all firearms.",
      });
    } catch (error) {
      console.error('Failed to disable all notifications:', error);
      toast({
        title: "Error",
        description: "Failed to disable all notifications.",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6 text-center">
          <div className="flex items-center justify-center gap-2">
            <Settings className="w-5 h-5 animate-spin" />
            <span>Loading notification settings...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!Capacitor.isNativePlatform()) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="bg-mobile-header text-primary-foreground rounded-t-lg">
          <CardTitle className="text-center text-lg font-bold flex items-center justify-center gap-2">
            <BellOff className="w-5 h-5" />
            Notification Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="text-center space-y-3">
            <AlertTriangle className="w-12 h-12 text-orange-500 mx-auto" />
            <p className="text-muted-foreground">
              Push notifications are only available in the mobile app version.
            </p>
            <p className="text-sm text-muted-foreground">
              Install the app on your Android device to receive expiry reminders.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isInitialized || !permissionGranted) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="bg-mobile-header text-primary-foreground rounded-t-lg">
          <CardTitle className="text-center text-lg font-bold flex items-center justify-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Notification Permission Required
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="text-center space-y-3">
            <p className="text-muted-foreground">
              This app needs permission to send notifications for firearm expiry reminders.
            </p>
            <p className="text-sm text-muted-foreground">
              Please enable notifications in your device settings and restart the app.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="bg-mobile-header text-primary-foreground rounded-t-lg">
          <CardTitle className="text-center text-lg font-bold flex items-center justify-center gap-2">
            <Bell className="w-5 h-5" />
            Notification Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* Test Notification Button */}
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Test Notifications</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    await notificationService.scheduleTestNotification();
                    toast({
                      title: "Test notification scheduled",
                      description: "You should receive a notification in 10 seconds",
                    });
                  }}
                >
                  Send Test
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Tap to send a test notification in 10 seconds to verify notifications work
              </p>
            </div>

            <div className="text-sm text-muted-foreground">
              <p>Receive push notifications before your firearm licenses expire.</p>
              <p className="mt-2">
                <strong>Notification Schedule:</strong> 1 year, 6 months, 3 months, 2 months, 
                1 month, 2 weeks, 1 week, 3 days, and 1 day before expiry.
              </p>
            </div>

            {firearms.length > 1 && (
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEnableAll}
                  className="flex-1"
                >
                  Enable All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDisableAll}
                  className="flex-1"
                >
                  Disable All
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Individual Firearm Settings */}
      {firearms.length > 0 ? (
        <div className="space-y-3">
          {firearms.map(firearm => {
            const status = notificationStatuses.find(s => s.firearmId === firearm.id);
            const enabled = status?.enabled ?? true;
            const scheduledCount = status?.scheduledCount ?? 0;

            return (
              <Card key={firearm.id} className="w-full max-w-md mx-auto">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-primary">{firearm.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-muted-foreground">
                          Expires: {firearm.expiryDate}
                        </span>
                        {enabled && scheduledCount > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {scheduledCount} scheduled
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {enabled ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <BellOff className="w-4 h-4 text-muted-foreground" />
                      )}
                      <Switch
                        checked={enabled}
                        onCheckedChange={(checked) => handleFirearmToggle(firearm.id, checked)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <BellOff className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No firearms added yet.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Add firearms in the Firearms tab to set up expiry notifications.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};