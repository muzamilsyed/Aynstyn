import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { getAuth } from "firebase/auth";

async function throwIfResNotOk(res: Response) {
  // Special case - don't throw on 402 status (payment required) which we use for assessment limit
  if (!res.ok && res.status !== 402) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Helper function to get firebase auth token if available
async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {};
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (user) {
      const token = await user.getIdToken(true);
      headers["Authorization"] = `Bearer ${token}`;
    }
  } catch (error) {
    console.error("Error getting auth token:", error);
  }
  return headers;
}

// Add timeout utility
const timeout = (ms: number) => new Promise((_, reject) => 
  setTimeout(() => reject(new Error("Request timeout")), ms)
);

// Add fetch with timeout
const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeoutMs = 10000): Promise<Response> => {
  return Promise.race([
    fetch(url, options),
    timeout(timeoutMs)
  ]) as Promise<Response>;
};

// Add retry utility
const retryWithBackoff = async (
  fn: () => Promise<Response>,
  maxRetries = 3,
  initialDelay = 1000
): Promise<Response> => {
  let retries = 0;
  let delay = initialDelay;

  while (true) {
    try {
      return await fn();
    } catch (error: any) {
      retries++;
      if (retries >= maxRetries || error.message === "Request timeout") {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; // Exponential backoff
    }
  }
};

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  signal?: AbortSignal
): Promise<Response> {
  const authHeaders = await getAuthHeaders();
  const headers = {
    ...(data ? { "Content-Type": "application/json" } : {}),
    ...authHeaders
  };

  const makeRequest = () => fetchWithTimeout(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
    signal
  });

  try {
    const res = await retryWithBackoff(makeRequest);
    await throwIfResNotOk(res);
    return res;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('Request was cancelled');
    }
    if (error.message === "Request timeout") {
      throw new Error("Request timed out. Please try again.");
    }
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    try {
      const authHeaders = await getAuthHeaders();
      
      const res = await fetch(queryKey[0] as string, {
        credentials: "include",
        headers: authHeaders
      });

      if (res.status === 401) {
        if (unauthorizedBehavior === "returnNull") {
          return null;
        }
        // For user-visible queries that require auth, just return null instead of redirecting
        // This prevents redirect loops and allows the UI to show login buttons
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    } catch (error) {
      console.error("Query error:", error);
      if (unauthorizedBehavior === "returnNull") {
        return null;
      }
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
