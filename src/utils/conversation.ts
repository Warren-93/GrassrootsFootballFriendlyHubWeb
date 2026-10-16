import type { ConversationView, MessageView } from '../api/types';

/**
 * The inbox with the messages just sent from the open thread applied, keyed
 * by conversation id - so a preview doesn't say "No messages yet" until the
 * list is fetched again. A conversation with a newer message moves to the
 * top, since the inbox lists the most recently active first.
 */
export function withSentMessages(
  conversations: ConversationView[],
  sent: Record<string, MessageView>,
): ConversationView[] {
  const updated: ConversationView[] = [];
  const rest: ConversationView[] = [];
  for (const c of conversations) {
    const message = sent[c.id];
    if (message && (!c.lastMessageAt || Date.parse(message.createdAt) > Date.parse(c.lastMessageAt))) {
      updated.push({
        ...c,
        lastMessageBody: message.body,
        lastMessageSenderTeamId: message.senderTeamId,
        lastMessageAt: message.createdAt,
      });
    } else {
      rest.push(c);
    }
  }
  updated.sort((a, b) => Date.parse(b.lastMessageAt!) - Date.parse(a.lastMessageAt!));
  return [...updated, ...rest];
}
