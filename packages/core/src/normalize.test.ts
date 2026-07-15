import { describe, it, expect } from 'vitest';
import { normalize, containsTerm, containsWord } from './normalize';

describe('normalize', () => {
  it('lower-cases and trims', () => {
    expect(normalize('  Hello WORLD  ').canonical).toBe('hello world');
  });

  it('folds homoglyphs to ASCII', () => {
    // "scam" written with Cyrillic с (U+0441) and а (U+0430).
    const cyrillic = 'sсаm';
    expect(normalize(cyrillic).canonical).toBe('scam');
  });

  it('strips zero-width characters', () => {
    const zw = 'sc​am';
    expect(normalize(zw).canonical).toBe('scam');
  });
});

describe('containsTerm (evasion)', () => {
  it('matches leetspeak', () => {
    expect(containsTerm(normalize('sc4m l1nk'), 'scam')).toBe(true);
  });

  it('matches separator injection', () => {
    expect(containsTerm(normalize('f r e e   b i t s'), 'free bits')).toBe(true);
    expect(containsTerm(normalize('free.bits.now'), 'free bits')).toBe(true);
  });

  it('matches collapsed repeats', () => {
    expect(containsTerm(normalize('freeeee biiiits'), 'free bits')).toBe(true);
  });

  it('does not match unrelated text', () => {
    expect(containsTerm(normalize('have a great stream'), 'free bits')).toBe(false);
  });
});

describe('containsWord (whole word)', () => {
  it('avoids the Scunthorpe problem', () => {
    expect(containsWord(normalize('this is a class assignment'), 'ass')).toBe(false);
    expect(containsWord(normalize('you are an ass'), 'ass')).toBe(true);
  });
});
