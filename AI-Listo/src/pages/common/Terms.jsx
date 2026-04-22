import React from "react";

const Terms = () => {
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Terms of Service</h1>
      <p style={styles.effectiveDate}>
        Effective Date: April 22, 2026
      </p>

      <p>
        These Terms of Service (“Terms”) are a legally binding agreement between
        you (“User”, “Customer”) and <strong>Cortexa CRM</strong> (“Cortexa”, “we”,
        “our”, “us”) governing your access to and use of our platform.
      </p>

      <p>By using Cortexa CRM, you agree to these Terms.</p>

      <Section title="1. Eligibility">
        <ul>
          <li>At least 18 years old</li>
          <li>Operating a legitimate business or professional service</li>
        </ul>
        <p>
          You may not use Cortexa if your business involves illegal, fraudulent,
          or prohibited activities.
        </p>
      </Section>

      <Section title="2. Services Provided">
        <ul>
          <li>Lead management tools</li>
          <li>CRM functionality</li>
          <li>Automation and analytics tools</li>
        </ul>
        <p>
          We reserve the right to modify, update, or discontinue features at any
          time.
        </p>
      </Section>

      <Section title="3. Account Responsibility">
        <ul>
          <li>Maintaining account security</li>
          <li>All activity under your account</li>
          <li>Ensuring your data is accurate</li>
        </ul>
        <p>
          We may suspend accounts for suspicious or abusive activity.
        </p>
      </Section>

      <Section title="4. Acceptable Use">
        <ul>
          <li>Fraudulent activity</li>
          <li>Spam or unauthorized messaging</li>
          <li>Violating privacy laws</li>
          <li>Misleading or deceptive practices</li>
        </ul>
        <p>Violation may result in immediate termination.</p>
      </Section>

      <Section title="5. Subscription & Billing">
        <ul>
          <li>Subscription-based service</li>
          <li>Billed monthly or annually</li>
          <li>Recurring billing upon signup</li>
          <li>Payments via third-party providers (e.g., PayPal)</li>
        </ul>
        <p>Failure to pay may result in account suspension.</p>
      </Section>

      <Section title="6. Refund Policy">
        <ul>
          <li>All payments are non-refundable</li>
          <li>Cancel before billing if trial is offered</li>
          <li>No refunds after charges are processed</li>
        </ul>
        <p>
          Exceptions may be made only at our discretion or where required by law.
        </p>
      </Section>

      <Section title="7. User Data & Ownership">
        <ul>
          <li>You retain ownership of your data</li>
          <li>We process data only to provide services</li>
          <li>We do NOT sell your data</li>
        </ul>
        <p>
          You are responsible for ensuring your data complies with laws.
        </p>
      </Section>

      <Section title="8. Third-Party Services">
        <p>
          Cortexa may integrate with third-party tools. We are not responsible
          for third-party service performance or policies.
        </p>
      </Section>

      <Section title="9. Intellectual Property">
        <p>All platform content, design, and software are owned by Cortexa.</p>
        <ul>
          <li>Copy</li>
          <li>Distribute</li>
          <li>Reverse engineer</li>
        </ul>
        <p>are prohibited without permission.</p>
      </Section>

      <Section title="10. Service Availability">
        <p>We do not guarantee uninterrupted service.</p>
        <ul>
          <li>Maintenance</li>
          <li>System modifications</li>
          <li>Temporary suspension</li>
        </ul>
      </Section>

      <Section title="11. Limitation of Liability">
        <p>
          To the maximum extent permitted by law, Cortexa is NOT liable for:
        </p>
        <ul>
          <li>Loss of profits</li>
          <li>Data loss</li>
          <li>Business interruption</li>
        </ul>
      </Section>

      <Section title="12. Indemnification">
        <p>
          You agree to defend and hold Cortexa harmless from claims arising from:
        </p>
        <ul>
          <li>Your use of the platform</li>
          <li>Violations of laws or these Terms</li>
        </ul>
      </Section>

      <Section title="13. Termination">
        <ul>
          <li>Violation of Terms</li>
          <li>Prohibited activity</li>
          <li>Legal or risk reasons</li>
        </ul>
      </Section>

      <Section title="14. Changes to Terms">
        <p>
          We may update these Terms at any time. Continued use means acceptance.
        </p>
      </Section>

      <Section title="15. Governing Law">
        <p>
          These Terms are governed by applicable laws in your operating
          jurisdiction.
        </p>
      </Section>

      <Section title="16. Contact">
        <p>Email: support@cortexa.ai</p>
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
};

export default Terms;