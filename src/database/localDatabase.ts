/**
 * Centralized local database abstraction.
 * Simulates a backend database using localStorage.
 * When migrating to a real backend (Supabase, Firebase, etc.),
 * replace these functions with API calls — no frontend changes needed.
 */

import { Transaction, Category, Account, Debt, Investment, Forecast, SystemLog, CreditCard, CreditCardExpense, PaidInvoice } from '@/types/finance';
import { createDefaultCategories, createDefaultAccounts, createDefaultForecast } from '@/data/seedData';

// ── Types ──────────────────────────────────────────────

export interface UserFinanceData {
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  debts: Debt[];
  investments: Investment[];
  forecast: Forecast[];
  creditCards: CreditCard[];
  creditCardExpenses: CreditCardExpense[];
  paidInvoices: PaidInvoice[];
}

export interface Database {
  version: number;
  systemLogs: SystemLog[];
  /** Per-user finance data keyed by userId */
  userData: Record<string, UserFinanceData>;
}

// ── Constants ──────────────────────────────────────────

const DB_KEY = 'finance_database';
const DB_VERSION = 1;

// ── Core load / save ───────────────────────────────────

let _cache: Database | null = null;

function emptyDatabase(): Database {
  return { version: DB_VERSION, systemLogs: [], userData: {} };
}

export function loadDatabase(): Database {
  if (_cache) return _cache;
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) {
      _cache = JSON.parse(raw) as Database;
      // Ensure structure
      if (!_cache!.userData) _cache!.userData = {};
      if (!_cache!.systemLogs) _cache!.systemLogs = [];
      return _cache!;
    }
  } catch { /* corrupted — reset */ }

  // Migrate from legacy per-user keys if they exist
  const migrated = migrateLegacyData();
  _cache = migrated;
  saveDatabase(migrated);
  return migrated;
}

export function saveDatabase(db: Database): void {
  _cache = db;
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

/** Invalidate in-memory cache (useful after external changes) */
export function invalidateCache(): void {
  _cache = null;
}

// ── Migration from old per-user keys ───────────────────

function migrateLegacyData(): Database {
  const db = emptyDatabase();

  // Migrate system logs
  try {
    const logs = localStorage.getItem('finance_system_logs');
    if (logs) db.systemLogs = JSON.parse(logs);
  } catch {}

  // Discover legacy user keys
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith('finance_user_')) continue;
    // Pattern: finance_user_{userId}_initialized
    const match = key.match(/^finance_user_(.+)_initialized$/);
    if (!match) continue;
    const userId = match[1];
    if (db.userData[userId]) continue;

    db.userData[userId] = {
      transactions: loadLegacy(userId, 'transactions'),
      categories: loadLegacy(userId, 'categories'),
      accounts: loadLegacy(userId, 'accounts'),
      debts: loadLegacy(userId, 'debts'),
      investments: loadLegacy(userId, 'investments'),
      forecast: loadLegacy(userId, 'forecast'),
      creditCards: loadLegacy(userId, 'creditCards'),
      creditCardExpenses: loadLegacy(userId, 'creditCardExpenses'),
    };
  }

  return db;
}

function loadLegacy<T>(userId: string, entity: string): T[] {
  try {
    const raw = localStorage.getItem(`finance_user_${userId}_${entity}`);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

// ── User data helpers ──────────────────────────────────

export function ensureUserData(userId: string): UserFinanceData {
  const db = loadDatabase();
  if (db.userData[userId]) return db.userData[userId];

  // New user — create defaults
  const data: UserFinanceData = {
    transactions: [],
    categories: createDefaultCategories(userId),
    accounts: createDefaultAccounts(userId),
    debts: [],
    investments: [],
    forecast: createDefaultForecast(userId),
    creditCards: [],
    creditCardExpenses: [],
  };
  db.userData[userId] = data;
  saveDatabase(db);
  return data;
}

export function getUserData(userId: string): UserFinanceData {
  const db = loadDatabase();
  return db.userData[userId] || { transactions: [], categories: [], accounts: [], debts: [], investments: [], forecast: [], creditCards: [], creditCardExpenses: [] };
}

export function setUserData(userId: string, data: UserFinanceData): void {
  const db = loadDatabase();
  db.userData[userId] = data;
  saveDatabase(db);
}

export function updateUserEntity<K extends keyof UserFinanceData>(
  userId: string,
  entity: K,
  updater: (prev: UserFinanceData[K]) => UserFinanceData[K]
): UserFinanceData[K] {
  const db = loadDatabase();
  if (!db.userData[userId]) ensureUserData(userId);
  const current = db.userData[userId][entity];
  const next = updater(current);
  db.userData[userId][entity] = next;
  saveDatabase(db);
  return next;
}

// ── System logs ────────────────────────────────────────

export function getSystemLogs(): SystemLog[] {
  return loadDatabase().systemLogs;
}

export function addSystemLog(log: SystemLog): void {
  const db = loadDatabase();
  db.systemLogs = [log, ...db.systemLogs].slice(0, 1000);
  saveDatabase(db);
}

// ── All users aggregation (admin) ──────────────────────

export function getAllUsersData(adminUserIds?: string[]): {
  allTx: Transaction[];
  allCat: Category[];
  allAcc: Account[];
  allDbt: Debt[];
  allInv: Investment[];
} {
  const db = loadDatabase();
  const allTx: Transaction[] = [];
  const allCat: Category[] = [];
  const allAcc: Account[] = [];
  const allDbt: Debt[] = [];
  const allInv: Investment[] = [];

  const userIds = adminUserIds || Object.keys(db.userData);

  for (const uid of userIds) {
    const d = db.userData[uid];
    if (!d) continue;
    allTx.push(...d.transactions);
    allCat.push(...d.categories);
    allAcc.push(...d.accounts);
    allDbt.push(...d.debts);
    allInv.push(...d.investments);
  }

  return { allTx, allCat, allAcc, allDbt, allInv };
}

// ── Export / Import (for migration) ────────────────────

export function exportDatabase(): string {
  return JSON.stringify(loadDatabase(), null, 2);
}

export function importDatabase(json: string): void {
  const db = JSON.parse(json) as Database;
  saveDatabase(db);
  invalidateCache();
}
