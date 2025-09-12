// Firearm status display component
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FirearmStatus } from '@/types/firearm';
import { X, AlertTriangle, Calendar, Clock, Info, ArrowRight } from 'lucide-react';

interface StatusDisplayProps {
  status: FirearmStatus | null;
  error: string | null;
  onClose: () => void;
}

export const StatusDisplay: React.FC<StatusDisplayProps> = ({ status, error, onClose }) => {
  if (error) {
    return (
      <Card className="w-full max-w-md mx-auto border-destructive shadow-lg">
        <CardHeader className="pb-3 bg-destructive text-destructive-foreground rounded-t-lg">
          <CardTitle className="flex items-center justify-between text-base">
            <span className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Status Check Failed
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0 text-destructive-foreground hover:bg-destructive/80"
            >
              <X className="w-4 h-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!status) return null;

  const getStatusVariant = (statusText: string): "default" | "secondary" | "destructive" | "outline" => {
    const lowerStatus = statusText.toLowerCase();
    if (lowerStatus.includes('approved') || lowerStatus.includes('complete')) return "default";
    if (lowerStatus.includes('pending') || lowerStatus.includes('processing')) return "secondary";
    if (lowerStatus.includes('rejected') || lowerStatus.includes('denied')) return "destructive";
    return "outline";
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-xl border-2 bg-mobile-status">
      <CardHeader className="pb-3 bg-mobile-header text-primary-foreground rounded-t-lg">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            Application Status
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0 text-primary-foreground hover:bg-primary-hover"
          >
            <X className="w-4 h-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-4 space-y-4">
        {/* Working Days Alert */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
          <Clock className="w-5 h-5 text-muted-foreground" />
          <div className="flex-1">
            <p className="text-sm font-medium">
              {status.workingDaysPending} working days pending
            </p>
            {status.isOverdue && (
              <div className="flex items-center gap-2 mt-2 p-2 bg-mobile-danger text-white rounded-md">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-bold">
                  Application pending over 90 working days!
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Status Information Grid */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <label className="font-medium text-muted-foreground">Type</label>
              <p className="mt-1">{status.type}</p>
            </div>
            <div>
              <label className="font-medium text-muted-foreground">Number</label>
              <p className="mt-1">{status.number}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <label className="font-medium text-muted-foreground">Calibre</label>
              <p className="mt-1">{status.calibre}</p>
            </div>
            <div>
              <label className="font-medium text-muted-foreground">Make</label>
              <p className="mt-1">{status.make}</p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="font-medium text-muted-foreground">Current Status</label>
            <Badge variant={getStatusVariant(status.status)} className="text-sm">
              {status.status}
            </Badge>
          </div>

          {status.description && (
            <div className="space-y-2">
              <label className="font-medium text-muted-foreground">Description</label>
              <p className="text-sm bg-muted p-3 rounded-md">{status.description}</p>
            </div>
          )}

          {status.nextStep && (
            <div className="space-y-2">
              <label className="font-medium text-muted-foreground">Next Step</label>
              <div className="flex items-start gap-2 text-sm bg-accent p-3 rounded-md">
                <ArrowRight className="w-4 h-4 mt-0.5 text-accent-foreground" />
                <p className="text-accent-foreground">{status.nextStep}</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};