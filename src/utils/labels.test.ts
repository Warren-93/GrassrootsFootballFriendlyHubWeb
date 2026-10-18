import { describe, expect, it } from 'vitest';
import { codeLabel, costShareLabel, dateLabel, organisationsFor, refereeLabel } from './labels';

describe('labels', () => {
  it('says codes in words', () => {
    expect(codeLabel('NINE_A_SIDE')).toBe('9v9');
    expect(codeLabel('EITHER')).toBe('No preference');
    expect(codeLabel('U12')).toBe('U12');
    expect(codeLabel('BOYS')).toBe('Boys');
    expect(codeLabel('HOST_PAYS')).toBe('Host pays');
    expect(codeLabel('CHANGES_REQUESTED')).toBe('Changes requested');
  });

  it('reads NONE by what it answers', () => {
    expect(refereeLabel('NONE')).toBe('No referee');
    expect(refereeLabel('CLUB_SUPPLIED')).toBe('Club supplied');
    expect(costShareLabel('NONE')).toBe('No costs');
    expect(costShareLabel('SPLIT')).toBe('Split');
  });

  it('writes a calendar date out', () => {
    expect(dateLabel('2026-10-24')).toBe('Sat, 24 Oct 2026');
    expect(dateLabel('not a date')).toBe('not a date');
  });

  it('offers only the organisations that cover the age group', () => {
    expect(organisationsFor('ADULT')).not.toContain('SSFA');
    expect(organisationsFor('VETERANS')).toContain('SWFA');
    expect(organisationsFor('U12')).toEqual(['SYFA', 'SWF', 'SSFA', 'OTHER']);
    expect(organisationsFor('U12', 'BOYS')).toEqual(['SYFA', 'SSFA', 'OTHER']);
    expect(organisationsFor('ADULT', 'MEN')).not.toContain('SWF');
    expect(organisationsFor('ADULT', 'WOMEN')).toContain('SWF');
    expect(organisationsFor('U14', 'MIXED')).toContain('SWF');
  });
});
