import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from "@shared/schema";
import { Agent } from 'https';
import dns from 'dns';

// Configure WebSocket for Neon
neonConfig.webSocketConstructor = WebSocket;

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Configure SSL options for Supavisor
neonConfig.useSecureWebSocket = true;
neonConfig.pipelineTLS = true;
neonConfig.pipelineConnect = "password"; // Enable connection pooling with password authentication

// Custom DNS resolver to handle hostname resolution
const customLookup = (hostname: string, options: dns.LookupOptions, callback: (err: NodeJS.ErrnoException | null, address: string | dns.LookupAddress[], family: number) => void) => {
  // Remove any api. or db. prefixes from hostname
  const cleanHostname = hostname.replace(/^(api\.|db\.)/, '');
  console.log(`Resolving hostname: ${cleanHostname}`);
  
  // Use system DNS resolver
  dns.lookup(cleanHostname, options, (err, address, family) => {
    if (err) {
      console.error(`DNS lookup failed for ${cleanHostname}:`, err);
      // Try resolving without the project ref if it fails
      const fallbackHostname = 'supabase.co';
      console.log(`Trying fallback hostname: ${fallbackHostname}`);
      dns.lookup(fallbackHostname, options, callback);
    } else {
      callback(null, address, family);
    }
  });
};

// Initialize database connection with enhanced error handling
const sql = neon(process.env.DATABASE_URL!, {
  fetchOptions: {
    agent: new Agent({
      rejectUnauthorized: false, // Temporarily allow self-signed certificates
      keepAlive: true,
      timeout: 30000, // 30 second timeout
      lookup: customLookup
    })
  }
});

// Log the connection URL (without password) for debugging
const url = new URL(process.env.DATABASE_URL!);
console.log('Connecting to database at:', `${url.protocol}//${url.hostname}:${url.port}${url.pathname}`);

// Verify the connection string format
if (!url.hostname.endsWith('.supabase.co')) {
  console.error('Warning: Database hostname should end with .supabase.co');
}
if (url.port !== '6543') {
  console.error('Warning: Database port should be 6543 for Supavisor');
}

export const db = drizzle(sql, { schema });
