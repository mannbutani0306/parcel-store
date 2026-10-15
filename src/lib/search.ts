/**
 * Search and fuzzy matching utilities for PARCEL catalogue
 */

/**
 * Compute Levenshtein distance between two strings
 */
function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }

  return dp[m][n];
}

/**
 * Fuzzy check if target string matches query with typo tolerance
 */
export function fuzzyMatch(
  target: string,
  query: string
): { matches: boolean; score: number } {
  const t = target.toLowerCase().trim();
  const q = query.toLowerCase().trim();

  if (!q) return { matches: true, score: 1 };
  if (!t) return { matches: false, score: 0 };

  // 1. Direct inclusion
  if (t.includes(q)) {
    return { matches: true, score: 10 + (q.length / t.length) * 10 };
  }

  // 2. Token-level matching
  const targetWords = t.split(/[\s\-_,./]+/);
  const queryWords = q.split(/[\s\-_,./]+/);

  let matchedWordsCount = 0;
  for (const qw of queryWords) {
    if (!qw) continue;
    let found = false;

    for (const tw of targetWords) {
      if (!tw) continue;
      // Direct prefix or word match
      if (tw.startsWith(qw) || tw.includes(qw)) {
        found = true;
        break;
      }
      // Typo tolerance: Levenshtein distance 1 for short words, 2 for longer words
      const maxDistance = qw.length <= 4 ? 1 : 2;
      if (Math.abs(tw.length - qw.length) <= maxDistance) {
        const dist = levenshteinDistance(tw, qw);
        if (dist <= maxDistance) {
          found = true;
          break;
        }
      }
    }

    if (found) {
      matchedWordsCount++;
    }
  }

  if (matchedWordsCount === queryWords.length && queryWords.length > 0) {
    return { matches: true, score: 5 };
  }

  // 3. Subsequence match
  let tIdx = 0;
  let qIdx = 0;
  while (tIdx < t.length && qIdx < q.length) {
    if (t[tIdx] === q[qIdx]) {
      qIdx++;
    }
    tIdx++;
  }

  if (qIdx === q.length && q.length >= 3) {
    return { matches: true, score: 2 };
  }

  return { matches: false, score: 0 };
}

/**
 * Split text into matched and non-matched chunks for visual highlight
 */
export function getHighlightedChunks(
  text: string,
  query: string
): { text: string; isMatch: boolean }[] {
  if (!query.trim()) {
    return [{ text, isMatch: false }];
  }

  const q = query.trim().toLowerCase();
  const lower = text.toLowerCase();
  const index = lower.indexOf(q);

  if (index === -1) {
    return [{ text, isMatch: false }];
  }

  const chunks: { text: string; isMatch: boolean }[] = [];
  if (index > 0) {
    chunks.push({ text: text.substring(0, index), isMatch: false });
  }
  chunks.push({ text: text.substring(index, index + q.length), isMatch: true });
  if (index + q.length < text.length) {
    chunks.push({ text: text.substring(index + q.length), isMatch: false });
  }

  return chunks;
}

/**
 * Recent searches storage helpers
 */
const RECENT_SEARCHES_KEY = 'parcel_recent_searches';

export function getRecentSearches(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
    return raw ? JSON.parse(raw) : ['Journal', 'Headphone', 'Planter', 'Domino'];
  } catch {
    return ['Journal', 'Headphone', 'Planter', 'Domino'];
  }
}

export function saveRecentSearch(query: string): string[] {
  const trimmed = query.trim();
  if (!trimmed || trimmed.length < 2) return getRecentSearches();

  try {
    const current = getRecentSearches();
    const updated = [trimmed, ...current.filter((item) => item.toLowerCase() !== trimmed.toLowerCase())].slice(0, 6);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [trimmed];
  }
}

export function clearRecentSearches(): void {
  try {
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  } catch {
    // Ignore storage errors
  }
}
