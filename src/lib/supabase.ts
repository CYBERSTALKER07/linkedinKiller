import { createClient } from '@supabase/supabase-js';

const configuredSupabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const configuredSupabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

const supabaseUrl = configuredSupabaseUrl || 'http://127.0.0.1:54321';
const supabaseAnonKey = configuredSupabaseAnonKey || 'local-anon-key';

if (!configuredSupabaseUrl || !configuredSupabaseAnonKey) {
  console.warn('Supabase environment variables are not configured. Falling back to placeholder values so the app can boot.');
  console.warn('VITE_SUPABASE_URL:', configuredSupabaseUrl ? 'Set' : 'Missing');
  console.warn('VITE_SUPABASE_ANON_KEY:', configuredSupabaseAnonKey ? 'Set' : 'Missing');
}

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    },
    // Performance optimizations with proper CORS headers
    global: {
      headers: {
        'x-client-info': 'supabase-js-web',
        // Add headers for Safari CORS compatibility
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      fetch: fetch.bind(globalThis)
    },
    db: {
      schema: 'public'
    },
    // Realtime optimizations
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  }
);

// Query cache helper
const queryCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const getCachedQuery = <T>(key: string): T | null => {
  const cached = queryCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data as T;
  }
  return null;
};

export const setCachedQuery = (key: string, data: any) => {
  queryCache.set(key, { data, timestamp: Date.now() });
};

export const clearQueryCache = (key?: string) => {
  if (key) {
    queryCache.delete(key);
  } else {
    queryCache.clear();
  }
};

// Media URL helper for videos with CORS support and Safari compatibility
export const getMediaUrl = async (bucket: string, filePath: string): Promise<string> => {
  try {
    // Get signed URL for videos (valid for 1 hour)
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, 3600, {
        transform: bucket === 'videos' ? {
          width: 1280,
          height: 720,
          quality: 85
        } : undefined
      });

    if (error) {
      console.warn('Error creating signed URL, falling back to public URL:', error);
      // Fallback to public URL with Safari compatibility
      const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(filePath);
      // Ensure public URL has cache busting for Safari
      const safariUrl = publicData.publicUrl + (publicData.publicUrl.includes('?') ? '&' : '?') + 'v=' + Date.now();
      return safariUrl;
    }

    return data.signedUrl;
  } catch (error) {
    console.error('Error getting media URL:', error);
    // Final fallback to public URL
    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
    const safariUrl = data.publicUrl + (data.publicUrl.includes('?') ? '&' : '?') + 'v=' + Date.now();
    return safariUrl;
  }
};

// Batch get media URLs with Safari support
export const getMediaUrls = async (
  items: Array<{ bucket: string; path: string }>
): Promise<string[]> => {
  try {
    return await Promise.all(
      items.map(item => getMediaUrl(item.bucket, item.path))
    );
  } catch (error) {
    console.error('Error batch fetching media URLs:', error);
    return items.map(item => {
      const { data } = supabase.storage.from(item.bucket).getPublicUrl(item.path);
      // Add Safari cache busting
      return data.publicUrl + (data.publicUrl.includes('?') ? '&' : '?') + 'v=' + Date.now();
    });
  }
};

// Fetch with proper CORS headers for public resources
export const fetchPublicResource = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const headers: HeadersInit = {
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9',
    ...options.headers,
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      mode: 'cors',
      credentials: 'omit', // Don't send credentials for public resources
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
    }

    return response;
  } catch (error) {
    console.error(`CORS Error fetching ${url}:`, error);
    throw error;
  }
};

// Fetch with Safari-compatible headers for authenticated requests
export const fetchWithSafariHeaders = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const safariHeaders: HeadersInit = {
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9',
    ...options.headers,
  };

  try {
    return fetch(url, {
      ...options,
      headers: safariHeaders,
      mode: 'cors',
      credentials: 'same-origin',
    });
  } catch (error) {
    console.error(`CORS Error in fetchWithSafariHeaders for ${url}:`, error);
    throw new Error(`Network request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Helper to check if a URL is a storage URL and handle appropriately
export const fetchMediaWithCors = async (url: string): Promise<Response> => {
  const isStorageUrl = url.includes('supabase') || url.includes('storage');
  
  if (isStorageUrl) {
    return fetchPublicResource(url);
  } else {
    return fetchWithSafariHeaders(url);
  }
};