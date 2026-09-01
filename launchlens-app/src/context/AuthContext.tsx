import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  name: string;
  email: string;
}

interface StoredUser {
  name: string;
  email: string;
  passwordHash: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

/** --- Rate limiter --- */
const RATE_LIMIT_KEY = 'launchlens_auth_attempts';
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 5 * 60 * 1000; // 5 minutes

interface RateLimitRecord {
  attempts: number;
  lockedUntil: number;
}

function getRateLimit(): RateLimitRecord {
  try {
    const raw = localStorage.getItem(RATE_LIMIT_KEY);
    if (!raw) return { attempts: 0, lockedUntil: 0 };
    const parsed = JSON.parse(raw);
    // Reset if lockout has expired
    if (parsed.lockedUntil && Date.now() > parsed.lockedUntil) {
      return { attempts: 0, lockedUntil: 0 };
    }
    return parsed;
  } catch {
    return { attempts: 0, lockedUntil: 0 };
  }
}

function recordFailedAttempt(): { allowed: boolean; retryAfterMs: number } {
  const record = getRateLimit();
  const newAttempts = record.attempts + 1;
  if (newAttempts >= MAX_ATTEMPTS) {
    const lockedUntil = Date.now() + LOCKOUT_MS;
    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify({ attempts: newAttempts, lockedUntil }));
    return { allowed: false, retryAfterMs: LOCKOUT_MS };
  }
  localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify({ attempts: newAttempts, lockedUntil: 0 }));
  return { allowed: true, retryAfterMs: 0 };
}

function resetRateLimit(): void {
  localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify({ attempts: 0, lockedUntil: 0 }));
}

/** --- Password hashing (PBKDF2, 100k iterations, per-user salt) --- */
function generateSalt(): ArrayBuffer {
  return crypto.getRandomValues(new Uint8Array(16)).buffer as ArrayBuffer;
}

async function hashPassword(password: string, salt?: ArrayBuffer): Promise<string> {
  const encoder = new TextEncoder();
  const saltToUse = salt || generateSalt();
  const data = encoder.encode(password);
  const keyMaterial = await crypto.subtle.importKey('raw', data, { name: 'PBKDF2' }, false, ['deriveBits']);
  const hashBuffer = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: saltToUse, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    256
  );
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const saltHex = Array.from(new Uint8Array(saltToUse)).map(b => b.toString(16).padStart(2, '0')).join('');
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return `${saltHex}:${hashHex}`;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('launchlens_user');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('launchlens_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('launchlens_user');
    }
  }, [user]);

  const login = async (email: string, password: string) => {
    // Check rate limit
    const rateCheck = getRateLimit();
    if (rateCheck.lockedUntil && Date.now() < rateCheck.lockedUntil) {
      const remaining = Math.ceil((rateCheck.lockedUntil - Date.now()) / 1000);
      return { success: false, error: `Too many attempts. Try again in ${remaining}s.` };
    }

    const users: StoredUser[] = JSON.parse(localStorage.getItem('launchlens_users') || '[]');
    const found = users.find((u) => u.email === email);
    if (!found) {
      const { allowed, retryAfterMs } = recordFailedAttempt();
      if (!allowed) {
        return { success: false, error: `Too many failed attempts. Locked for ${retryAfterMs / 1000}s.` };
      }
      return { success: false, error: 'Invalid credentials' };
    }

    const [saltHex] = found.passwordHash.split(':');
    const saltBuffer = new Uint8Array(saltHex.match(/.{2}/g)!.map(h => parseInt(h, 16))).buffer as ArrayBuffer;
    const passwordHash = await hashPassword(password, saltBuffer);
    if (found.passwordHash !== passwordHash) {
      const { allowed, retryAfterMs } = recordFailedAttempt();
      if (!allowed) {
        return { success: false, error: `Too many failed attempts. Locked for ${retryAfterMs / 1000}s.` };
      }
      return { success: false, error: 'Invalid credentials' };
    }

    // Success — reset rate limit
    resetRateLimit();
    setUser({ name: found.name, email: found.email });
    return { success: true };
  };

  const signup = async (name: string, email: string, password: string) => {
    const users: StoredUser[] = JSON.parse(localStorage.getItem('launchlens_users') || '[]');
    if (users.find((u) => u.email === email)) return { success: false, error: 'Email already registered' };

    const passwordHash = await hashPassword(password);
    const newUser: StoredUser = { name, email, passwordHash };
    users.push(newUser);
    localStorage.setItem('launchlens_users', JSON.stringify(users));
    setUser({ name, email });
    return { success: true };
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
