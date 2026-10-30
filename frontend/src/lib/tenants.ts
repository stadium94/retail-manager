export interface TenantConfig {
  id: string;
  name: string;
  shortName: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  accentColor: string;
  logoUrl?: string;
  knownDomains?: string[];
}

export const REGISTERED_TENANTS: Record<string, TenantConfig> = {
  stihl: {
    id: 'stihl',
    name: 'ETS MADJOU SYLLA — STIHL MALI',
    shortName: 'STIHL',
    supabaseUrl: 'https://fpvrbxmbrotowdlyebqv.supabase.co',
    supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwdnJieG1icm90b3dkbHllYnF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwNzE1MjMsImV4cCI6MjA5NjY0NzUyM30.8_mjBGr1FpYE20cc22iehEf0Xi9Fix2M0d_SSHIDQuI',
    accentColor: '#f04e23',
    logoUrl: '/stihl-logo.jpg',
    knownDomains: ['stihl-mali.com', 'stihl.com']
  },
  holdingpro: {
    id: 'holdingpro',
    name: 'HOLDING PRO (SUCCURSALE NIAMANA DUBAÏ)',
    shortName: 'HOLDING PRO',
    supabaseUrl: 'https://onsqvduklnwffugsiybs.supabase.co',
    supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9uc3F2ZHVrbG53ZmZ1Z3NpeWJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyMzk1MDgsImV4cCI6MjA5NzgxNTUwOH0.39u7eCzwZonAVbxdEYTQBv9cMONWHSCD5SBKeKSmUkE',
    accentColor: '#0f172a',
    logoUrl: '/holding-pro-logo.png',
    knownDomains: ['holding-pro.com', 'holdingpro.com', 'niamana.com']
  },
  damousoreto: {
    id: 'damousoreto',
    name: 'ALIMENTATION DAMOU SORETO',
    shortName: 'DAMOU SORETO',
    supabaseUrl: 'https://eglfssqkteykmvqlixtw.supabase.co',
    supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnbGZzc3FrdGV5a212cWxpeHR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMzNjc0NTQsImV4cCI6MjEwODk0MzQ1NH0.1m7uk686ugALoRnteNF4gh7emm0QpqlIfiWIcphBf-k',
    accentColor: '#16a34a',
    knownDomains: ['damousoreto.com', 'alimentation-damou.com', 'master.com', 'worker.com']
  }
};

export function getAllTenants(): TenantConfig[] {
  return Object.values(REGISTERED_TENANTS);
}

const STORAGE_KEY = 'djati_active_tenant';

/**
 * Detect the initial tenant ID from URL, hostname, or localStorage.
 */
export function detectInitialTenantId(): string {
  if (typeof window === 'undefined') return 'stihl';

  // 1. URL search params: ?org=holdingpro or ?tenant=stihl
  const params = new URLSearchParams(window.location.search);
  const paramTenant = params.get('org') || params.get('tenant');
  if (paramTenant && REGISTERED_TENANTS[paramTenant.toLowerCase()]) {
    localStorage.setItem(STORAGE_KEY, paramTenant.toLowerCase());
    return paramTenant.toLowerCase();
  }

  // 2. Subdomain check (e.g. holdingpro.djati.app, stihl.djati.app)
  const host = window.location.hostname.toLowerCase();
  for (const [id, config] of Object.entries(REGISTERED_TENANTS)) {
    if (host.startsWith(`${id}.`) || (config.knownDomains && config.knownDomains.some(d => host.includes(d)))) {
      localStorage.setItem(STORAGE_KEY, id);
      return id;
    }
  }

  // 3. Persisted in localStorage
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && REGISTERED_TENANTS[stored]) {
    return stored;
  }

  // 4. Default fallback
  return 'stihl';
}

const tenantEmailCache = new Map<string, string>();

/**
 * Synchronously checks if an email matches a known company domain or has already been cached.
 */
export function predictTenantByEmail(email: string): string | null {
  if (!email || !email.includes('@')) return null;
  const cleanEmail = email.trim().toLowerCase();

  // 1. In-memory cache hit
  if (tenantEmailCache.has(cleanEmail)) {
    return tenantEmailCache.get(cleanEmail)!;
  }

  // 2. Company domain match (e.g. @stihl-mali.com, @holding-pro.com)
  for (const [id, config] of Object.entries(REGISTERED_TENANTS)) {
    if (config.knownDomains) {
      for (const domain of config.knownDomains) {
        if (cleanEmail.endsWith(`@${domain}`)) {
          tenantEmailCache.set(cleanEmail, id);
          return id;
        }
      }
    }
  }

  return null;
}

/**
 * Dynamically resolves an email to its organization across all registered tenants
 * by querying their public profiles without leaking hardcoded emails in the code.
 */
export async function lookupTenantByEmail(email: string): Promise<string | null> {
  const syncMatch = predictTenantByEmail(email);
  if (syncMatch) return syncMatch;

  if (!email || !email.includes('@')) return null;
  const cleanEmail = email.trim().toLowerCase();

  // Parallel query across all registered organizations
  const lookups = Object.entries(REGISTERED_TENANTS).map(async ([tenantId, config]) => {
    try {
      const res = await fetch(
        `${config.supabaseUrl}/rest/v1/profiles?email=ilike.${encodeURIComponent(cleanEmail)}&select=id`,
        {
          headers: {
            apikey: config.supabaseAnonKey,
            Authorization: `Bearer ${config.supabaseAnonKey}`,
          },
          signal: AbortSignal.timeout(3000),
        }
      );
      if (res.ok) {
        const rows = await res.json();
        if (Array.isArray(rows) && rows.length > 0) {
          return tenantId;
        }
      }
    } catch {
      // Ignore network errors or aborts
    }
    return null;
  });

  const results = await Promise.all(lookups);
  const found = results.find(Boolean) || null;
  if (found) {
    tenantEmailCache.set(cleanEmail, found);
  }
  return found;
}
