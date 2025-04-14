// components/CustomTooltip.tsx
import { CustomTooltipProps } from './AnalyticsTypes';
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {Project} from './AnalyticsTypes';
export const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  return (
    <Card className="bg-background p-3 border shadow-md">
      <p className="font-medium">{label}</p>
      {payload.map((item, index) => (
        <p key={index} className="text-sm" style={{ color: item.color }}>
          {`${item.name}: ${item.value}`}
        </p>
      ))}
    </Card>
  );
};

// components/Loading.tsx


export const Loading = () => {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      
      <div>
        <Skeleton className="h-10 w-full max-w-md mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
        <Skeleton className="h-80" />
      </div>
    </div>
  );
};

export const Error = ({ fetchAnalytics, error }: { fetchAnalytics: () => void, error: string }) => {
  return (
    <Card className="border-red-200">
      <CardHeader>
        <CardTitle className="text-red-500">Error Loading Analytics</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4">{error}</p>
        <Button onClick={fetchAnalytics} className="flex items-center gap-2">
          <RefreshCcw className="w-4 h-4" /> Retry
        </Button>
      </CardContent>
    </Card>
  );
};

// components/ProjectHeader.tsx
export const ProjectHeader = ({ title }: { title: string }) => {
  return (
    <div>
      <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
      <p className="text-muted-foreground mt-1">
        Advanced analytics and performance insights
      </p>
    </div>
  );
};

// components/ProjectInfoCard.tsx

export const ProjectInfoCard = ({ project }: { project: Project }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Information</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-1">Description</h4>
            <p>{project.description || 'No description provided'}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-1">Created</h4>
            <p>{new Date(project.createdAt).toLocaleDateString()}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-1">Last Updated</h4>
            <p>{new Date(project.updatedAt).toLocaleDateString()}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};