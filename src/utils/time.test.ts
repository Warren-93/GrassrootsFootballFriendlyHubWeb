import { describe, expect, it } from 'vitest';
import { addMinutesToTime } from './time';

describe('addMinutesToTime', () => {
  it('adds minutes within the same hour', () => {
    expect(addMinutesToTime('10:00', 15)).toBe('10:15');
  });

  it('rolls over into the next hour', () => {
    expect(addMinutesToTime('10:50', 20)).toBe('11:10');
  });

  it('rolls over past midnight-adjacent hours within the same day', () => {
    expect(addMinutesToTime('22:30', 90)).toBe('23:59');
  });

  it('clamps at 23:59 rather than wrapping to the next day', () => {
    expect(addMinutesToTime('23:50', 30)).toBe('23:59');
  });

  it('clamps at 00:00 for a negative result rather than going negative', () => {
    expect(addMinutesToTime('00:10', -30)).toBe('00:00');
  });

  it('subtracts minutes correctly when the result stays in range', () => {
    expect(addMinutesToTime('10:15', -15)).toBe('10:00');
  });
});
