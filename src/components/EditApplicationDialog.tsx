// Edit application dialog component
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { FirearmApplication } from '@/types/firearm';
import { updateApplication, loadApplications } from '@/utils/storage';

// South African ID validation
const isValidSouthAfricanID = (id: string): boolean => {
  if (!/^\d{13}$/.test(id)) return false;
  
  // Extract date parts
  const year = parseInt(id.substring(0, 2));
  const month = parseInt(id.substring(2, 4));
  const day = parseInt(id.substring(4, 6));
  
  // Validate date parts
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  
  // Luhn checksum
  const digits = id.split('').map(Number);
  let sum = 0;
  
  for (let i = 0; i < 12; i++) {
    if (i % 2 === 0) {
      sum += digits[i];
    } else {
      const doubled = digits[i] * 2;
      sum += doubled > 9 ? doubled - 9 : doubled;
    }
  }
  
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === digits[12];
};

interface EditApplicationDialogProps {
  application: FirearmApplication | null;
  isOpen: boolean;
  onClose: () => void;
  onApplicationUpdated: (application: FirearmApplication) => Promise<void>;
}

export const EditApplicationDialog: React.FC<EditApplicationDialogProps> = ({
  application,
  isOpen,
  onClose,
  onApplicationUpdated,
}) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    applicationRefNumber: '',
    idNumber: '',
    dateApplied: '',
    title: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update form when application changes
  useEffect(() => {
    if (application) {
      setFormData({
        applicationRefNumber: application.applicationRefNumber,
        idNumber: application.idNumber,
        dateApplied: application.dateApplied,
        title: application.title || '',
      });
    }
  }, [application]);

  const validateForm = (): boolean => {
    // Validate ID numbers for South African format
    if (formData.idNumber && !isValidSouthAfricanID(formData.idNumber)) {
      toast({
        title: "Invalid ID Number",
        description: "Please enter a valid 13-digit South African ID number",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.applicationRefNumber.trim()) {
      toast({
        title: "Validation Error",
        description: "Application Reference Number is required",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.idNumber.trim()) {
      toast({
        title: "Validation Error",
        description: "ID/Institution Number is required",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.dateApplied) {
      toast({
        title: "Validation Error",
        description: "Date Applied is required",
        variant: "destructive",
      });
      return false;
    }

    // Validate date is not in the future
    const appliedDate = new Date(formData.dateApplied);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    if (appliedDate > today) {
      toast({
        title: "Validation Error",
        description: "Date Applied cannot be in the future",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!application || !validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const success = updateApplication(application.id, formData);
      
      if (success) {
        const updatedApplication: FirearmApplication = {
          ...application,
          ...formData,
        };
        
        await onApplicationUpdated(updatedApplication);
        onClose();
        
        toast({
          title: "Success",
          description: "Application updated successfully",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to update application",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-center">
            Edit Application
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title" className="text-sm font-medium">
              Custom Title (Optional)
            </Label>
            <Input
              id="edit-title"
              type="text"
              value={formData.title}
              onChange={handleInputChange('title')}
              placeholder="e.g., 300 Win Mag"
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-appRef" className="text-sm font-medium">
              Application Reference Number *
            </Label>
            <Input
              id="edit-appRef"
              type="text"
              value={formData.applicationRefNumber}
              onChange={handleInputChange('applicationRefNumber')}
              placeholder="Enter reference number"
              className="w-full"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-idNumber" className="text-sm font-medium">
              ID/Institution Number *
            </Label>
            <Input
              id="edit-idNumber"
              type="text"
              value={formData.idNumber}
              onChange={handleInputChange('idNumber')}
              placeholder="Enter ID or institution number"
              className="w-full"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-dateApplied" className="text-sm font-medium">
              Date Applied *
            </Label>
            <Input
              id="edit-dateApplied"
              type="date"
              value={formData.dateApplied}
              onChange={handleInputChange('dateApplied')}
              className="w-full"
              max={new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="mobile"
              className="flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Updating...' : 'Update'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};