/**
 * Weighted multi-category lexicon for S3 heuristic scoring. Entries are matched
 * against the normalized candidates from S1, so evasion variants (leet,
 * homoglyphs, spacing) are caught without listing each variant here.
 *
 * This is a small seed list, not a dictionary: streamers add their own banned
 * terms per channel, and genuinely ambiguous messages are escalated to the AI.
 * Slurs and explicit threats carry a severity so the decision engine can bypass
 * the warning ladder (docs/MODERATION.md §6).
 */
import type { Category } from '@ozenmod/shared';
import type { Severity } from './types';

export interface LexEntry {
  term: string;
  category: Category;
  /** Contribution to that category's score in [0,1]. */
  weight: number;
  /** Floor severity implied by this term alone, if any. */
  severity?: Severity;
  /** Match only as a whole word (avoids the "class" → "ass" problem). */
  word?: boolean;
  /** Weight is amplified when the message targets another user. */
  targeted?: boolean;
}

// Identity slurs — severity 3, whole-word. A moderation blocklist has to name
// these to catch them; leet/homoglyph variants are handled by normalization.
const SLURS = [
  'nigger',
  'nigga',
  'faggot',
  'fag',
  'tranny',
  'retard',
  'kike',
  'spic',
  'chink',
  'coon',
  'wetback',
  'dyke',
];

// Explicit threats and self-harm encouragement — severity 3.
const THREATS: { term: string; word?: boolean }[] = [
  { term: 'kill yourself' },
  { term: 'kys', word: true },
  { term: 'kill you' },
  { term: 'i will find you' },
  { term: 'hang yourself' },
  { term: 'neck yourself' },
  { term: 'end your life' },
  { term: 'slit your' },
  { term: 'shoot you' },
  { term: 'i will hurt you' },
  { term: 'you should die' },
];

// Credential-phishing — severity 3 scam.
const PHISHING = [
  'verify your account',
  'account suspended',
  'login here',
  'enter your password',
  'twitch staff',
  'confirm your identity',
  'claim your prize',
];

function map(
  terms: (string | { term: string; word?: boolean })[],
  base: Omit<LexEntry, 'term'>,
): LexEntry[] {
  return terms.map((t) => (typeof t === 'string' ? { term: t, ...base } : { ...base, ...t }));
}

export const LEXICON: LexEntry[] = [
  ...map(SLURS, { category: 'hate', weight: 1, severity: 3, word: true }),
  ...map(THREATS, { category: 'threat', weight: 1, severity: 3 }),
  ...map(PHISHING, { category: 'scam', weight: 0.9, severity: 3 }),

  // Harassment — insulting nouns; amplified when aimed at a target.
  ...map(
    [
      'idiot',
      'moron',
      'stupid',
      'dumbass',
      'loser',
      'pathetic',
      'worthless',
      'clown',
      'trash',
      'garbage',
      'pig',
      'freak',
      'creep',
      'ugly',
    ],
    { category: 'harassment', weight: 0.45, targeted: true, word: true },
  ),
  { term: 'shut up', category: 'harassment', weight: 0.35, targeted: true },
  { term: 'stfu', category: 'harassment', weight: 0.4, targeted: true, word: true },
  { term: 'nobody likes you', category: 'harassment', weight: 0.6, targeted: true },

  // Sexual content.
  ...map(['send nudes', 'nudes', 'dick pic', 'show bobs', 'show me your', 'horny', 'sexy pics'], {
    category: 'sexual',
    weight: 0.6,
    severity: 2,
  }),

  // Scam / suspicious offers.
  ...map(
    [
      'free bits',
      'free follows',
      'free followers',
      'buy followers',
      'cheap followers',
      'free nitro',
      'nitro free',
      'gift card',
      'steam gift',
      'crypto giveaway',
      'double your',
      'x2 your',
      'become famous',
      'get famous',
      'grow your channel',
      'check my bio',
      'dm me for',
    ],
    { category: 'scam', weight: 0.7, severity: 2 },
  ),

  // Advertising / self-promotion.
  ...map(
    [
      'follow me',
      'follow my',
      'check out my',
      'sub to my',
      'subscribe to my',
      'follow for follow',
      'f4f',
      'viewers for',
      'come watch my',
    ],
    { category: 'advertising', weight: 0.6, severity: 1 },
  ),

  // General toxicity — profanity that is not, by itself, a targeted attack.
  ...map(['fuck', 'shit', 'bitch', 'asshole', 'bastard', 'dick', 'piss', 'cunt', 'whore', 'slut'], {
    category: 'toxicity',
    weight: 0.3,
    word: true,
  }),
];

// Phrases that quote or negate an attack ("he called me a…") dampen the score.
export const DAMPENERS = [
  'he said',
  'she said',
  'they said',
  'called me',
  'you said',
  'quote',
  'not a',
  "isn't a",
  'stop saying',
  "don't say",
  'why would you say',
  'someone said',
];
