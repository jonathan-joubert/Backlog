import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FirearmApplication } from '@/types/firearm';
import { DollarSign, Plus, Edit, Receipt } from 'lucide-react';
import { toast } from 'sonner';

interface CostTrackerProps {
  applications: FirearmApplication[];
  onUpdateApplication: (application: FirearmApplication) => void;
}

export const CostTracker: React.FC<CostTrackerProps> = ({ applications, onUpdateApplication }) => {
  const [selectedApp, setSelectedApp] = useState<FirearmApplication | null>(null);
  const [cost, setCost] = useState('');
  const [notes, setNotes] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleUpdateCost = () => {
    if (!selectedApp) return;
    
    const costValue = parseFloat(cost) || 0;
    const updatedApp = {
      ...selectedApp,
      cost: costValue,
      notes: notes.trim() || undefined
    };
    
    onUpdateApplication(updatedApp);
    toast.success('Cost information updated successfully');
    setIsDialogOpen(false);
    setCost('');
    setNotes('');
    setSelectedApp(null);
  };

  const openDialog = (app: FirearmApplication) => {
    setSelectedApp(app);
    setCost(app.cost ? app.cost.toString() : '');
    setNotes(app.notes || '');
    setIsDialogOpen(true);
  };

  const totalCosts = applications.reduce((sum, app) => sum + (app.cost || 0), 0);
  const appsWithCosts = applications.filter(app => app.cost && app.cost > 0);

  // Common application fees for reference
  const commonFees = [
    { type: 'Competency Certificate', amount: 2500 },
    { type: 'License Application', amount: 2500 },
    { type: 'Renewal', amount: 850 },
    { type: 'Temporary Authorization', amount: 850 },
    { type: 'Permit to Possess', amount: 2500 },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          Cost Tracking
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">Total Spent</p>
            <p className="text-2xl font-bold">R{totalCosts.toLocaleString()}</p>
          </div>
          <div className="text-center p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">Applications Tracked</p>
            <p className="text-2xl font-bold">{appsWithCosts.length}/{applications.length}</p>
          </div>
        </div>

        {/* Common Fees Reference */}
        <div>
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <Receipt className="w-4 h-4" />
            Common Fees (Reference)
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {commonFees.map((fee) => (
              <div key={fee.type} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                <span className="text-sm">{fee.type}</span>
                <Badge variant="outline">R{fee.amount.toLocaleString()}</Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Applications List */}
        <div>
          <h4 className="font-semibold mb-2">Your Applications</h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {applications.map((app) => (
              <div key={app.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{app.applicationRefNumber}</p>
                  <p className="text-xs text-muted-foreground">{app.applicationType || 'Application'}</p>
                  {app.notes && (
                    <p className="text-xs text-muted-foreground italic mt-1">{app.notes}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {app.cost ? (
                    <Badge variant="outline">R{app.cost.toLocaleString()}</Badge>
                  ) : (
                    <Badge variant="secondary">No cost set</Badge>
                  )}
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => openDialog(app)}
                  >
                    {app.cost ? <Edit className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cost Entry Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {selectedApp?.cost ? 'Update' : 'Add'} Cost Information
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="app-ref">Application</Label>
                <Input 
                  id="app-ref"
                  value={selectedApp?.applicationRefNumber || ''} 
                  disabled 
                />
              </div>
              <div>
                <Label htmlFor="cost">Cost (R)</Label>
                <Input
                  id="cost"
                  type="number"
                  placeholder="0.00"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional details about costs, fees, etc."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleUpdateCost} className="flex-1">
                  {selectedApp?.cost ? 'Update' : 'Add'} Cost
                </Button>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};