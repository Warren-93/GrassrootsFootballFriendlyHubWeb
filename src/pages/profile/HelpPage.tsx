import { Accordion, AccordionDetails, AccordionSummary, Alert, Box, Button, Container, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { AccountTabs } from '../../components/AccountTabs';
import { brand } from '../../theme/theme';

interface FaqEntry {
  question: string;
  answer: string;
}

const FAQS: FaqEntry[] = [
  {
    question: 'How does matching work?',
    answer:
      'Search ranks nearby teams by how well your published availability, format, ability level, age group and ' +
      'travel distance line up with theirs. Tap a result to see the exact factors behind its score.',
  },
  {
    question: 'How do I cancel a fixture?',
    answer:
      'Open the fixture from Arrange & fixtures and choose Cancel fixture. Both teams are notified.',
  },
  {
    question: 'What does verification check?',
    answer:
      'An admin reviews your league/FA affiliation number (if you have one), a contact for follow-up questions, and ' +
      'evidence links (league registration, club website, social media) before marking a team verified.',
  },
  {
    question: 'Can I have more than one team?',
    answer:
      'Yes - a club can run several squads. Switch between them from the team switcher in the account menu, or add ' +
      'another from Club & members.',
  },
  {
    question: 'How do I get my team verified?',
    answer:
      'Open Team & club, choose Verification, and submit your details and evidence. An admin reviews it and you\'ll ' +
      'see the outcome on the same screen.',
  },
  {
    question: 'How do I add another manager or club admin?',
    answer:
      'From Team & club, choose Club & members. They need an existing account with the email you enter. Club ' +
      'admins can manage every squad the club runs; team managers can only manage the one team.',
  },
  {
    question: "What happens after I send a friendly request?",
    answer:
      'The other team can confirm it as-is, suggest changes to the date, time or venue, or decline it. You\'ll see ' +
      'the current status and any message from them on the request itself.',
  },
  {
    question: 'How do I report a concern or block a team?',
    answer: 'From that team\'s profile, choose Report. Safeguarding concerns are flagged for immediate review. You can ' +
      'also block a team from the same screen, which cancels any open requests between you.',
  },
  {
    question: 'Can I see or delete the data held on my account?',
    answer: 'Yes - Account > Privacy & data shows a summary of what\'s held on you and lets you download it. Deleting ' +
      'your account entirely is on the Settings tab.',
  },
];

// SCR-PR-12 Help and support. Purpose: self-serve answers, plus a clear path
// to the real escalation route (Report) for anything that needs a human.
export function HelpPage() {
  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <AccountTabs />

      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2.5 }}>
        Help &amp; support
      </Typography>

      <Box sx={{ maxWidth: 640 }}>
        {FAQS.map((faq) => (
          <Accordion
            key={faq.question}
            disableGutters
            elevation={0}
            sx={{ border: 1, borderColor: 'divider', borderRadius: '12px !important', mb: 1, '&::before': { display: 'none' } }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ fontSize: 18, color: brand.muted }} />}>
              <Typography sx={{ fontWeight: 700, fontSize: 13.5 }}>{faq.question}</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0 }}>
              <Typography variant="body2" color="text.secondary">
                {faq.answer}
              </Typography>
            </AccordionDetails>
          </Accordion>
        ))}

        <Alert severity="warning" sx={{ mt: 2, mb: 2.5 }}>
          If there's an immediate risk to a child, contact the police and your safeguarding officer directly - not
          only through the app. For anything else, open the team's profile and choose Report.
        </Alert>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            borderRadius: 3,
            p: 2.5,
            color: '#fff',
            background: `linear-gradient(120deg, ${brand.void}, ${brand.pitchDeep} 70%)`,
          }}
        >
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: 14 }}>Still stuck?</Typography>
            <Typography sx={{ fontSize: 12.5, color: 'rgba(255,255,255,.72)' }}>
              Message the PitchMate support team directly.
            </Typography>
          </Box>
          <Button
            variant="contained"
            href="mailto:support@pitchmate.co"
            sx={{ bgcolor: brand.lime, color: brand.void, flexShrink: 0, '&:hover': { bgcolor: brand.lime } }}
          >
            Message support
          </Button>
        </Box>
      </Box>
    </Container>
  );
}
