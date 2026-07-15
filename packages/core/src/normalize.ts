/**
 * S1 — Normalization. Defeats evasion by folding a message into a small set of
 * canonical candidate strings that all later stages match against. The original
 * text is always preserved for explanations.
 *
 * Pure and synchronous — see docs/MODERATION.md §3 (S1).
 */

// Look-alike characters (Cyrillic / Greek) → ASCII.
const HOMOGLYPHS: Record<string, string> = {
  а: 'a',
  е: 'e',
  о: 'o',
  р: 'p',
  с: 'c',
  х: 'x',
  у: 'y',
  к: 'k',
  м: 'm',
  н: 'h',
  т: 't',
  в: 'b',
  і: 'i',
  ѕ: 's',
  ј: 'j',
  ԁ: 'd',
  ɡ: 'g',
  ο: 'o',
  ε: 'e',
  ρ: 'p',
  α: 'a',
  ν: 'v',
  υ: 'u',
  τ: 't',
  κ: 'k',
  ι: 'i',
  һ: 'h',
};

// Leetspeak substitutions, applied to build a parallel candidate string.
const LEET: Record<string, string> = {
  '0': 'o',
  '1': 'i',
  '3': 'e',
  '4': 'a',
  '5': 's',
  '7': 't',
  '8': 'b',
  '@': 'a',
  $: 's',
  '!': 'i',
  '(': 'c',
  '|': 'i',
  '+': 't',
};

// Zero-width and invisible characters that only exist to break matching.
const INVISIBLE = new RegExp('[\\u200B-\\u200F\\u2060-\\u2064\\uFEFF\\u00AD\\u034F\\u180E]', 'g');

export interface NormalizedText {
  /** The message exactly as received (for human-readable explanations). */
  original: string;
  /** Canonical fold: NFKC, lower-case, homoglyph- and invisible-stripped. */
  canonical: string;
  /** All fold candidates a term/lexicon match should be tested against. */
  candidates: string[];
  /** Each candidate with every non-alphanumeric character removed. */
  stripped: string[];
}

function foldBase(text: string): string {
  const nfkc = text.normalize('NFKC').toLowerCase().replace(INVISIBLE, '');
  let out = '';
  for (const ch of nfkc) out += HOMOGLYPHS[ch] ?? ch;
  return out.replace(/\s+/g, ' ').trim();
}

function applyLeet(text: string): string {
  let out = '';
  for (const ch of text) out += LEET[ch] ?? ch;
  return out;
}

/** Collapse runs of 3+ identical characters to a single one (`niiiice` → `nice`). */
function collapseRepeats(text: string): string {
  return text.replace(/(.)\1{2,}/g, '$1');
}

/** Collapse every run of identical characters to a single one (`free` → `fre`). */
function squeeze(text: string): string {
  return text.replace(/(.)\1+/g, '$1');
}

function stripSeparators(text: string): string {
  return text.replace(/[^a-z0-9]/g, '');
}

export function normalize(text: string): NormalizedText {
  const base = foldBase(text);
  const leet = applyLeet(base);
  const candidates = unique([base, leet, collapseRepeats(base), collapseRepeats(leet)]);
  // Squeezed + separator-stripped forms defeat elongation and spacing together.
  const stripped = unique(candidates.map((c) => squeeze(stripSeparators(c)))).filter(Boolean);
  return { original: text, canonical: base, candidates, stripped };
}

function unique(list: string[]): string[] {
  return [...new Set(list)].filter((s) => s.length > 0);
}

/** Normalize a lexicon/banned term the same way, so matching is symmetric. */
export function foldTerm(term: string): { folded: string; stripped: string } {
  const folded = collapseRepeats(applyLeet(foldBase(term)));
  return { folded, stripped: squeeze(stripSeparators(folded)) };
}

/**
 * True when `term` appears in the normalized message. A term with a space
 * (`free bits`) also matches when the separators were removed to evade
 * detection (`f r e e b i t s`, `free.bits`).
 */
export function containsTerm(norm: NormalizedText, term: string): boolean {
  const { folded, stripped } = foldTerm(term);
  if (!folded) return false;
  if (norm.candidates.some((c) => c.includes(folded))) return true;
  if (stripped.length >= 3 && norm.stripped.some((s) => s.includes(stripped))) return true;
  return false;
}

/** True when any whole-word form of `word` appears (avoids `class` → `ass`). */
export function containsWord(norm: NormalizedText, word: string): boolean {
  const { folded } = foldTerm(word);
  if (!folded) return false;
  const re = new RegExp(`(?:^|[^a-z0-9])${escapeRegExp(folded)}(?:[^a-z0-9]|$)`);
  return norm.candidates.some((c) => re.test(c));
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
