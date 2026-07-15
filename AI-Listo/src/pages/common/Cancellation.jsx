import React from "react";

const Cancellation = () => {
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Cancellation Policy</h1>
      <p style={styles.effectiveDate}>
        Effective Date: April 22, 2026
      </p>

      <p>
        This Cancellation Policy explains how you may cancel your subscription to <strong>CORTEXA AI Revenue OS</strong> ("Cortexa", "we", "our", "us"). By using our Services, you agree to this policy.
      </p>

      <Section title="1. Subscription Cancellation">
          <p>You may cancel your Cortexa subscription at any time.</p>

          <p>To cancel your subscription:</p>
          <ul style={styles.ul}>
            <li>Through your account settings within the platform, OR</li>
            <li>
              By contacting support via:
              <ul style={styles.ul}>
                <li>AI Support (Contact page)</li>
                <li>Email: support@cortexaaicrm.com</li>
              </ul>
            </li>
          </ul>
        </Section>

        <Section title="2. Cancellation Timing">
          <ul style={styles.ul}>
            <li>Cancellation must be completed before your next billing date to avoid being charged for the next billing cycle</li>
            <li>If you cancel after a billing charge has been processed, that charge will not be refunded</li>
          </ul>
        </Section>

        <Section title="3. Effect of Cancellation">
          <p>When your subscription is canceled:</p>
          <ul style={styles.ul}>
            <li>You will retain access to Cortexa until the end of your current billing period</li>
            <li>
              After the billing period ends:
              <ul style={styles.ul}>
                <li>Your access to paid features will be revoked</li>
                <li>Your account may be downgraded, limited, or deactivated</li>
              </ul>
            </li>
          </ul>
        </Section>

        <Section title="4. No Retroactive Cancellation">
          <p>Cancellation does not:</p>
          <ul style={styles.ul}>
            <li>Reverse or refund prior charges</li>
            <li>Apply to previous billing cycles</li>
            <li>Provide partial refunds for unused time</li>
          </ul>

          <p>All payments remain subject to the Refund Policy.</p>
        </Section>

        <Section title="5. Free Trial Cancellation">
          <ul style={styles.ul}>
            <li>You may cancel your account at any time during the 14-day free trial</li>
            <li>To avoid being charged, cancellation must occur before the trial period ends</li>
            <li>Failure to cancel before the trial ends will result in automatic conversion to a paid subscription</li>
          </ul>
        </Section>

        <Section title="6. Account Deletion vs Cancellation">
          <ul style={styles.ul}>
            <li>Cancelling your subscription stops future billing only</li>
            <li>It does not automatically delete your account or data</li>
          </ul>

          <p>To request full account deletion:</p>
          <ul style={styles.ul}>
            <li>Contact support at support@cortexaaicrm.com</li>
          </ul>
        </Section>

        <Section title="7. Payment Disputes">
          <p>If you have a billing issue:</p>
          <ul style={styles.ul}>
            <li>You agree to contact Cortexa support before initiating a dispute or chargeback</li>
            <li>
              Unauthorized or unjustified disputes may result in:
              <ul style={styles.ul}>
                <li>Account suspension</li>
                <li>Permanent account termination</li>
              </ul>
            </li>
          </ul>
        </Section>

        <Section title="8. Changes to This Policy">
          <p>We may update this Cancellation Policy at any time.</p>
          <p>Continued use of Cortexa after updates constitutes acceptance of the revised policy.</p>
        </Section>

        <Section title="9. Contact">
          <p>For cancellation or billing inquiries:</p>
          <p>AI Support: Available via the Contact page</p>
          <p>Email: support@cortexaaicrm.com</p>
          <p>Company: CORTEXA AI Revenue OS</p>
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

export default Cancellation;