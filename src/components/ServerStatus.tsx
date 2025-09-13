// Alternative ServerStatus.tsx with multiple check methods
import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff } from 'lucide-react';

// Check if current time is during planned downtime (00:00-00:30 SAST)
const isSASTPlannedDowntime = (): boolean => {
  const now = new Date();
  const sastOffset = 2 * 60; // SAST is UTC+2
  const sastTime = new Date(now.getTime() + sastOffset * 60 * 1000);
  const hours = sastTime.getUTCHours();
  const minutes = sastTime.getUTCMinutes();
  
  return hours === 0 && minutes >= 0 && minutes < 30;
};

export const ServerStatus: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [checkMethod, setCheckMethod] = useState<string>('');

  const checkServerStatus = async (): Promise<{ status: boolean; method: string }> => {
    // Method 1: Try AllOrigins proxy
    try {
      const corsProxy = 'https://api.allorigins.win/get?url=';
      const sapsUrl = 'https://www.saps.gov.za';
      const proxyUrl = `${corsProxy}${encodeURIComponent(sapsUrl)}`;
      
      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(8000)
      });

      if (response.ok) {
        const data = await response.json();
        console.log('AllOrigins check:', { 
          httpCode: data.status?.http_code,
          hasContents: !!data.contents,
          contentsLength: data.contents?.length || 0
        });
        
        if (data.status?.http_code === 200 && data.contents && data.contents.length > 50) {
          return { status: true, method: 'AllOrigins' };
        }
      }
    } catch (error) {
      console.log('AllOrigins method failed:', error);
    }

    // Method 2: Try a different proxy
    try {
      const proxyUrl = `https://corsproxy.io/?https://www.saps.gov.za`;
      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: { 'Accept': 'text/html' },
        signal: AbortSignal.timeout(8000)
      });

      if (response.ok) {
        const html = await response.text();
        console.log('CorsProxy check:', { 
          status: response.status,
          hasContent: html.length > 50,
          contentLength: html.length
        });
        
        if (html && html.length > 50) {
          return { status: true, method: 'CorsProxy' };
        }
      }
    } catch (error) {
      console.log('CorsProxy method failed:', error);
    }

    // Method 3: Simple connectivity test (check if we can reach any CORS proxy)
    try {
      const response = await fetch('https://api.allorigins.win/raw?url=' + encodeURIComponent('https://httpbin.org/status/200'), {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });

      if (response.ok) {
        console.log('Basic connectivity test passed');
        // If we can reach the proxy but not SAPS, assume SAPS is down
        return { status: false, method: 'Connectivity (SAPS down)' };
      }
    } catch (error) {
      console.log('Basic connectivity test failed:', error);
    }

    // If all methods fail, assume network/proxy issues
    return { status: false, method: 'All methods failed' };
  };

  const performStatusCheck = async () => {
    if (isSASTPlannedDowntime()) {
      setIsOnline(false);
      setCheckMethod('Planned Downtime');
      setLastChecked(new Date());
      return;
    }
    
    const result = await checkServerStatus();
    setIsOnline(result.status);
    setCheckMethod(result.method);
    setLastChecked(new Date());
    
    console.log('Server status:', result);
  };

  useEffect(() => {
    // Check immediately on mount
    performStatusCheck();
    
    // Set up interval to check every 5 minutes
    const interval = setInterval(performStatusCheck, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusDisplay = () => {
    if (isOnline === null) {
      return {
        variant: 'outline' as const,
        text: 'Checking...',
        icon: <Wifi className="w-5 h-5 animate-pulse" />
      };
    }
    
    if (checkMethod === 'Planned Downtime') {
      return {
        variant: 'secondary' as const,
        text: 'Daily downtime',
        icon: <WifiOff className="w-5 h-5" />
      };
    }
    
    if (isOnline) {
      return {
        variant: 'default' as const,
        text: 'SAPS server is up',
        icon: <Wifi className="w-5 h-5 text-green-600" />
      };
    }
    
    return {
      variant: 'destructive' as const,
      text: 'SAPS is down',
      icon: <WifiOff className="w-5 h-5" />
    };
  };

  const status = getStatusDisplay();

  return (
    <div className="flex items-center justify-between flex-wrap gap-2">
      <div className="flex items-center gap-2 min-w-0">
        {status.icon}
        <Badge 
          variant={status.variant}
          className={`text-xs sm:text-sm font-semibold px-2 py-1 whitespace-nowrap ${
            isOnline ? 'bg-green-600 hover:bg-green-700' : 
            isOnline === false ? 'bg-red-600 hover:bg-red-700' : ''
          }`}
        >
          <span className="truncate">{status.text}</span>
        </Badge>
        {/* Debug info - remove in production */}
        {checkMethod && (
          <span className="text-xs text-muted-foreground ml-2 hidden sm:inline">
            ({checkMethod})
          </span>
        )}
      </div>
      {lastChecked && (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          Last: {lastChecked.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </span>
      )}
    </div>
  );
};