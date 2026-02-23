/**
 * Wisdom Vault bookmarks: sacred text IDs + Oracle Q&A bookmarks.
 * Persisted in localStorage. Migrates from legacy "library" bookmarks (array of IDs).
 */

import type { OracleBookmark } from "@/types/library";

const WISDOM_VAULT_KEY = "soulmap-wisdom-vault-bookmarks";
const LEGACY_BOOKMARKS_KEY = "soulmap-library-bookmarks";

export interface WisdomVaultBookmarks {
  sacredTextIds: string[];
  oracleBookmarks: OracleBookmark[];
}

function defaultBookmarks(): WisdomVaultBookmarks {
  return { sacredTextIds: [], oracleBookmarks: [] };
}

export function loadWisdomVaultBookmarks(): WisdomVaultBookmarks {
  if (typeof window === "undefined") return defaultBookmarks();
  const raw = localStorage.getItem(WISDOM_VAULT_KEY);
  if (raw) {
    try {
      const v = JSON.parse(raw) as Partial<WisdomVaultBookmarks>;
      return {
        sacredTextIds: Array.isArray(v.sacredTextIds) ? v.sacredTextIds : [],
        oracleBookmarks: Array.isArray(v.oracleBookmarks) ? v.oracleBookmarks : [],
      };
    } catch {
      return defaultBookmarks();
    }
  }
  // Migrate from legacy format (array of sacred text IDs only)
  const legacy = localStorage.getItem(LEGACY_BOOKMARKS_KEY);
  if (legacy) {
    try {
      const arr = JSON.parse(legacy);
      const sacredTextIds = Array.isArray(arr) ? arr : [];
      const migrated: WisdomVaultBookmarks = { sacredTextIds, oracleBookmarks: [] };
      localStorage.setItem(WISDOM_VAULT_KEY, JSON.stringify(migrated));
      localStorage.removeItem(LEGACY_BOOKMARKS_KEY);
      return migrated;
    } catch {
      return defaultBookmarks();
    }
  }
  return defaultBookmarks();
}

export function saveWisdomVaultBookmarks(b: WisdomVaultBookmarks): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(WISDOM_VAULT_KEY, JSON.stringify(b));
}

export function addOracleBookmark(question: string, answer: string): OracleBookmark {
  const b = loadWisdomVaultBookmarks();
  const id = `oracle_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const entry: OracleBookmark = { id, question, answer, savedAt: Date.now() };
  b.oracleBookmarks.unshift(entry);
  saveWisdomVaultBookmarks(b);
  return entry;
}

export function removeOracleBookmark(id: string): void {
  const b = loadWisdomVaultBookmarks();
  b.oracleBookmarks = b.oracleBookmarks.filter((x) => x.id !== id);
  saveWisdomVaultBookmarks(b);
}

export function toggleSacredTextBookmark(id: string): boolean {
  const b = loadWisdomVaultBookmarks();
  const idx = b.sacredTextIds.indexOf(id);
  if (idx >= 0) {
    b.sacredTextIds = b.sacredTextIds.filter((x) => x !== id);
    saveWisdomVaultBookmarks(b);
    return false;
  }
  b.sacredTextIds = [...b.sacredTextIds, id];
  saveWisdomVaultBookmarks(b);
  return true;
}

export function getSacredTextBookmarkIds(): string[] {
  return loadWisdomVaultBookmarks().sacredTextIds;
}

export function getOracleBookmarks(): OracleBookmark[] {
  return loadWisdomVaultBookmarks().oracleBookmarks;
}

export type { WisdomVaultBookmarks };
