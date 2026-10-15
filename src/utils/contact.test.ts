import { describe, expect, it } from 'vitest';
import { unbrokenPhone } from './contact';

describe('unbrokenPhone', () => {
  it('joins the parts of the number with non-breaking spaces', () => {
    expect(unbrokenPhone(' 07700  900123 ')).toBe('07700 900123');
  });

  it('is empty when there is no number', () => {
    expect(unbrokenPhone(null)).toBe('');
    expect(unbrokenPhone(undefined)).toBe('');
  });
});
