import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { HelpCircle } from 'lucide-react';

interface ProcessDefinition {
  term: string;
  definition: string;
  details?: string;
}

const processDefinitions: Record<string, ProcessDefinition> = {
  'DFO': {
    term: 'DFO',
    definition: 'Designated Firearms Officer',
    details: 'A police officer specifically trained and designated to handle firearm applications at a local police station level.'
  },
  'Provincial DFO': {
    term: 'Provincial DFO',
    definition: 'Provincial Designated Firearms Officer',
    details: 'A senior DFO who oversees firearm applications at the provincial level, reviewing applications that have been processed by local DFOs.'
  },
  'CFR': {
    term: 'CFR',
    definition: 'Central Firearms Registry',
    details: 'The central database and processing unit for all firearm applications in South Africa, located in Pretoria.'
  },
  'CFR (AVS)': {
    term: 'CFR (AVS)',
    definition: 'Central Firearms Registry - Application Verification System',
    details: 'The automated verification system used by CFR to check and validate firearm application details and supporting documents.'
  },
  'Send to CFR (AVS)': {
    term: 'Send to CFR (AVS)',
    definition: 'Application sent to Central Firearms Registry for automated verification',
    details: 'Your application has been forwarded to the Central Firearms Registry where it will undergo automated verification checks through their Application Verification System.'
  },
  'Competency Section': {
    term: 'Competency Section',
    definition: 'Firearm Competency Verification Unit',
    details: 'The section responsible for verifying that applicants have completed the required firearm competency training and certification.'
  },
  'CRC': {
    term: 'CRC',
    definition: 'Criminal Record Centre',
    details: 'The unit that conducts background checks and criminal record verification for firearm applicants.'
  },
  'Licensing Section': {
    term: 'Licensing Section',
    definition: 'Firearm Licensing Department',
    details: 'The department responsible for final review and approval of firearm license applications after all checks are completed.'
  },
  'Consideration': {
    term: 'Consideration',
    definition: 'Final Review and Decision Phase',
    details: 'The final stage where all application materials are reviewed by authorized personnel to make a decision on approval or rejection.'
  },
  'In Process': {
    term: 'In Process',
    definition: 'Application Under Review',
    details: 'Your application is currently being processed and reviewed by the relevant department or section.'
  }
};

interface ProcessDefinitionButtonProps {
  term: string;
  children: React.ReactNode;
}

export const ProcessDefinitionButton: React.FC<ProcessDefinitionButtonProps> = ({ term, children }) => {
  const [open, setOpen] = React.useState(false);
  const definition = processDefinitions[term];

  if (!definition) {
    return <>{children}</>;
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="p-0 h-auto text-left justify-start hover:bg-transparent hover:text-primary"
        onClick={() => setOpen(true)}
      >
        <div className="flex items-center gap-1">
          {children}
          <HelpCircle className="w-3 h-3 opacity-60" />
        </div>
      </Button>
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {definition.term}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="font-semibold text-primary">
              {definition.definition}
            </p>
            {definition.details && (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {definition.details}
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};