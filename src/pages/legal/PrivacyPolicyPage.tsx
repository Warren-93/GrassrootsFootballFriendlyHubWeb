import { Typography } from '@mui/material';
import { LegalPageLayout, LegalSection, SupportContact } from './LegalPageLayout';

// Public privacy policy for Kickabout's web and mobile apps. Google Play
// requires a publicly reachable URL for this, so it lives outside the gates.
export function PrivacyPolicyPage() {
  return (
    <LegalPageLayout title="Kickabout privacy policy" updated="16 October 2026">
      <Typography>
        Kickabout helps grassroots football teams find opponents and arrange friendly matches. This policy explains
        what we collect when you use the Kickabout website or the Kickabout app for Android or iOS, why, and what you
        can do about it.
      </Typography>

      <LegalSection heading="What we collect">
        <ul>
          <li>
            <strong>Your account:</strong> your name, email address and a scrambled (hashed) password. If you sign in
            with Google or Apple, we receive your name and email address from them instead of a password.
          </li>
          <li>
            <strong>Your club and teams:</strong> names, badges, age group, ability level, league, home postcode and
            its approximate map location, venues and their addresses, and the manager name and contact phone number
            you choose to add.
          </li>
          <li>
            <strong>Your activity:</strong> published availability, match requests, fixtures, messages between teams,
            notifications, reports and blocks, and verification evidence you submit.
          </li>
          <li>
            <strong>Device details for notifications:</strong> if you allow push notifications, a push token for your
            device.
          </li>
        </ul>
        <Typography>We don't use advertising, we don't track you across other apps or websites, and we don't sell data.</Typography>
      </LegalSection>

      <LegalSection heading="How we use it">
        <ul>
          <li>To run your account and sign you in.</li>
          <li>To match your team with suitable opponents and show your team profile to other managers.</li>
          <li>To deliver messages, requests and fixture updates, by email and push notification.</li>
          <li>To keep the service safe, including reviewing reports and verifying teams.</li>
        </ul>
        <Typography>
          Other managers see your team profile and the contact details you add to it. Your profile visibility and
          contact sharing can be changed in Settings under Privacy &amp; data.
        </Typography>
      </LegalSection>

      <LegalSection heading="Who else handles it">
        <Typography>
          We use service providers to host and deliver Kickabout: our hosting and database providers, an email
          provider to send account and notification emails, Google Firebase and Apple to deliver push notifications,
          and Google or Apple sign-in if you choose them. Maps are drawn with OpenStreetMap, and postcodes are looked
          up with postcodes.io. They only receive what they need to provide that service. Data is encrypted in
          transit over HTTPS.
        </Typography>
      </LegalSection>

      <LegalSection heading="How long we keep it">
        <Typography>
          We keep your account details until you delete your account. Team, club and fixture records stay with the
          club, because other managers and fixtures depend on them.
        </Typography>
      </LegalSection>

      <LegalSection heading="Your choices">
        <ul>
          <li>Download a copy of your data from Settings under Privacy &amp; data.</li>
          <li>Turn notification types on or off in notification settings, or turn off push in your phone's settings.</li>
          <li>
            Delete your account at any time. See <a href="/delete-account">how to delete your account</a>.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="Children">
        <Typography>
          Accounts are for adult team managers and club officials. Kickabout isn't meant for anyone under 18, and we
          don't knowingly collect children's data.
        </Typography>
      </LegalSection>

      <LegalSection heading="Contact">
        <Typography>
          Questions about your data? Contact us <SupportContact />. We'll update this page if anything changes.
        </Typography>
      </LegalSection>
    </LegalPageLayout>
  );
}
