import React from "react";

const Terms = () => {
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Terms of Service</h1>
      <p style={styles.effectiveDate}>
        Effective Date: April 22, 2026
      </p>

      <p>
        These Terms of Service (“Terms”) govern your access to and use of <strong>Cortexa CRM</strong> (“Cortexa”, “we”, “our”, “us”). By using our platform, you agree to these Terms.
      </p>

      <Section title="1. Eligibility">
          <p>You must:</p>
          <ul style={styles.ul}>
            <li>Be at least 18 years old</li>
            <li>Operate a legitimate business or professional service</li>
          </ul>
          <p>
            You may not use Cortexa for illegal, fraudulent, or prohibited activities.
          </p>
        </Section>

        <Section title="2. Services">
          <p>Cortexa provides:</p>
          <ul style={styles.ul}>
            <li>Lead management tools</li>
            <li>CRM functionality</li>
            <li>Automation and analytics tools</li>
          </ul>
          <p>
            We may modify, update, or discontinue features at any time without notice.
          </p>
        </Section>

        <Section title="3. Account Responsibility">
          <p>You are responsible for:</p>
          <ul style={styles.ul}>
            <li>Maintaining account security</li>
            <li>All activity under your account</li>
            <li>Providing accurate information</li>
          </ul>
          <p>
            We may suspend or terminate accounts for suspicious, abusive, or prohibited activity.
          </p>
        </Section>

        <Section title="4. Acceptable Use">
          <p>You agree NOT to:</p>
          <ul style={styles.ul}>
            <li>Engage in fraud or illegal activity</li>
            <li>Send spam or unauthorized messages</li>
            <li>Violate data protection or privacy laws</li>
            <li>Mislead or deceive users</li>
          </ul>
          <p>Violation may result in immediate account termination.</p>
        </Section>

        <Section title="5. Free Trial, Activation Fee & Billing">
          <p>Cortexa offers a 14-day free trial.</p>

          <p>To activate your account:</p>
          <ul style={styles.ul}>
            <li>A one-time activation fee of $27 may be charged at signup</li>
          </ul>

          <p>During the trial:</p>
          <ul style={styles.ul}>
            <li>You have full access to the platform</li>
          </ul>

          <p>After the 14-day trial:</p>
          <ul style={styles.ul}>
            <li>Your subscription will automatically convert to a paid plan</li>
            <li>
              You will be charged the applicable subscription fee (e.g., $299/month or selected plan)
            </li>
          </ul>

          <p>Billing terms:</p>
          <ul style={styles.ul}>
            <li>Subscriptions are billed monthly or annually depending on your selection</li>
            <li>Billing is recurring and will continue until canceled</li>
            <li>Payments are processed through third-party providers (e.g., PayPal)</li>
          </ul>

          <p>
            By signing up, you authorize Cortexa to charge your payment method according to these terms.
          </p>
        </Section>

        <Section title="6. Cancellation & Refund Policy">
          <ul style={styles.ul}>
            <li>You may cancel your subscription at any time before the next billing cycle</li>
            <li>Cancellation prevents future charges but does not retroactively refund past payments</li>
            <li>All payments are non-refundable unless required by law</li>
          </ul>

          <p>No refunds will be issued for:</p>
          <ul style={styles.ul}>
            <li>Partial billing periods</li>
            <li>Failure to cancel before renewal</li>
            <li>Lack of usage</li>
          </ul>
        </Section>

        <Section title="7. User Data & Responsibility">
          <ul style={styles.ul}>
            <li>You retain ownership of your data</li>
            <li>Cortexa processes data only to provide services</li>
            <li>We do NOT sell your data</li>
          </ul>

          <p>You are responsible for ensuring your data:</p>
          <ul style={styles.ul}>
            <li>Complies with applicable laws</li>
            <li>Is accurate and lawful to use</li>
          </ul>
        </Section>

        <Section title="8. Third-Party Services">
          <p>Cortexa may integrate with third-party services.</p>
          <p>We are not responsible for:</p>
          <ul style={styles.ul}>
            <li>Third-party performance</li>
            <li>External service outages</li>
            <li>Third-party policies or data handling</li>
          </ul>
        </Section>

        <Section title="9. Intellectual Property">
          <p>All Cortexa platform content, design, and software are owned by Cortexa.</p>
          <p>You may not:</p>
          <ul style={styles.ul}>
            <li>Copy</li>
            <li>Distribute</li>
            <li>Modify</li>
            <li>Reverse engineer</li>
          </ul>
          <p>without prior written permission.</p>
        </Section>

        <Section title="10. Service Availability">
          <p>We do not guarantee uninterrupted service.</p>
          <p>Service may be affected by:</p>
          <ul style={styles.ul}>
            <li>Maintenance</li>
            <li>Updates</li>
            <li>System changes</li>
            <li>External factors</li>
          </ul>
        </Section>

        <Section title="11. Limitation of Liability">
          <p>To the maximum extent permitted by law, Cortexa is not liable for:</p>
          <ul style={styles.ul}>
            <li>Loss of profits</li>
            <li>Data loss</li>
            <li>Business interruption</li>
            <li>Indirect or consequential damages</li>
          </ul>
        </Section>

        <Section title="12. Indemnification">
          <p>
            You agree to defend and hold Cortexa harmless from any claims arising from:
          </p>
          <ul style={styles.ul}>
            <li>Your use of the platform</li>
            <li>Violations of these Terms</li>
            <li>Violations of applicable laws</li>
          </ul>
        </Section>

        <Section title="13. Termination">
          <p>We may suspend or terminate your account for:</p>
          <ul style={styles.ul}>
            <li>Violation of these Terms</li>
            <li>Fraudulent or prohibited activity</li>
            <li>Legal or compliance reasons</li>
          </ul>
        </Section>

        <Section title="14. Changes to Terms">
          <p>
            We may update these Terms at any time. Continued use of the platform constitutes acceptance of the updated Terms.
          </p>
        </Section>

        <Section title="15. Governing Law">
          <p>
            These Terms are governed by applicable laws in your operating jurisdiction.
          </p>
        </Section>

        <Section title="16. Contact">
          <p>Support Email: support@cortexa.ai</p>
          <p>Company: Cortexa CRM</p>
        </Section>
    </div>
  );
};

const Section = ({ title, children }) => (
  <div style={styles.section}>
    <h2 style={styles.sectionTitle}>{title}</h2>
    <div style={styles.sectionContent}>{children}</div>
  </div>
);

const styles = {
  container: {
    maxWidth: "900px",
    margin: "40px auto",
    padding: "20px",
    fontFamily: "Arial, sans-serif",
    lineHeight: "1.6",
    color: "#333",
  },
  title: {
    fontSize: "36px",
    marginBottom: "10px",
  },
  effectiveDate: {
    color: "#777",
    marginBottom: "20px",
  },
  section: {
    marginTop: "30px",
  },
  sectionTitle: {
    fontSize: "22px",
    marginBottom: "10px",
  },
  sectionContent: {
    fontSize: "15px",
  },
  ul: {
      paddingLeft: "24px",
      marginTop: "8px",
      marginBottom: "12px",
    },
};

export default Terms;