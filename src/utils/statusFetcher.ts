// Alternative statusFetcher.ts with multiple CORS proxy fallbacks
import { FirearmStatus, StatusFetchResult } from '@/types/firearm';
import { calculateWorkingDays } from './holidays';

interface SearchParams {
  fref?: string;
  frid?: string;
  fserial?: string;
  fsref?: string;
  fid?: string;
  fiserial?: string;
}

// Multiple CORS proxy services for redundancy
const CORS_PROXIES = [
  'https://api.allorigins.win/get?url=',
  'https://corsproxy.io/?',
  'https://cors-anywhere.herokuapp.com/',
  'https://api.codetabs.com/v1/proxy?quest='
];

/**
 * Attempts to fetch using multiple CORS proxies
 */
const fetchWithProxy = async (sapsUrl: string): Promise<string> => {
  let lastError: Error | null = null;
  
  for (const proxy of CORS_PROXIES) {
    try {
      console.log(`Trying proxy: ${proxy}`);
      
      let url: string;
      let responseProcessor: (response: Response) => Promise<string>;
      
      if (proxy.includes('allorigins.win')) {
        // AllOrigins returns JSON
        url = `${proxy}${encodeURIComponent(sapsUrl)}`;
        responseProcessor = async (response) => {
          const data = await response.json();
          return data.contents;
        };
      } else {
        // Other proxies return HTML directly
        url = `${proxy}${encodeURIComponent(sapsUrl)}`;
        responseProcessor = async (response) => response.text();
      }
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': proxy.includes('allorigins.win') ? 'application/json' : 'text/html',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0'
        },
        // Add timeout
        signal: AbortSignal.timeout(15000)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await responseProcessor(response);
      
      if (!html || html.trim().length === 0) {
        throw new Error('Empty response received');
      }
      
      console.log(`Successfully fetched via proxy: ${proxy}`);
      return html;
      
    } catch (error) {
      console.warn(`Proxy ${proxy} failed:`, error);
      lastError = error instanceof Error ? error : new Error('Unknown proxy error');
      continue;
    }
  }
  
  throw new Error(`All CORS proxies failed. Last error: ${lastError?.message}`);
};

/**
 * Fetches firearm status directly from SAPS using multiple CORS proxy fallbacks
 */
export const fetchFirearmStatus = async (
  params: SearchParams,
  dateApplied: string
): Promise<StatusFetchResult> => {
  try {
    // Build SAPS URL with parameters (exactly like Python script)
    const searchParams = new URLSearchParams();
    
    // Only add non-empty parameters (like Python script)
    if (params.fref?.trim()) searchParams.set('fref', params.fref.trim());
    if (params.frid?.trim()) searchParams.set('frid', params.frid.trim());
    if (params.fserial?.trim()) searchParams.set('fserial', params.fserial.trim());
    if (params.fsref?.trim()) searchParams.set('fsref', params.fsref.trim());
    if (params.fid?.trim()) searchParams.set('fid', params.fid.trim());
    if (params.fiserial?.trim()) searchParams.set('fiserial', params.fiserial.trim());
    
    const sapsUrl = `https://www.saps.gov.za/services/firearm_status_enquiry.php?${searchParams.toString()}`;
    
    console.log('Fetching from SAPS:', sapsUrl);
    console.log('Parameters:', Object.fromEntries(searchParams));
    
    // Attempt to fetch using proxies
    const html = await fetchWithProxy(sapsUrl);
    
    console.log('Received HTML response, parsing...');

    // Parse HTML using native DOM parser (equivalent to BeautifulSoup)
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Find the results table (equivalent to soup.find("table", class_="table"))
    const table = doc.querySelector('table.table');
    
    if (!table) {
      // Check if we got the form page instead of results
      const form = doc.querySelector('form');
      if (form) {
        return {
          success: false,
          error: 'No results found. Please verify your reference numbers are correct.',
        };
      }
      return {
        success: false,
        error: 'No results table found on SAPS website. The page format may have changed.',
      };
    }

    const rows = table.querySelectorAll('tr');
    
    // Skip header row, take the first data row (equivalent to Python: if len(rows) > 1)
    if (rows.length <= 1) {
      return {
        success: false,
        error: 'No data rows found in results table. No matching applications found.',
      };
    }

    // Extract data from first data row (equivalent to Python: rows[1].find_all("td"))
    const dataCells = rows[1].querySelectorAll('td');
    const cellValues: string[] = [];
    
    dataCells.forEach((cell) => {
      // Equivalent to Python: td.get_text(strip=True)
      cellValues.push(cell.textContent?.trim() || '');
    });

    console.log('Extracted cell values:', cellValues);

    if (cellValues.length < 10) {
      return {
        success: false,
        error: `Insufficient data columns found (${cellValues.length}/10). Make sure your information is correct.`,
      };
    }

    // Calculate working days since application
    const applicationDate = new Date(dateApplied);
    const today = new Date();
    const workingDaysPending = calculateWorkingDays(applicationDate, today);
    const isOverdue = workingDaysPending > 90;

    // Map extracted values to status object (exactly like Python script mapping)
    const status: FirearmStatus = {
      type: cellValues[0] || 'Unknown',                    // Application Type
      number: cellValues[1] || 'Unknown',                 // Application Number
      calibre: cellValues[3] || 'Unknown',                // Calibre  
      make: cellValues[4] || 'Unknown',                    // Make
      status: cellValues[7] || 'Unknown',                 // Status
      description: cellValues[8] || 'No description available', // Status Description
      nextStep: cellValues[9] || 'No next step information',    // Next Step
      workingDaysPending,
      isOverdue,
    };

    console.log('Successfully parsed status:', status);

    return {
      success: true,
      status,
    };

  } catch (error) {
    console.error('Error fetching firearm status:', error);
    
    // Provide helpful error messages
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        return {
          success: false,
          error: 'Request timeout: SAPS website is taking too long to respond. Please try again.',
        };
      }
      if (error.message.includes('Network')) {
        return {
          success: false,
          error: 'Network error: Please check your internet connection and try again.',
        };
      }
      if (error.message.includes('proxy')) {
        return {
          success: false,
          error: 'Connection error: Unable to access SAPS website. Please try again later.',
        };
      }
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred while fetching status',
    };
  }
};