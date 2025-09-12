// services/notificationService.ts
import { Capacitor } from '@capacitor/core';
import { LocalNotifications, LocalNotificationSchema } from '@capacitor/local-notifications';
import { FirearmRecord, FirearmApplication } from '@/types/firearm';
import { calculateWorkingDays } from '@/utils/holidays';

export interface NotificationSchedule {
  firearmId: string;
  firearmTitle: string;
  expiryDate: string;
  notificationIds: number[];
}

export interface ApplicationNotificationSchedule {
  applicationId: string;
  applicationRef: string;
  notificationId: number;
}

class NotificationService {
  private notificationCounter = 1000; // Start from 1000 to avoid conflicts
  private scheduleKey = 'firearm_notification_schedule';
  private applicationScheduleKey = 'application_notification_schedule';

  async initialize(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      console.log('Notifications only work on native platforms');
      return false;
    }

    try {
      // Request permission
      const permission = await LocalNotifications.requestPermissions();
      
      if (permission.display !== 'granted') {
        console.log('Notification permission denied');
        return false;
      }

      // Listen for notification actions
      LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
        console.log('Notification action performed:', notification);
      });

      return true;
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
      return false;
    }
  }

  private getNextNotificationId(): number {
    return this.notificationCounter++;
  }

  private saveSchedule(schedule: NotificationSchedule[]): void {
    try {
      localStorage.setItem(this.scheduleKey, JSON.stringify(schedule));
    } catch (error) {
      console.error('Failed to save notification schedule:', error);
    }
  }

  private loadSchedule(): NotificationSchedule[] {
    try {
      const stored = localStorage.getItem(this.scheduleKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load notification schedule:', error);
      return [];
    }
  }

  async scheduleFirearmNotifications(firearm: FirearmRecord): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    try {
      // Cancel existing notifications for this firearm
      await this.cancelFirearmNotifications(firearm.id);

      const expiryDate = new Date(firearm.expiryDate);
      const today = new Date();
      
      // Notification intervals (days before expiry)
      const intervals = [365, 180, 90, 60, 30, 14, 7, 3, 1]; // 1 year to 1 day
      const notifications: LocalNotificationSchema[] = [];
      const notificationIds: number[] = [];

      for (const days of intervals) {
        const notificationDate = new Date(expiryDate);
        notificationDate.setDate(expiryDate.getDate() - days);

        // Only schedule if the notification date is in the future
        if (notificationDate > today) {
          const id = this.getNextNotificationId();
          notificationIds.push(id);

          let title = '';
          let body = '';
          
          if (days >= 365) {
            title = `Firearm License Expiry - 1 Year Notice`;
            body = `${firearm.title} expires in 1 year (${firearm.expiryDate}). Consider starting renewal process.`;
          } else if (days >= 90) {
            title = `Firearm License Expiry - ${days} Days`;
            body = `${firearm.title} expires in ${days} days (${firearm.expiryDate}). Time to start renewal.`;
          } else if (days >= 30) {
            title = `Firearm License Expiry - ${days} Days`;
            body = `${firearm.title} expires in ${days} days (${firearm.expiryDate}). Renewal required!`;
          } else if (days >= 7) {
            title = `URGENT: Firearm License Expiry - ${days} Days`;
            body = `${firearm.title} expires in ${days} days (${firearm.expiryDate}). Renewal URGENT!`;
          } else {
            title = `CRITICAL: Firearm License Expiry - ${days} Day${days !== 1 ? 's' : ''}`;
            body = `${firearm.title} expires ${days === 1 ? 'tomorrow' : `in ${days} days`} (${firearm.expiryDate}). IMMEDIATE ACTION REQUIRED!`;
          }

          notifications.push({
            id,
            title,
            body,
            schedule: {
              at: notificationDate,
            },
            sound: undefined,
            attachments: undefined,
            actionTypeId: '',
            extra: {
              firearmId: firearm.id,
              daysToExpiry: days
            }
          });
        }
      }

      if (notifications.length > 0) {
        await LocalNotifications.schedule({
          notifications
        });

        // Save the schedule
        const schedule = this.loadSchedule();
        const existingIndex = schedule.findIndex(s => s.firearmId === firearm.id);
        
        const newSchedule: NotificationSchedule = {
          firearmId: firearm.id,
          firearmTitle: firearm.title,
          expiryDate: firearm.expiryDate,
          notificationIds
        };

        if (existingIndex >= 0) {
          schedule[existingIndex] = newSchedule;
        } else {
          schedule.push(newSchedule);
        }

        this.saveSchedule(schedule);
        
        console.log(`Scheduled ${notifications.length} notifications for ${firearm.title}`);
      }
    } catch (error) {
      console.error('Failed to schedule notifications:', error);
    }
  }

  async cancelFirearmNotifications(firearmId: string): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    try {
      const schedule = this.loadSchedule();
      const firearmSchedule = schedule.find(s => s.firearmId === firearmId);
      
      if (firearmSchedule && firearmSchedule.notificationIds.length > 0) {
        await LocalNotifications.cancel({
          notifications: firearmSchedule.notificationIds.map(id => ({ id }))
        });

        // Remove from schedule
        const updatedSchedule = schedule.filter(s => s.firearmId !== firearmId);
        this.saveSchedule(updatedSchedule);
        
        console.log(`Cancelled ${firearmSchedule.notificationIds.length} notifications for ${firearmSchedule.firearmTitle}`);
      }
    } catch (error) {
      console.error('Failed to cancel notifications:', error);
    }
  }

  async rescheduleAllFirearms(firearms: FirearmRecord[]): Promise<void> {
    console.log('Rescheduling all firearm notifications...');
    
    // Cancel all existing notifications
    await this.cancelAllNotifications();
    
    // Schedule new notifications for all firearms
    for (const firearm of firearms) {
      await this.scheduleFirearmNotifications(firearm);
    }
  }

  async cancelAllNotifications(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    try {
      const schedule = this.loadSchedule();
      const allIds: number[] = [];
      
      schedule.forEach(s => {
        allIds.push(...s.notificationIds);
      });

      if (allIds.length > 0) {
        await LocalNotifications.cancel({
          notifications: allIds.map(id => ({ id }))
        });
      }

      // Clear the schedule
      this.saveSchedule([]);
      
      console.log(`Cancelled ${allIds.length} notifications`);
    } catch (error) {
      console.error('Failed to cancel all notifications:', error);
    }
  }

  async getScheduledNotifications(): Promise<NotificationSchedule[]> {
    return this.loadSchedule();
  }

  async getPendingNotifications(): Promise<any[]> {
    if (!Capacitor.isNativePlatform()) return [];

    try {
      const pending = await LocalNotifications.getPending();
      return pending.notifications;
    } catch (error) {
      console.error('Failed to get pending notifications:', error);
      return [];
    }
  }

  // Test notification function for debugging
  async scheduleTestNotification(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    try {
      const id = this.getNextNotificationId();
      const testDate = new Date(Date.now() + 10000); // 10 seconds from now

      await LocalNotifications.schedule({
        notifications: [{
          id,
          title: 'Test Notification',
          body: 'If you see this, notifications are working correctly!',
          schedule: {
            at: testDate,
          },
          sound: undefined,
          attachments: undefined,
          actionTypeId: '',
          extra: {
            type: 'test'
          }
        }]
      });

      console.log('Test notification scheduled for 10 seconds from now');
    } catch (error) {
      console.error('Failed to schedule test notification:', error);
    }
  }

  // Application notification methods
  private saveApplicationSchedule(schedule: ApplicationNotificationSchedule[]): void {
    try {
      localStorage.setItem(this.applicationScheduleKey, JSON.stringify(schedule));
    } catch (error) {
      console.error('Failed to save application notification schedule:', error);
    }
  }

  private loadApplicationSchedule(): ApplicationNotificationSchedule[] {
    try {
      const stored = localStorage.getItem(this.applicationScheduleKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load application notification schedule:', error);
      return [];
    }
  }

  async scheduleApplicationNotifications(applications: FirearmApplication[]): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    try {
      // Cancel all existing application notifications
      await this.cancelAllApplicationNotifications();

      const notifications: LocalNotificationSchema[] = [];
      const schedule: ApplicationNotificationSchedule[] = [];

      for (const app of applications) {
        const applicationDate = new Date(app.dateApplied);
        const today = new Date();
        const workingDaysPending = calculateWorkingDays(applicationDate, today);
        
        // Schedule notification for applications that are approaching or past 90 working days
        if (workingDaysPending >= 88) {
          // For applications that are already at 90+ days, schedule immediate notification
          const notificationDate = workingDaysPending >= 90 ? new Date(Date.now() + 60000) : // 1 minute from now
            new Date(Date.now() + (92 - workingDaysPending) * 24 * 60 * 60 * 1000); // Schedule for when it hits 90 days
          
          const id = this.getNextNotificationId();
          
          const daysText = workingDaysPending >= 90 ? 
            `${workingDaysPending} working days` : 
            '90+ working days';
            
          notifications.push({
            id,
            title: 'Application Pending Alert',
            body: `Your firearm application ${app.applicationRefNumber} has been pending for ${daysText}. Consider following up with SAPS.`,
            schedule: {
              at: notificationDate,
            },
            sound: undefined,
            attachments: undefined,
            actionTypeId: '',
            extra: {
              applicationId: app.id,
              type: 'application_pending',
              workingDays: workingDaysPending
            }
          });

          schedule.push({
            applicationId: app.id,
            applicationRef: app.applicationRefNumber,
            notificationId: id
          });
        }
      }

      if (notifications.length > 0) {
        await LocalNotifications.schedule({
          notifications
        });
        this.saveApplicationSchedule(schedule);
        console.log(`Scheduled ${notifications.length} application pending notifications`);
      }
    } catch (error) {
      console.error('Failed to schedule application notifications:', error);
    }
  }

  async cancelAllApplicationNotifications(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    try {
      const schedule = this.loadApplicationSchedule();
      const allIds = schedule.map(s => s.notificationId);

      if (allIds.length > 0) {
        await LocalNotifications.cancel({
          notifications: allIds.map(id => ({ id }))
        });
      }

      // Clear the schedule
      this.saveApplicationSchedule([]);
      console.log(`Cancelled ${allIds.length} application notifications`);
    } catch (error) {
      console.error('Failed to cancel application notifications:', error);
    }
  }

  async cancelApplicationNotification(applicationId: string): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    try {
      const schedule = this.loadApplicationSchedule();
      const applicationSchedule = schedule.find(s => s.applicationId === applicationId);
      
      if (applicationSchedule) {
        await LocalNotifications.cancel({
          notifications: [{ id: applicationSchedule.notificationId }]
        });

        // Remove from schedule
        const updatedSchedule = schedule.filter(s => s.applicationId !== applicationId);
        this.saveApplicationSchedule(updatedSchedule);
        
        console.log(`Cancelled application notification for ${applicationSchedule.applicationRef}`);
      }
    } catch (error) {
      console.error('Failed to cancel application notification:', error);
    }
  }
}

export const notificationService = new NotificationService();