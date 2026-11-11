/**
 * Environment configuration, read in one place.
 *
 * Never scatter process.env across tests: one module means one place to look
 * when CI behaves differently from your laptop.
 */

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const config = {
  baseURL: required('BASE_URL', 'http://localhost:3000'),

  /** The pre-seeded admin created by scripts/gitea.ps1 setup. */
  admin: {
    username: required('GITEA_ADMIN_USER', 'qaadmin'),
    password: required('GITEA_ADMIN_PASSWORD', 'QaAdmin#2026'),
  },
} as const;
