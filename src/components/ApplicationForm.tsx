// Firearm application form component
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { FirearmApplication, SearchMethod } from '@/types/firearm';
import { addApplication, loadApplications } from '@/utils/storage';

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

interface ApplicationFormProps {
  onApplicationAdded: (application: FirearmApplication) => void;
}

export const ApplicationForm: React.FC<ApplicationFormProps> = ({ onApplicationAdded }) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    applicationRefNumber: '',
    idNumber: '',
    dateApplied: '',
    searchMethod: 'REF_ID' as SearchMethod,
    serialNumber: '',
    gunReference: '',
    title: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check for duplicate applications
  const isDuplicateApplication = (): boolean => {
    const existingApps = loadApplications();
    return existingApps.some(app => {
      if (formData.searchMethod === 'REF_ID') {
        return app.applicationRefNumber === formData.applicationRefNumber && 
               app.idNumber === formData.idNumber;
      } else if (formData.searchMethod === 'SERIAL_REF') {
        return app.serialNumber === formData.serialNumber && 
               app.gunReference === formData.gunReference;
      } else if (formData.searchMethod === 'ID_SERIAL') {
        return app.idNumber === formData.idNumber && 
               app.serialNumber === formData.serialNumber;
      }
      return false;
    });
  };

  // Form validation
  const validateForm = (): boolean => {
    // Check for duplicates
    if (isDuplicateApplication()) {
      toast({
        title: "Duplicate Application",
        description: "An application with these details already exists",
        variant: "destructive",
      });
      return false;
    }

    // Validate ID numbers for South African format
    if (formData.idNumber && !isValidSouthAfricanID(formData.idNumber)) {
      toast({
        title: "Invalid ID Number",
        description: "Please enter a valid 13-digit South African ID number",
        variant: "destructive",
      });
      return false;
    }

    // Validate based on search method
    switch (formData.searchMethod) {
      case 'REF_ID':
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
        break;
      case 'SERIAL_REF':
        if (!formData.serialNumber?.trim()) {
          toast({
            title: "Validation Error",
            description: "Gun Serial Number is required",
            variant: "destructive",
          });
          return false;
        }
        if (!formData.gunReference?.trim()) {
          toast({
            title: "Validation Error",
            description: "Reference Number is required",
            variant: "destructive",
          });
          return false;
        }
        break;
      case 'ID_SERIAL':
        if (!formData.idNumber.trim()) {
          toast({
            title: "Validation Error",
            description: "ID/Institution Number is required",
            variant: "destructive",
          });
          return false;
        }
        if (!formData.serialNumber?.trim()) {
          toast({
            title: "Validation Error",
            description: "Gun Serial Number is required",
            variant: "destructive",
          });
          return false;
        }
        break;
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
    today.setHours(23, 59, 59, 999); // End of today
    
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
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const newApplication = addApplication(formData);
      onApplicationAdded(newApplication);
      
      // Reset form
      setFormData({
        applicationRefNumber: '',
        idNumber: '',
        dateApplied: '',
        searchMethod: 'REF_ID',
        serialNumber: '',
        gunReference: '',
        title: '',
      });
      
      toast({
        title: "Success",
        description: "Firearm application saved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save application. Please try again.",
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

  const handleSearchMethodChange = (value: SearchMethod) => {
    setFormData(prev => ({
      ...prev,
      searchMethod: value,
    }));
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg border-2">
      <CardHeader className="bg-mobile-header text-primary-foreground rounded-t-lg">
        <CardTitle className="text-center text-lg font-bold">
          Add Firearm Application
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">
              Custom Title (Optional)
            </Label>
            <Input
              id="title"
              type="text"
              value={formData.title}
              onChange={handleInputChange('title')}
              placeholder="e.g., 300 Win Mag"
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="searchMethod" className="text-sm font-medium">
              Search Method <span style={{color: '#FF0000'}}>*</span>
            </Label>
            <Select value={formData.searchMethod} onValueChange={handleSearchMethodChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select search method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="REF_ID">Application Ref + ID</SelectItem>
                <SelectItem value="SERIAL_REF">Serial + Application Ref</SelectItem>
                <SelectItem value="ID_SERIAL">ID + Serial</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* REF_ID Fields */}
          {formData.searchMethod === 'REF_ID' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="appRef" className="text-sm font-medium">
                  Application Reference Number <span style={{color: '#FF0000'}}>*</span>
                </Label>
                <Input
                  id="appRef"
                  type="text"
                  value={formData.applicationRefNumber}
                  onChange={handleInputChange('applicationRefNumber')}
                  placeholder="Enter reference number"
                  className="w-full"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="idNumber" className="text-sm font-medium">
                  ID/Institution Number <span style={{color: '#FF0000'}}>*</span>
                </Label>
                <Input
                  id="idNumber"
                  type="text"
                  value={formData.idNumber}
                  onChange={handleInputChange('idNumber')}
                  placeholder="Enter ID or institution number"
                  className="w-full"
                  required
                />
              </div>
            </>
          )}

          {/* SERIAL_REF Fields */}
          {formData.searchMethod === 'SERIAL_REF' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="serialNumber" className="text-sm font-medium">
                  Gun Serial Number <span style={{color: '#FF0000'}}>*</span>
                </Label>
                <Input
                  id="serialNumber"
                  type="text"
                  value={formData.serialNumber}
                  onChange={handleInputChange('serialNumber')}
                  placeholder="Enter gun serial number"
                  className="w-full"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gunReference" className="text-sm font-medium">
                  Application Reference Number <span style={{color: '#FF0000'}}>*</span>
                </Label>
                <Input
                  id="gunReference"
                  type="text"
                  value={formData.gunReference}
                  onChange={handleInputChange('gunReference')}
                  placeholder="Enter reference number"
                  className="w-full"
                  required
                />
              </div>
            </>
          )}

          {/* ID_SERIAL Fields */}
          {formData.searchMethod === 'ID_SERIAL' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="idNumber" className="text-sm font-medium">
                  ID/Institution Number <span style={{color: '#FF0000'}}>*</span>
                </Label>
                <Input
                  id="idNumber"
                  type="text"
                  value={formData.idNumber}
                  onChange={handleInputChange('idNumber')}
                  placeholder="Enter ID or institution number"
                  className="w-full"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="serialNumber" className="text-sm font-medium">
                  Gun Serial Number <span style={{color: '#FF0000'}}>*</span>
                </Label>
                <Input
                  id="serialNumber"
                  type="text"
                  value={formData.serialNumber}
                  onChange={handleInputChange('serialNumber')}
                  placeholder="Enter gun serial number"
                  className="w-full"
                  required
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="dateApplied" className="text-sm font-medium">
              Date Applied <span style={{color: '#FF0000'}}>*</span>
            </Label>
            <Input
              id="dateApplied"
              type="date"
              value={formData.dateApplied}
              onChange={handleInputChange('dateApplied')}
              className="w-full"
              max={new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          <Button
            type="submit"
            variant="mobile"
            className="w-full mt-6"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save Application'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};