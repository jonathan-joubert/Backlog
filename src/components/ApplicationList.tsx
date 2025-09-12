// Firearm applications list component
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { FirearmApplication, FirearmStatus, FirearmRecord } from '@/types/firearm';
import { deleteApplication } from '@/utils/storage';
import { fetchFirearmStatus } from '@/utils/statusFetcher';
import { StatusDisplay } from './StatusDisplay';
import { calculateWorkingDays } from '@/utils/holidays';
import { Pencil, Trash2, Search, Calendar, Hash, User, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';


// Check if current time is during planned downtime (00:00-00:30 SAST)
const isSASTPlannedDowntime = (): boolean => {
  const now = new Date();
  const sastOffset = 2 * 60; // SAST is UTC+2
  const sastTime = new Date(now.getTime() + sastOffset * 60 * 1000);
  const hours = sastTime.getUTCHours();
  const minutes = sastTime.getUTCMinutes();
  

  
  return hours === 0 && minutes >= 0 && minutes < 30;
};

const DeleteConfirmDialog: React.FC<{
  firearm: FirearmApplication | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}> = ({ firearm, isOpen, onClose, onConfirm }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-center text-red-600">
            Delete Firearm Application
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
                This will permanently delete application with reference number: "{firearm?.applicationRefNumber}" and cannot be undone.
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






interface ApplicationListProps {
  applications: FirearmApplication[];
  onApplicationDeleted: (id: string) => Promise<void>;
  onApplicationEdit: (application: FirearmApplication) => void;
}

export const ApplicationList: React.FC<ApplicationListProps> = ({
  applications,
  onApplicationDeleted,
  onApplicationEdit,
}) => {
  const { toast } = useToast();
  const [loadingStatus, setLoadingStatus] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState<FirearmStatus | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<FirearmApplication | null>(null);

  const handleDeleteClick = (application: FirearmApplication) => {
    setSelectedApp(application);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
  if (!selectedApp) return;

  const success = deleteApplication(selectedApp.id);
  if (success) {
    await onApplicationDeleted(selectedApp.id);
    toast({
      title: "Success",
      description: "Application deleted successfully",
    });
  } else {
    toast({
      title: "Error",
      description: "Failed to delete application",
      variant: "destructive",
    });
  }

  setDeleteDialogOpen(false);
  setSelectedApp(null);
};


  const handleCheckStatus = async (application: FirearmApplication) => {
    if (isSASTPlannedDowntime()) {
      setStatusError('Planned server downtime. Try again after 01:00 SAST.');
      return;
    }

    setLoadingStatus(application.id);
    setCurrentStatus(null);
    setStatusError(null);

    try {
      // Build search parameters based on search method (default to REF_ID for backward compatibility)
      const searchMethod = application.searchMethod || 'REF_ID';
      let params = {};
      
      switch (searchMethod) {
        case 'REF_ID':
          params = {
            fref: application.applicationRefNumber,
            frid: application.idNumber,
          };
          break;
        case 'SERIAL_REF':
          params = {
            fserial: application.serialNumber || '',
            fsref: application.gunReference || '',
          };
          break;
        case 'ID_SERIAL':
          params = {
            fid: application.idNumber,
            fiserial: application.serialNumber || '',
          };
          break;
      }

      const result = await fetchFirearmStatus(params, application.dateApplied);

      if (result.success && result.status) {
        setCurrentStatus(result.status);
        toast({
          title: "Status Retrieved",
          description: `Status: ${result.status.status}`,
        });
      } else {
        setStatusError(result.error || 'Failed to fetch status');
        toast({
          title: "Status Check Failed",
          description: result.error || 'Unable to retrieve status',
          variant: "destructive",
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setStatusError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoadingStatus(null);
    }
  };

  if (applications.length === 0) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-8 text-center">
          <div className="text-muted-foreground">
            <Hash className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No Applications Yet</p>
            <p className="text-sm mt-2">Add your first firearm application above</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      <h2 className="text-xl font-bold text-center mb-4">Your Applications</h2>
      
      {applications.map((application) => (
        <Card key={application.id} className="shadow-md border-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Hash className="w-4 h-4" />
                {application.applicationRefNumber}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onApplicationEdit(application)}
                  className="h-8 w-8 p-0"
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteClick(application)}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>

              </div>
            </CardTitle>
          </CardHeader>
          
           <CardContent className="space-y-3">
            {application.title && (
              <div className="mb-2">
                <span className="text-lg font-semibold text-primary">{application.title}</span>
              </div>
            )}
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span>ID: {application.idNumber}</span>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>Applied: {format(new Date(application.dateApplied), 'dd MMM yyyy')}</span>
                </div>
                {(() => {
                  const workingDays = calculateWorkingDays(new Date(application.dateApplied), new Date());
                  return (
                    <div className="flex items-center gap-2 ml-6">
                      <span className="text-xs text-muted-foreground">
                        working days: {workingDays}
                      </span>
                      {workingDays > 90 && (
                        <div className="flex items-center gap-1 text-xs text-warning">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Application pending more than 90 days</span>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>

            <Button
              variant="mobile"
              className="w-full"
              onClick={() => handleCheckStatus(application)}
              disabled={loadingStatus === application.id}
            >
              {loadingStatus === application.id ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Checking Status...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  Check Status
                </div>
              )}
            </Button>
          </CardContent>
        </Card>
      ))}

      {/* Status Display */}
      {(currentStatus || statusError) && (
        <StatusDisplay 
          status={currentStatus} 
          error={statusError}
          onClose={() => {
            setCurrentStatus(null);
            setStatusError(null);
          }}
        />
      )}

      <DeleteConfirmDialog
        firearm={selectedApp}
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
      />


    </div>
  );
};