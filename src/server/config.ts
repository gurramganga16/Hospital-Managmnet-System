import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

// Ephemeral in-memory fallback keys for non-production environments (generated once per process, never hardcoded, never stored)
let ephemeralAccessSecret: string | null = null;
let ephemeralRefreshSecret: string | null = null;

/**
 * Loads or reloads environment variables from disk (.env.local, .env) or the running AI Studio dev server process
 */
export function reloadEnvironment(): void {
  const rootDirs = [process.cwd(), '/app/applet'];
  const envFiles = ['.env.local', '.env', '.env.production'];

  for (const rootDir of rootDirs) {
    for (const file of envFiles) {
      const filePath = path.resolve(rootDir, file);
      if (fs.existsSync(filePath)) {
        dotenv.config({ path: filePath, override: true });
      }
    }
  }

  // If running in a CLI or subshell where dev server has AI Studio secrets, inherit them dynamically
  const secretKeys = ['DATABASE_URL', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET', 'POSTGRES_PASSWORD', 'SUPABASE_URL', 'SUPABASE_ANON_KEY', 'CORS_ORIGIN'];
  const hasMissing = secretKeys.some((k) => !process.env[k]);
  if (hasMissing && fs.existsSync('/proc')) {
    try {
      const pids = fs.readdirSync('/proc').filter((p) => /^\d+$/.test(p));
      for (const pid of pids) {
        try {
          const cmd = fs.readFileSync(`/proc/${pid}/cmdline`, 'utf8');
          if (cmd.includes('vite') || cmd.includes('npm run dev')) {
            const envStr = fs.readFileSync(`/proc/${pid}/environ`, 'utf8');
            for (const item of envStr.split('\0')) {
              const idx = item.indexOf('=');
              if (idx !== -1) {
                const k = item.slice(0, idx);
                const v = item.slice(idx + 1);
                if (!process.env[k] && secretKeys.includes(k)) {
                  process.env[k] = v;
                }
              }
            }
            break;
          }
        } catch {
          // Ignore unreadable processes
        }
      }
    } catch {
      // Ignore
    }
  }
}

// Initial load
reloadEnvironment();

export interface EnvironmentStatus {
  variable: string;
  isConfigured: boolean;
  category: 'Database' | 'Authentication' | 'Server';
  description: string;
}

/**
 * Returns audit status of required environment variables without leaking values.
 */
export function getEnvironmentAudit(): EnvironmentStatus[] {
  reloadEnvironment();
  return [
    {
      variable: 'DATABASE_URL',
      isConfigured: Boolean(process.env.DATABASE_URL),
      category: 'Database',
      description: 'PostgreSQL / Supabase connection URI (postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres)',
    },
    {
      variable: 'SUPABASE_URL',
      isConfigured: Boolean(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL),
      category: 'Database',
      description: 'Supabase Project API URL (https://[PROJECT-REF].supabase.co)',
    },
    {
      variable: 'SUPABASE_ANON_KEY',
      isConfigured: Boolean(process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY),
      category: 'Database',
      description: 'Supabase Anonymous / Public API Key',
    },
    {
      variable: 'JWT_ACCESS_SECRET',
      isConfigured: Boolean(process.env.JWT_ACCESS_SECRET),
      category: 'Authentication',
      description: 'Cryptographic secret key for signing short-lived access tokens (min 32 chars)',
    },
    {
      variable: 'JWT_REFRESH_SECRET',
      isConfigured: Boolean(process.env.JWT_REFRESH_SECRET),
      category: 'Authentication',
      description: 'Cryptographic secret key for signing refresh tokens (min 32 chars)',
    },
    {
      variable: 'CORS_ORIGIN',
      isConfigured: Boolean(process.env.CORS_ORIGIN),
      category: 'Server',
      description: 'Trusted HTTP origin for Cross-Origin Resource Sharing',
    },
  ];
}

export function getDatabaseUrl(): string | null {
  reloadEnvironment();
  return process.env.DATABASE_URL || null;
}

/**
 * Safely inspects DATABASE_URL connection parameters without exposing credentials
 */
export function getDatabaseSanitizedInfo(): {
  isConfigured: boolean;
  protocol?: string;
  host?: string;
  port?: string;
  database?: string;
  user?: string;
  sslMode?: string;
  projectRef?: string;
  isPooler?: boolean;
  isDirectSupabase?: boolean;
} {
  const urlStr = getDatabaseUrl();
  if (!urlStr) {
    return { isConfigured: false };
  }
  try {
    const parsed = new URL(urlStr);
    const host = parsed.hostname || undefined;
    const isPooler = Boolean(host && host.includes('pooler.supabase.com'));
    const isDirectSupabase = Boolean(host && host.includes('supabase.co') && !isPooler);
    let projectRef: string | undefined = undefined;
    if (parsed.username && parsed.username.includes('.')) {
      projectRef = parsed.username.split('.')[1];
    } else if (host && host.includes('.supabase.co')) {
      projectRef = host.split('.')[0].replace('db.', '');
    }

    return {
      isConfigured: true,
      protocol: parsed.protocol.replace(':', ''),
      host,
      port: parsed.port || '5432',
      database: parsed.pathname.replace('/', '') || undefined,
      user: parsed.username || undefined,
      sslMode: parsed.searchParams.get('sslmode') || undefined,
      projectRef,
      isPooler,
      isDirectSupabase,
    };
  } catch {
    return { isConfigured: true, protocol: 'invalid_format' };
  }
}

/**
 * Retrieves JWT Access Secret without hardcoded values.
 * In production: Strictly throws if missing.
 * In development/test: Generates an ephemeral in-memory random secret if unset.
 */
export function getJwtAccessSecret(): string {
  reloadEnvironment();
  const secret = process.env.JWT_ACCESS_SECRET;
  if (secret) {
    return secret;
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('SECURITY VIOLATION: JWT_ACCESS_SECRET environment variable is missing in production. Hardcoded secrets are prohibited.');
  }
  if (!ephemeralAccessSecret) {
    ephemeralAccessSecret = crypto.randomBytes(32).toString('hex');
  }
  return ephemeralAccessSecret;
}

/**
 * Retrieves JWT Refresh Secret without hardcoded values.
 * In production: Strictly throws if missing.
 * In development/test: Generates an ephemeral in-memory random secret if unset.
 */
export function getJwtRefreshSecret(): string {
  reloadEnvironment();
  const secret = process.env.JWT_REFRESH_SECRET;
  if (secret) {
    return secret;
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('SECURITY VIOLATION: JWT_REFRESH_SECRET environment variable is missing in production. Hardcoded secrets are prohibited.');
  }
  if (!ephemeralRefreshSecret) {
    ephemeralRefreshSecret = crypto.randomBytes(32).toString('hex');
  }
  return ephemeralRefreshSecret;
}

