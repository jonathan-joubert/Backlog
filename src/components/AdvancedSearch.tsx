import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FirearmApplication } from '@/types/firearm';
import { Search, Filter, X, Calendar, DollarSign } from 'lucide-react';
import { format, isAfter, isBefore, parseISO } from 'date-fns';

interface AdvancedSearchProps {
  applications: FirearmApplication[];
  onFilteredResults: (filteredApps: FirearmApplication[]) => void;
}

interface SearchFilters {
  reference: string;
  status: string;
  type: string;
  dateFrom: string;
  dateTo: string;
  minCost: string;
  maxCost: string;
  minDays: string;
  maxDays: string;
}

export const AdvancedSearch: React.FC<AdvancedSearchProps> = ({ 
  applications, 
  onFilteredResults 
}) => {
  const [filters, setFilters] = useState<SearchFilters>({
    reference: '',
    status: '',
    type: '',
    dateFrom: '',
    dateTo: '',
    minCost: '',
    maxCost: '',
    minDays: '',
    maxDays: '',
  });

  const [isExpanded, setIsExpanded] = useState(false);

  // Get unique values for dropdowns
  const uniqueStatuses = [...new Set(applications.map(app => app.currentStatus).filter(Boolean))];
  const uniqueTypes = [...new Set(applications.map(app => app.applicationType).filter(Boolean))];

  const applyFilters = () => {
    let filtered = applications;

    // Text search in reference
    if (filters.reference) {
      filtered = filtered.filter(app => 
        app.applicationRefNumber.toLowerCase().includes(filters.reference.toLowerCase())
      );
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter(app => app.currentStatus === filters.status);
    }

    // Type filter
    if (filters.type) {
      filtered = filtered.filter(app => app.applicationType === filters.type);
    }

    // Date range filter
    if (filters.dateFrom) {
      filtered = filtered.filter(app => 
        isAfter(parseISO(app.dateApplied), parseISO(filters.dateFrom)) ||
        app.dateApplied === filters.dateFrom
      );
    }
    if (filters.dateTo) {
      filtered = filtered.filter(app => 
        isBefore(parseISO(app.dateApplied), parseISO(filters.dateTo)) ||
        app.dateApplied === filters.dateTo
      );
    }

    // Cost range filter
    if (filters.minCost) {
      const minCost = parseFloat(filters.minCost);
      filtered = filtered.filter(app => (app.cost || 0) >= minCost);
    }
    if (filters.maxCost) {
      const maxCost = parseFloat(filters.maxCost);
      filtered = filtered.filter(app => (app.cost || 0) <= maxCost);
    }

    // Days pending range filter
    if (filters.minDays) {
      const minDays = parseInt(filters.minDays);
      filtered = filtered.filter(app => (app.workingDaysPending || 0) >= minDays);
    }
    if (filters.maxDays) {
      const maxDays = parseInt(filters.maxDays);
      filtered = filtered.filter(app => (app.workingDaysPending || 0) <= maxDays);
    }

    onFilteredResults(filtered);
  };

  const clearFilters = () => {
    setFilters({
      reference: '',
      status: '',
      type: '',
      dateFrom: '',
      dateTo: '',
      minCost: '',
      maxCost: '',
      minDays: '',
      maxDays: '',
    });
    onFilteredResults(applications);
  };

  const updateFilter = (key: keyof SearchFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Count active filters
  const activeFiltersCount = Object.values(filters).filter(value => value !== '').length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Advanced Search & Filter
            {activeFiltersCount > 0 && (
              <Badge variant="secondary">{activeFiltersCount} filters</Badge>
            )}
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <Filter className="w-4 h-4 mr-2" />
            {isExpanded ? 'Collapse' : 'Expand'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Basic search - always visible */}
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              placeholder="Search by application reference..."
              value={filters.reference}
              onChange={(e) => updateFilter('reference', e.target.value)}
            />
          </div>
          <Button onClick={applyFilters}>
            <Search className="w-4 h-4 mr-2" />
            Search
          </Button>
          {activeFiltersCount > 0 && (
            <Button variant="outline" onClick={clearFilters}>
              <X className="w-4 h-4 mr-2" />
              Clear
            </Button>
          )}
        </div>

        {/* Advanced filters - collapsible */}
        {isExpanded && (
          <div className="space-y-4 pt-4 border-t">
            {/* Status and Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Status</Label>
                <Select value={filters.status} onValueChange={(value) => updateFilter('status', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any status</SelectItem>
                    {uniqueStatuses.map(status => (
                      <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Application Type</Label>
                <Select value={filters.type} onValueChange={(value) => updateFilter('type', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any type</SelectItem>
                    {uniqueTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Date Range */}
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4" />
                Submission Date Range
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">From</Label>
                  <Input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => updateFilter('dateFrom', e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">To</Label>
                  <Input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => updateFilter('dateTo', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Cost Range */}
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4" />
                Cost Range (R)
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Minimum</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={filters.minCost}
                    onChange={(e) => updateFilter('minCost', e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Maximum</Label>
                  <Input
                    type="number"
                    placeholder="No limit"
                    value={filters.maxCost}
                    onChange={(e) => updateFilter('maxCost', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Days Pending Range */}
            <div>
              <Label className="flex items-center gap-2 mb-2">
                Working Days Pending
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Minimum</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={filters.minDays}
                    onChange={(e) => updateFilter('minDays', e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Maximum</Label>
                  <Input
                    type="number"
                    placeholder="No limit"
                    value={filters.maxDays}
                    onChange={(e) => updateFilter('maxDays', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Apply/Clear buttons */}
            <div className="flex gap-2 pt-4">
              <Button onClick={applyFilters} className="flex-1">
                Apply Filters
              </Button>
              <Button variant="outline" onClick={clearFilters}>
                Clear All
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};