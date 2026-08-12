import { Alert, Button, Card, CardContent, Container, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

interface FaqEntry {
  question: string;
  answer: string;
}

const FAQS: FaqEntry[] = [
  {
    question: 'How do I get my team verified?',
    answer:
      'Open your team profile and choose Verification. Submit your league/FA affiliation number (if you have one), ' +
      'a way for an admin to reach you, and a couple of evidence links (league registration, club website, social ' +
      'media). An admin reviews it and you\'ll see the outcome on the same screen.',
  },
  {
    question: 'How do I add another manager or club admin?',
    answer:
      'From your team profile, choose Officials. They need an existing account with the email you enter. Club ' +
      'admins can manage every squad the club runs; team managers can only manage the one team.',
  },
  {
    question: 'How does matching work?',
    answer:
      'Search ranks nearby teams by how well your published availability, format, ability level, age group and ' +
      'travel distance line up with theirs. Tap a result to see the exact factors behind its score.',
  },
  {
    question: "What happens after I send a friendly request?",
    answer:
      'The other team can confirm it as-is, suggest changes to the date, time or venue, or decline it. You\'ll see ' +
      'the current status and any message from them on the request itself.',
  },
  {
    question: 'How do I report a concern or block a team?',
    answer:
      'From that team\'s profile, choose Report. Safeguarding concerns are flagged for immediate review. You can ' +
      'also block a team from the same screen, which cancels any open requests between you.',
  },
  {
    question: 'Can I see or delete the data held on my account?',
    answer: 'Yes - Settings > Privacy and data shows a summary of what\'s held on you and lets you delete your account.',
  },
];

// SCR-PR-12 Help and support. Purpose: self-serve answers, plus a clear path
// to the real escalation route (Report) for anything that needs a human.
export function HelpPage() {
  const navigate = useNavigate();

  return (
    <Container maxWidth="xs" sx={{ py: 6 }}>
      <Stack spacing={2.5}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Help and support
        </Typography>

        <Stack spacing={1.5}>
          {FAQS.map((faq) => (
            <Card key={faq.question} variant="outlined">
              <CardContent>
                <Typography sx={{ fontWeight: 600 }}>{faq.question}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {faq.answer}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Stack>

        <Alert severity="warning">
          If there's an immediate risk to a child, contact the police and your safeguarding officer directly - not
          only through the app. For anything else, open the team's profile and choose Report.
        </Alert>

        <Button variant="text" onClick={() => navigate(-1)}>
          Back
        </Button>
      </Stack>
    </Container>
  );
}
