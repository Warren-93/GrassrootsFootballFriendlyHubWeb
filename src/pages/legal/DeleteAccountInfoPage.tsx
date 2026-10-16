import { Typography } from '@mui/material';
import { LegalPageLayout, LegalSection, SupportContact } from './LegalPageLayout';

// Google Play asks apps that create accounts for a public web page explaining
// how to delete one, reachable without installing the app.
export function DeleteAccountInfoPage() {
  return (
    <LegalPageLayout title="Delete your Kickabout account" updated="16 October 2026">
      <LegalSection heading="In the app">
        <ol>
          <li>Sign in to the Kickabout app for Android or iOS.</li>
          <li>Open Settings, then Privacy and data.</li>
          <li>Choose Delete my account and confirm.</li>
        </ol>
      </LegalSection>

      <LegalSection heading="On the website">
        <ol>
          <li>
            Sign in at <a href="/sign-in">Kickabout on the web</a>.
          </li>
          <li>Open Settings, then choose Delete account and confirm.</li>
        </ol>
      </LegalSection>

      <LegalSection heading="Can't sign in?">
        <Typography>
          Contact us <SupportContact /> from the email address on the account, and we'll delete it for you.
        </Typography>
      </LegalSection>

      <LegalSection heading="What gets deleted">
        <ul>
          <li>Your account, name, email address and password, straight away.</li>
          <li>Your team and club memberships, any pending invitations to your email address, and your devices' push tokens.</li>
        </ul>
        <Typography>
          Team and club records, fixtures and messages your team sent stay with the club, because other managers
          rely on them. If you're the only admin of a club, you'll be asked to make someone else an admin first.
        </Typography>
      </LegalSection>
    </LegalPageLayout>
  );
}
