import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ConversationThreadPage } from './ConversationThreadPage';
import { useCurrentTeam } from '../../session/CurrentTeamContext';
import { conversationRepository } from '../../api/conversationRepository';
import type { ConversationView, MessageView } from '../../api/types';

vi.mock('../../session/CurrentTeamContext', () => ({ useCurrentTeam: vi.fn() }));
vi.mock('../../api/conversationRepository', () => ({
  conversationRepository: { list: vi.fn(), get: vi.fn(), messages: vi.fn(), send: vi.fn() },
}));

const conversation: ConversationView = {
  id: 'c1',
  otherTeam: {
    id: 'team-2',
    name: 'Haywards Heath Harriers',
    clubName: 'Harriers FC',
    badgeUrl: null,
    ageGroup: 'U12',
    gender: 'GIRLS',
    format: 'NINE_A_SIDE',
    abilityLevel: 'DIVISION_2',
    league: null,
    description: null,
    generalArea: 'RH16',
    verified: true,
  },
  lastMessageBody: null,
  lastMessageSenderTeamId: null,
  lastMessageAt: null,
  createdAt: '2026-10-16T08:00:00Z',
  relatedFixtureId: null,
};

const sent: MessageView = {
  id: 'm1',
  conversationId: 'c1',
  senderTeamId: 'team-1',
  senderUserId: 'user-1',
  body: 'Hello from Riverside',
  createdAt: new Date().toISOString(),
};

const originalMatchMedia = window.matchMedia;

describe('ConversationThreadPage', () => {
  beforeEach(() => {
    // The two-pane desktop layout, with the inbox beside the thread.
    window.matchMedia = ((query: string) => ({
      matches: true,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia;
    // jsdom doesn't scroll; the thread scrolls to its newest message.
    Element.prototype.scrollIntoView = vi.fn();
    vi.mocked(useCurrentTeam).mockReturnValue({
      active: { teamId: 'team-1', teamName: 'Riverside U12 Girls', clubId: 'club-1' },
      setActive: vi.fn(),
      clear: vi.fn(),
    });
    vi.mocked(conversationRepository.list).mockResolvedValue({ ok: true, value: [conversation] });
    vi.mocked(conversationRepository.get).mockResolvedValue({ ok: true, value: conversation });
    vi.mocked(conversationRepository.messages).mockResolvedValue({ ok: true, value: [] });
    vi.mocked(conversationRepository.send).mockResolvedValue({ ok: true, value: sent });
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    vi.clearAllMocks();
  });

  it('shows the first message in the inbox preview as soon as it is sent', async () => {
    render(
      <MemoryRouter initialEntries={['/messages/c1']}>
        <Routes>
          <Route path="/messages/:conversationId" element={<ConversationThreadPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText('No messages yet')).toBeInTheDocument();
    await userEvent.type(await screen.findByPlaceholderText('Message…'), 'Hello from Riverside');
    vi.mocked(conversationRepository.messages).mockResolvedValue({ ok: true, value: [sent] });
    await userEvent.click(screen.getByRole('button', { name: 'Send' }));

    const preview = await screen.findByText('You: Hello from Riverside');
    expect(within(preview.closest('button')!).getByText('Haywards Heath Harriers')).toBeInTheDocument();
    expect(screen.queryByText('No messages yet')).not.toBeInTheDocument();
    expect(conversationRepository.list).toHaveBeenCalledTimes(1);
  });
});
