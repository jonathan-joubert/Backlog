import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FirearmApplication } from '@/types/firearm';
import { Clock, CheckCircle, AlertCircle, FileText, Calendar, DollarSign } from 'lucide-react';

interface QuickStatsProps {
  applications: FirearmApplication[];
}

export const QuickStats: React.FC<QuickStatsProps> = ({ applications }) => {
  const totalApplications = applications.length;
  const pendingApplications = applications.filter(app => 
    app.currentStatus && app.currentStatus !== 'Finalised' && app.currentStatus !== 'Rejected'
  ).length;
  const finalisedApplications = applications.filter(app => 
    app.currentStatus === 'Finalised'
  ).length;
  const rejectedApplications = applications.filter(app => 
    app.currentStatus === 'Rejected'
  ).length;

  // Calculate average processing time for finalised applications
  const finalisedApps = applications.filter(app => app.currentStatus === 'Finalised');
  const avgProcessingTime = finalisedApps.length > 0 
    ? Math.round(finalisedApps.reduce((sum, app) => sum + (app.workingDaysPending || 0), 0) / finalisedApps.length)
    : 0;

  // Calculate total costs if cost tracking is implemented
  const totalCosts = applications.reduce((sum, app) => sum + (app.cost || 0), 0);

  // Find longest pending application
  const longestPending = applications
    .filter(app => app.currentStatus && app.currentStatus !== 'Finalised' && app.currentStatus !== 'Rejected')
    .reduce((max, app) => 
      (app.workingDaysPending || 0) > (max?.workingDaysPending || 0) ? app : max
    , null as FirearmApplication | null);

  const stats = [
    {
      title: 'Total Applications',
      value: totalApplications,
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Pending',
      value: pendingApplications,
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Finalised',
      value: finalisedApplications,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Rejected',
      value: rejectedApplications,
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="relative overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Additional Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Avg Processing Time
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold">
              {avgProcessingTime} <span className="text-sm font-normal text-muted-foreground">days</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Total Costs
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold">
              R{totalCosts.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Longest Pending
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold">
              {longestPending?.workingDaysPending || 0} <span className="text-sm font-normal text-muted-foreground">days</span>
            </div>
            {longestPending && (
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {longestPending.applicationRefNumber}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Success Rate */}
      {totalApplications > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">
                  {Math.round((finalisedApplications / (finalisedApplications + rejectedApplications)) * 100) || 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {finalisedApplications + rejectedApplications} completed applications
                </p>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline" className="text-green-600 border-green-600">
                  {finalisedApplications} approved
                </Badge>
                <Badge variant="outline" className="text-red-600 border-red-600">
                  {rejectedApplications} rejected
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};