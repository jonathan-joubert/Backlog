// Main Firearm Tracker Application Component
import React, { useState, useEffect } from 'react';
import { ApplicationForm } from './ApplicationForm';
import { ApplicationList } from './ApplicationList';
import { EditApplicationDialog } from './EditApplicationDialog';
import { ThemeToggle } from './ThemeToggle';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FirearmApplication, AppSettings, FirearmRecord } from '@/types/firearm';
import { loadApplications, loadSettings, saveSettings, loadFirearms, addFirearm, deleteFirearm, updateFirearm } from '@/utils/storage';
import { Shield, FileText, ListOrdered, Info, Target, Pencil, AlertTriangle, Trash2 } from 'lucide-react';
import { ServerStatus } from './ServerStatus';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { calculateWorkingDays } from '@/utils/holidays';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { NotificationSettings } from './NotificationSettings';
import { Bell } from 'lucide-react';
import { notificationService } from '@/services/NotificationService';


/**
 * Main Firearm Tracker Application
 * 
 * Features:
 * - Save/edit/delete firearm applications locally
 * - Fetch status from SAPS website
 * - Calculate working days pending
 * - Dark/light mode toggle
 * - Mobile-friendly responsive design
 */
// Section options with durations
const SECTION_OPTIONS = [
  { value: 'section_13', label: 'Section 13 - Self-defence (5 years)', duration: 5 },
  { value: 'section_14', label: 'Section 14 - Restricted self-defence (2 years)', duration: 2 },
  { value: 'section_15', label: 'Section 15 - Occasional hunting/sport (10 years)', duration: 10 },
  { value: 'section_16', label: 'Section 16 - Dedicated hunting/sport (10 years)', duration: 10 },
  { value: 'section_17', label: 'Section 17 - Private collection (10 years)', duration: 10 },
  { value: 'section_19', label: 'Section 19 - Public collection (10 years)', duration: 10 },
  { value: 'section_20_hunting', label: 'Section 20 - Business (hunting) (5 years)', duration: 5 },
  { value: 'section_20_other', label: 'Section 20 - Business (other) (2 years)', duration: 2 },
  { value: 'section_20_theatre', label: 'Section 20 - Theatre/film/TV (2 years)', duration: 2 },
  { value: 'section_20_security', label: 'Section 20 - Security business (2 years)', duration: 2 },
  { value: 'section_20_training', label: 'Section 20 - Training (2 years)', duration: 2 },
  { value: 'section_20_game', label: 'Section 20 - Game rancher (2 years)', duration: 2 }
];

// Edit Firearm Dialog Component
const EditFirearmDialog: React.FC<{
  firearm: FirearmRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (firearm: FirearmRecord) => void;
  existingFirearms: FirearmRecord[];
}> = ({ firearm, isOpen, onClose, onUpdate, existingFirearms }) => {
  const [formData, setFormData] = useState({
    title: '',
    issueDate: '',
    section: '',
    make: '',
    serialNumber: '',
    notes: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (firearm) {
      setFormData({
        title: firearm.title,
        issueDate: firearm.issueDate,
        section: firearm.section,
        make: firearm.make,
        serialNumber: firearm.serialNumber,
        notes: firearm.notes
      });
    }
  }, [firearm]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim() || !formData.issueDate || !formData.section) {
      setError('Title, Issue Date, and Section are required');
      return;
    }

    // Check for duplicates (excluding current firearm)
    const isDuplicate = existingFirearms.some(f => 
      f.id !== firearm?.id && 
      f.title.toLowerCase().trim() === formData.title.toLowerCase().trim() &&
      f.serialNumber && formData.serialNumber &&
      f.serialNumber.toLowerCase().trim() === formData.serialNumber.toLowerCase().trim()
    );

    if (isDuplicate) {
      setError('A firearm with this title and serial number already exists');
      return;
    }

    

    if (!firearm) return;

    // Calculate expiry date
    const issueDate = new Date(formData.issueDate);
    const selectedSection = SECTION_OPTIONS.find(s => s.value === formData.section);
    const duration = selectedSection?.duration || 5;
    const expiryDate = new Date(issueDate);
    expiryDate.setFullYear(expiryDate.getFullYear() + duration);

    const updatedFirearm: FirearmRecord = {
      ...firearm,
      ...formData,
      expiryDate: expiryDate.toISOString().split('T')[0]
    };

    onUpdate(updatedFirearm);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-center">
            Edit Firearm Record
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {error && (
            <div className="p-3 bg-red-100 dark:bg-red-900 rounded text-sm text-red-800 dark:text-red-200">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="edit-title">Title *</Label>
            <Input
              id="edit-title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-issue-date">Issue Date *</Label>
            <Input
              id="edit-issue-date"
              type="date"
              value={formData.issueDate}
              onChange={(e) => setFormData(prev => ({ ...prev, issueDate: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-section">Section *</Label>
            <Select value={formData.section} onValueChange={(value) => setFormData(prev => ({ ...prev, section: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select section" />
              </SelectTrigger>
              <SelectContent>
                {SECTION_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-make">Make</Label>
            <Input
              id="edit-make"
              value={formData.make}
              onChange={(e) => setFormData(prev => ({ ...prev, make: e.target.value }))}
              placeholder="e.g., Glock"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-serial">Serial Number</Label>
            <Input
              id="edit-serial"
              value={formData.serialNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, serialNumber: e.target.value }))}
              placeholder="Enter serial number"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-notes">Notes</Label>
            <Textarea
              id="edit-notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional information..."
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="mobile" className="flex-1">
              Update
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Delete Confirmation Dialog
const DeleteConfirmDialog: React.FC<{
  firearm: FirearmRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}> = ({ firearm, isOpen, onClose, onConfirm }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-center text-red-600">
            Delete Firearm Record
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <div>
              <p className="font-semibold text-red-800 dark:text-red-200">
                Are you sure?
              </p>
              <p className="text-sm text-red-700 dark:text-red-300">
                This will permanently delete "{firearm?.title}" and cannot be undone.
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" className="flex-1" onClick={onConfirm}>
              Delete
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};



export const FirearmTracker: React.FC = () => {
  const { toast } = useToast();
  const [applications, setApplications] = useState<FirearmApplication[]>([]);
  const [editingApplication, setEditingApplication] = useState<FirearmApplication | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [settings, setSettings] = useState<AppSettings>({ isDarkMode: false });
  const [firearms, setFirearms] = useState<FirearmRecord[]>([]);
  const [editingFirearm, setEditingFirearm] = useState<FirearmRecord | null>(null);
  const [deletingFirearm, setDeletingFirearm] = useState<FirearmRecord | null>(null);
  const [isFirearmEditDialogOpen, setIsFirearmEditDialogOpen] = useState(false);
  const [isFirearmDeleteDialogOpen, setIsFirearmDeleteDialogOpen] = useState(false);
  const [formError, setFormError] = useState('');
  
  // Firearm form state
  const [firearmForm, setFirearmForm] = useState({
    title: '',
    issueDate: '',
    section: '',
    make: '',
    serialNumber: '',
    notes: ''
  });

  // Load data on component mount
// Load data on component mount
useEffect(() => {
  const loadedApplications = loadApplications();
  const loadedSettings = loadSettings();
  const loadedFirearms = loadFirearms();
  
  setApplications(loadedApplications);
  setSettings(loadedSettings);
  setFirearms(loadedFirearms);
  
  // Apply theme
  if (loadedSettings.isDarkMode) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }

  // Initialize notifications
  initializeNotifications(loadedFirearms, loadedApplications);
}, []);

  // Calculate renewal status and color
const getRenewalStatus = (expiryDate: string) => {
  const expiry = new Date(expiryDate);
  const today = new Date();
  const threeMonthsBefore = new Date(expiry);
  threeMonthsBefore.setMonth(expiry.getMonth() - 3);
  
  const calendarDaysLeft = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const workingDaysLeft = calculateWorkingDays(today, expiry);
  
  let status = '';
  let colorClass = '';
  
  if (calendarDaysLeft < 0) {
    status = 'EXPIRED';
    colorClass = 'text-red-600 font-bold';
  } else if (today >= threeMonthsBefore) {
    status = 'RENEWAL REQUIRED';
    colorClass = 'text-red-600 font-bold';
  } else if (calendarDaysLeft <= 180) { // 6 months
    status = 'RENEWAL SOON';
    colorClass = 'text-orange-600 font-semibold';
  } else {
    status = 'VALID';
    colorClass = 'text-green-600 font-medium';
  }
  
  return { calendarDaysLeft, workingDaysLeft, status, colorClass };
};

  // Handle new application added
  const handleApplicationAdded = async (application: FirearmApplication) => {
    const newApplications = [...applications, application];
    setApplications(newApplications);
    
    // Reschedule application notifications
    try {
      await notificationService.scheduleApplicationNotifications(newApplications);
    } catch (error) {
      console.error('Failed to schedule application notifications:', error);
    }
  };

  // Handle application deletion
  const handleApplicationDeleted = async (id: string) => {
    const updatedApplications = applications.filter(app => app.id !== id);
    setApplications(updatedApplications);
    
    // Cancel notification for deleted application and reschedule others
    try {
      await notificationService.cancelApplicationNotification(id);
      await notificationService.scheduleApplicationNotifications(updatedApplications);
    } catch (error) {
      console.error('Failed to update application notifications:', error);
    }
  };

  // Handle application edit
  const handleApplicationEdit = (application: FirearmApplication) => {
    setEditingApplication(application);
    setIsEditDialogOpen(true);
  };

  // Handle application update
  const handleApplicationUpdated = async (updatedApplication: FirearmApplication) => {
    const updatedApplications = applications.map(app => 
      app.id === updatedApplication.id ? updatedApplication : app
    );
    setApplications(updatedApplications);
    
    // Reschedule application notifications
    try {
      await notificationService.scheduleApplicationNotifications(updatedApplications);
    } catch (error) {
      console.error('Failed to reschedule application notifications:', error);
    }
  };

  

  // Handle theme toggle
  const handleThemeToggle = () => {
    const newSettings = { ...settings, isDarkMode: !settings.isDarkMode };
    setSettings(newSettings);
    saveSettings(newSettings);
    
    if (newSettings.isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

// Handle firearm form submission
const handleFirearmSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setFormError('');
  
  if (!firearmForm.title.trim() || !firearmForm.issueDate || !firearmForm.section) {
    setFormError('Title, Issue Date, and Section are required');
    return;
  }

  // Check for duplicates
  const isDuplicate = firearms.some(f => 
    f.title.toLowerCase().trim() === firearmForm.title.toLowerCase().trim() &&
    firearmForm.serialNumber && f.serialNumber &&
    f.serialNumber.toLowerCase().trim() === firearmForm.serialNumber.toLowerCase().trim()
  );

  if (isDuplicate) {
    setFormError('A firearm with this title and serial number already exists');
    return;
  }
  

    // Calculate expiry date
    const issueDate = new Date(firearmForm.issueDate);
    const selectedSection = SECTION_OPTIONS.find(s => s.value === firearmForm.section);
    const duration = selectedSection?.duration || 5;
    const expiryDate = new Date(issueDate);
    expiryDate.setFullYear(expiryDate.getFullYear() + duration);

    const newFirearm = addFirearm({
      ...firearmForm,
      expiryDate: expiryDate.toISOString().split('T')[0]
    });

    setFirearms(prev => [...prev, newFirearm]);
    setFirearmForm({
      title: '',
      issueDate: '',
      section: '',
      make: '',
      serialNumber: '',
      notes: ''
    });

    toast({
  title: "Success",
  description: "Firearm record added successfully",
});

// Schedule notifications for the new firearm if enabled (default to enabled)
const settings = loadNotificationSettings();
    if (settings[newFirearm.id] !== false) { // Default to enabled
      await notificationService.scheduleFirearmNotifications(newFirearm);
    }
  };

// Handle firearm edit - NOT application edit
const handleFirearmEdit = (firearm: FirearmRecord) => {
  setEditingFirearm(firearm);
  setIsFirearmEditDialogOpen(true); // Use firearm-specific dialog
};

// Handle firearm delete - NOT application delete
const handleFirearmDelete = (firearm: FirearmRecord) => {
  setDeletingFirearm(firearm);
  setIsFirearmDeleteDialogOpen(true); // Use firearm-specific dialog
};


// Handle firearm update
const handleFirearmUpdate = (updatedFirearm: FirearmRecord) => {
  setFirearms(prev => prev.map(f => f.id === updatedFirearm.id ? updatedFirearm : f));
  updateFirearm(updatedFirearm.id, updatedFirearm);
  setIsFirearmEditDialogOpen(false);
  setEditingFirearm(null);
  
  toast({
  title: "Success",
  description: "Firearm record updated successfully",
});

// Reschedule notifications for the updated firearm if enabled
const rescheduleNotifications = async () => {
  const settings = loadNotificationSettings();
  if (settings[updatedFirearm.id] !== false) { // If notifications are enabled
    await notificationService.scheduleFirearmNotifications(updatedFirearm);
  }
};
rescheduleNotifications();
};

// Confirm firearm deletion
const confirmFirearmDelete = () => {
  if (deletingFirearm) {
    setFirearms(prev => prev.filter(f => f.id !== deletingFirearm.id));
    // Add this line to remove from localStorage
    deleteFirearm(deletingFirearm.id);
    setIsFirearmDeleteDialogOpen(false);
    setDeletingFirearm(null);
    notificationService.cancelFirearmNotifications(deletingFirearm.id);
  }
};

  // Initialize notifications on app start
const initializeNotifications = async (loadedFirearms: FirearmRecord[], loadedApplications: FirearmApplication[]) => {
  try {
    const initialized = await notificationService.initialize();
    if (!initialized) {
      console.log('Notifications not available or permission denied');
      return;
    }
    
    // Load notification settings and reschedule active notifications
    const settings = loadNotificationSettings();
    for (const firearm of loadedFirearms) {
      const isEnabled = settings[firearm.id] ?? true; // Default to enabled
      if (isEnabled) {
        await notificationService.scheduleFirearmNotifications(firearm);
      }
    }

    // Schedule application notifications for pending applications
    await notificationService.scheduleApplicationNotifications(loadedApplications);
  } catch (error) {
    console.error('Failed to initialize notifications:', error);
  }
};

// Load notification settings
const loadNotificationSettings = (): Record<string, boolean> => {
  try {
    const stored = localStorage.getItem('firearm_notification_settings');
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('Failed to load notification settings:', error);
    return {};
  }
};

// Handle notification toggle for individual firearms
const handleFirearmNotificationToggle = async (firearmId: string, enabled: boolean): Promise<void> => {
  const firearm = firearms.find(f => f.id === firearmId);
  if (!firearm) return;

  if (enabled) {
    await notificationService.scheduleFirearmNotifications(firearm);
  } else {
    await notificationService.cancelFirearmNotifications(firearmId);
  }
};





  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      {/* Theme Toggle */}
      <ThemeToggle isDarkMode={settings.isDarkMode} onToggle={handleThemeToggle} />
      
      {/* Main Container */}
      <div className="container mx-auto px-4 py-6 max-w-lg">
        {/* Header */}
        <Card className="mb-6 shadow-lg border-2">
          <CardHeader className="bg-mobile-header text-primary-foreground rounded-t-lg">
            <CardTitle className="text-center">
              <div className="flex items-center justify-center gap-3">
                <Shield className="w-6 h-6" />
                <span className="text-xl font-bold">Backlog</span>
              </div>
              <p className="text-sm mt-2 text-primary-foreground/90 font-normal">
                Track your South African firearm applications
              </p>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {/* Server Status */}
            <ServerStatus />
            
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Applications</span>
              </div>
              <Badge variant="secondary" className="font-bold">
                {applications.length}
              </Badge>
            </div>
          </CardContent>

        </Card>

        {/* Main Content Tabs */}
        <Tabs defaultValue="applications" className="mb-6">
          <TabsList className="grid w-full grid-cols-4 h-auto">
          <TabsTrigger value="applications" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2">
            <FileText className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
            <span className="text-xs sm:text-sm truncate">Apps</span>
          </TabsTrigger>
          <TabsTrigger value="firearm-status" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2">
            <Target className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
            <span className="text-xs sm:text-sm truncate">Firearms</span>
          </TabsTrigger>
          <TabsTrigger value="process" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2">
            <ListOrdered className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
            <span className="text-xs sm:text-sm truncate">Process</span>
          </TabsTrigger>
          <TabsTrigger value="app-info" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2">
            <Info className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
            <span className="text-xs sm:text-sm truncate">Info</span>
          </TabsTrigger>
        </TabsList>

          <TabsContent value="applications" className="space-y-6">
            {/* Application Form */}
            <ApplicationForm onApplicationAdded={handleApplicationAdded} />

            {/* Applications List */}
            <ApplicationList
              applications={applications}
              onApplicationDeleted={handleApplicationDeleted}
              onApplicationEdit={handleApplicationEdit}
            />
          </TabsContent>


          <TabsContent value="process">
            <div className="space-y-6">
              {/* Competency Process */}
              <Card className="w-full max-w-md mx-auto">
                <CardHeader className="bg-mobile-header text-primary-foreground rounded-t-lg">
                  <CardTitle className="text-center text-lg font-bold">
                    COMPETENCY
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <ol className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">1</span>
                      Start
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">2</span>
                      Payment
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">3</span>
                      DFO
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">4</span>
                      Provincial DFO
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">5</span>
                      CFR
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">6</span>
                      Competency Section
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">7</span>
                      CRC
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">8</span>
                      Consideration
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-6 h-6 bg-success text-white rounded-full flex items-center justify-center text-xs font-bold">9</span>
                      Finalised
                    </li>
                  </ol>
                </CardContent>
              </Card>

              {/* License Process */}
              <Card className="w-full max-w-md mx-auto">
                <CardHeader className="bg-mobile-header text-primary-foreground rounded-t-lg">
                  <CardTitle className="text-center text-lg font-bold">
                    LICENCE
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <ol className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">1</span>
                      Start
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">2</span>
                      Payment
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">3</span>
                      DFO
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">4</span>
                      Provincial DFO
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">5</span>
                      CFR
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">6</span>
                      Licensing Section
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">7</span>
                      Consideration
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-6 h-6 bg-success text-white rounded-full flex items-center justify-center text-xs font-bold">8</span>
                      Finalised
                    </li>
                  </ol>
                </CardContent>
              </Card>

              {/* Renewal Process */}
              <Card className="w-full max-w-md mx-auto">
                <CardHeader className="bg-mobile-header text-primary-foreground rounded-t-lg">
                  <CardTitle className="text-center text-lg font-bold">
                    RENEWAL
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <ol className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">1</span>
                      Start
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">2</span>
                      Payment
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">3</span>
                      In Process
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-6 h-6 bg-success text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
                      Finalised
                    </li>
                  </ol>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="app-info">
            <Card className="w-full max-w-md mx-auto">
              <CardHeader className="bg-mobile-header text-primary-foreground rounded-t-lg">
                <CardTitle className="text-center text-lg font-bold">
                  App Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-4 text-sm">
                  <p>
                    <strong>Backlog</strong> is designed to help South African firearm license holders 
                    track their applications and manage their firearm records.
                  </p>
                  <p>
                    <strong>Features:</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Track firearm application status</li>
                    <li>Calculate working days pending</li>
                    <li>Multiple search methods supported</li>
                    <li>Manage firearm records and expiry dates</li>
                    <li>Dark/Light mode toggle</li>
                    <li>Offline storage</li>
                  </ul>
                  <p>
                    <strong>Data Privacy:</strong> All data is stored locally on your device. 
                    No information is sent to external servers except when checking application status.
                  </p>
                  <p>
                    <strong>Legal Notice:</strong> This app is not affiliated with SAPS. 
                    Status information is fetched from the official SAPS website.
                  </p>
                  <p>
                  <strong>Bug Reporting:</strong> Found an issue or something not working as expected? 
                  Please report it so I can fix it and improve the app. 
                  You can reach out via WhatsApp or call at  <span> </span>
                  <a href="https://wa.me/27812663246" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline" >+27 81 266 3246</a> 
                  <span> </span>or email me directly at <span> </span>
                  <a href="mailto:jjoubert@fibco.co.za" className="text-blue-600 hover:underline">jjoubert@fibco.co.za</a>.
                  
                </p>
                </div>
              </CardContent>
              </Card>
            <Card className="w-full max-w-md mx-auto">
            <CardHeader className="bg-mobile-header text-primary-foreground rounded-t-lg">
              <CardTitle className="text-center text-lg font-bold">
                Developer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-4 text-sm">
                <p>
                  Made with ❤️ by Jonathan Joubert 🇿🇦
                </p>
                <p>
                  South African software developer passionate about building tools that 
                  empower the local firearm community. This project was built to simplify 
                  application tracking and provide transparency.
                </p>
                  
                  <p>
                  <strong > Apple iOS availability:</strong>{" "}
                     <span >
                       An iOS version is planned for the near future.
                       Publishing and maintaining apps on the Apple App Store involves significant hosting and licensing costs, and community support helps make this possible.
                       </span>
                       </p>

                <p>
                  <strong>Support the Project: </strong>  
                   This app is free and developed for the community. If you’d like to 
                  support future development, please consider making a secure donation via my 
                  website, or via Stripe.
                </p>
                

                <p>
                  <strong>Website:</strong>{" "}
                  <a
                    href="https://jjoubert.fibco.co.za"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    https://jjoubert.fibco.co.za
                  </a>
                  <br />
                  
                   <p>
                     <strong>Stripe:</strong> <span> </span>
                     <a
                       href='https://buymeacoffee.com/jonathan.joubert'
                       target='_blank'
                       rel="noopener noreferrer"
                       className="text-blue-500 hover:underline"
                     >
                       Buy me a coffee
                     </a>
                   </p>
                   
                   <p className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                     <strong className="text-blue-800 dark:text-blue-200">🔥 firearmpro.org.za:</strong>{" "}
                     <span className="text-blue-700 dark:text-blue-300">
                       Looking for more professional firearm tools and services? 
                       Visit <a href="https://firearmpro.org.za" target="_blank" rel="noopener noreferrer" className="underline font-semibold">firearmpro.org.za</a> for 
                       advanced features, compliance tools, and expert services designed specifically for South Africa's firearm community.
                     </span>         
                       
                   </p>

                   
                 </p>
              </div>
            </CardContent>
          </Card>
          </TabsContent>

          <TabsContent value="firearm-status">
            <div className="space-y-6">
              {/* Add Firearm Form */}
              <Card className="w-full max-w-md mx-auto">
                <CardHeader className="bg-mobile-header text-primary-foreground rounded-t-lg">
                  <CardTitle className="text-center text-lg font-bold">
                    Add Firearm Record
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <form onSubmit={handleFirearmSubmit} className="space-y-4">
                    {formError && (
                        <div className="p-3 bg-red-100 dark:bg-red-900 rounded text-sm text-red-800 dark:text-red-200">
                          {formError}
                        </div>
                      )}
                    <div className="space-y-2">
                      <Label htmlFor="firearm-title" className="text-sm font-medium">
                        Title <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="firearm-title"
                        value={firearmForm.title}
                        onChange={(e) => setFirearmForm(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="e.g., Glock 19"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="firearm-issue-date" className="text-sm font-medium">
                        Issue Date <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="firearm-issue-date"
                        type="date"
                        value={firearmForm.issueDate}
                        onChange={(e) => setFirearmForm(prev => ({ ...prev, issueDate: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="firearm-section" className="text-sm font-medium">
                        Section <span className="text-red-500">*</span>
                      </Label>
                      <Select value={firearmForm.section} onValueChange={(value) => setFirearmForm(prev => ({ ...prev, section: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select section" />
                        </SelectTrigger>
                        <SelectContent>
                          {SECTION_OPTIONS.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="firearm-make" className="text-sm font-medium">
                        Make
                      </Label>
                      <Input
                        id="firearm-make"
                        value={firearmForm.make}
                        onChange={(e) => setFirearmForm(prev => ({ ...prev, make: e.target.value }))}
                        placeholder="e.g., Glock"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="firearm-serial" className="text-sm font-medium">
                        Serial Number
                      </Label>
                      <Input
                        id="firearm-serial"
                        value={firearmForm.serialNumber}
                        onChange={(e) => setFirearmForm(prev => ({ ...prev, serialNumber: e.target.value }))}
                        placeholder="Enter serial number"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="firearm-notes" className="text-sm font-medium">
                        Notes
                      </Label>
                      <Textarea
                        id="firearm-notes"
                        value={firearmForm.notes}
                        onChange={(e) => setFirearmForm(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Additional information..."
                        rows={3}
                      />
                    </div>

                    <Button type="submit" variant="mobile" className="w-full">
                      Add Firearm
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Firearm Records List */}
              {firearms.length > 0 && (
                <div className="space-y-4">
                  {firearms.map(firearm => {
  const renewal = getRenewalStatus(firearm.expiryDate);
  return (
    <Card key={firearm.id} className="w-full max-w-md mx-auto">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-lg font-semibold text-primary">{firearm.title}</h3>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleFirearmEdit(firearm)}
              className="h-8 w-8 p-0"
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
            variant="ghost"
            size="sm"
            onClick={() => handleFirearmDelete(firearm)}
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
          </div>
        </div>

        {/* Enhanced Renewal Status - Large Text */}
        <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
          <div className={`text-2xl font-bold mb-2 ${renewal.colorClass}`}>
            {renewal.status}
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className={`text-xl font-semibold ${renewal.colorClass}`}>
                {Math.abs(renewal.calendarDaysLeft)}
              </div>
              <div className="text-gray-600 dark:text-gray-400">
                {renewal.calendarDaysLeft < 0 ? 'days overdue' : 'calendar days left'}
              </div>
            </div>
            <div>
              <div className={`text-xl font-semibold ${renewal.colorClass}`}>
                {Math.abs(renewal.workingDaysLeft)}
              </div>
              <div className="text-gray-600 dark:text-gray-400">
                {renewal.workingDaysLeft < 0 ? 'working days overdue' : 'working days left'}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
          <div><span className="font-medium">Issue Date:</span> {firearm.issueDate}</div>
          <div><span className="font-medium">Expiry Date:</span> {firearm.expiryDate}</div>
          <div><span className="font-medium">Section:</span> {SECTION_OPTIONS.find(s => s.value === firearm.section)?.label.split(' - ')[0] || firearm.section}</div>
          {firearm.make && <div><span className="font-medium">Make:</span> {firearm.make}</div>}
          {firearm.serialNumber && <div><span className="font-medium">Serial:</span> {firearm.serialNumber}</div>}
        </div>
        
        {firearm.notes && (
          <div className="mt-3 p-2 bg-muted rounded text-sm">
            <span className="font-medium">Notes:</span> {firearm.notes}
          </div>
        )}
      </CardContent>
    </Card>
  );
})}
                </div>
              )}

              {firearms.length === 0 && (
                <Card className="w-full max-w-md mx-auto">
                  <CardContent className="p-6 text-center">
                    <p className="text-muted-foreground">No firearm records yet.</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Add your first firearm record above to track expiry dates.
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Notification Settings under Firearms */}
              <div className="mt-6">
                <NotificationSettings
                  firearms={firearms}
                  onFirearmNotificationToggle={handleFirearmNotificationToggle}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer Info */}
        <Card className="mt-8 bg-muted/50">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">
              This app fetches status from the official SAPS website.
              <br />
              Working days exclude weekends and SA public holidays.
              <br />
              By: <a href='https://jjoubert.fibco.co.za' target='_blank' className='underline'>Jonathan Joubert</a> — for South Africa’s firearm community 🇿🇦
              
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <EditApplicationDialog
        application={editingApplication}
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false);
          setEditingApplication(null);
        }}
        onApplicationUpdated={handleApplicationUpdated}
      />

      <EditFirearmDialog
      
        firearm={editingFirearm}
        isOpen={isFirearmEditDialogOpen}
        onClose={() => {
          setIsFirearmEditDialogOpen(false);
          setEditingFirearm(null);
        }}
        onUpdate={handleFirearmUpdate}
        existingFirearms={firearms}
      />

      {/* FIREARM Delete Confirmation Dialog - separate from application */}
      <DeleteConfirmDialog
        firearm={deletingFirearm}
        isOpen={isFirearmDeleteDialogOpen}
        onClose={() => {
          setIsFirearmDeleteDialogOpen(false);
          setDeletingFirearm(null);
        }}
        onConfirm={confirmFirearmDelete}
      />

      
    </div>
    
  );
};