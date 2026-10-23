import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BulkAddAvailabilityPage } from './BulkAddAvailabilityPage';
import { useCurrentTeam } from '../../session/CurrentTeamContext';
import { availabilityRepository } from '../../api/availabilityRepository';
import { venueRepository } from '../../api/venueRepository';

vi.mock('../../session/CurrentTeamContext', () => ({ useCurrentTeam: vi.fn() }));
vi.mock('../../api/availabilityRepository', () => ({ availabilityRepository: { createBulk: vi.fn() } }));
vi.mock('../../api/venueRepository', () => ({ venueRepository: { list: vi.fn() } }));

function farFuture(offsetDays: number): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function addDate(iso: string) {
  fireEvent.change(screen.getByLabelText('Date'), { target: { value: iso } });
  fireEvent.click(screen.getByRole('button', { name: 'Add date' }));
}

describe('BulkAddAvailabilityPage pick dates mode', () => {
  beforeEach(() => {
    vi.mocked(useCurrentTeam).mockReturnValue({
      active: { teamId: 'team-1', teamName: 'Riverside U12 Girls', clubId: 'club-1' },
      setActive: vi.fn(),
      clear: vi.fn(),
    } as unknown as ReturnType<typeof useCurrentTeam>);
    vi.mocked(venueRepository.list).mockResolvedValue({ ok: true, value: [] } as never);
    vi.mocked(availabilityRepository.createBulk).mockResolvedValue({
      ok: true,
      value: { created: [{}, {}], skippedPastDates: [] },
    } as never);
  });

  it('publishes exactly the picked dates, in date order', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <BulkAddAvailabilityPage />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: 'Pick dates' }));
    expect(screen.queryByLabelText('Start date')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Publish 0 dates' })).toBeDisabled();

    const later = farFuture(10);
    const sooner = farFuture(3);
    addDate(later);
    addDate(sooner);
    addDate(sooner);
    expect(screen.getByText('That date is already in the list.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Publish 2 dates' }));

    expect(availabilityRepository.createBulk).toHaveBeenCalledWith(
      'team-1',
      expect.objectContaining({ dates: [sooner, later], startTime: '10:00:00', endTime: '12:00:00' }),
    );
    expect(await screen.findByText('2 dates published.')).toBeInTheDocument();
  });

  it('lets a picked date be removed again', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <BulkAddAvailabilityPage />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: 'Pick dates' }));
    addDate(farFuture(3));
    expect(screen.getByRole('button', { name: 'Publish 1 date' })).toBeEnabled();

    await user.click(screen.getByRole('button', { name: 'Clear all' }));
    expect(screen.getByRole('button', { name: 'Publish 0 dates' })).toBeDisabled();
  });
});
