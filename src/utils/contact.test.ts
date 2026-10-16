import { describe, expect, it } from 'vitest';
import { contactLine, unbrokenPhone } from './contact';

describe('unbrokenPhone', () => {
  it('joins the parts of the number with non-breaking spaces', () => {
    expect(unbrokenPhone(' 07700  900123 ')).toBe('07700 900123');
  });

  it('is empty when there is no number', () => {
    expect(unbrokenPhone(null)).toBe('');
    expect(unbrokenPhone(undefined)).toBe('');
  });
});

describe('contactLine', () => {
  it("puts the manager's name before their number", () => {
    expect(contactLine('Sam Patel', '07700 900123')).toBe('Sam Patel 07700\u00a0900123');
  });

  it('shows whichever part was given', () => {
    expect(contactLine('Sam Patel', null)).toBe('Sam Patel');
    expect(contactLine(null, '07700 900123')).toBe('07700\u00a0900123');
  });

  it('says so when neither was given', () => {
    expect(contactLine(null, null)).toBe('Not given');
    expect(contactLine(' ', undefined)).toBe('Not given');
  });
});
