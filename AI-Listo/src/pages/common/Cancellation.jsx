import React from "react";

const Cancellation = () => {
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Cancellation Policy</h1>
      <p style={styles.effectiveDate}>
        Effective Date: July 20, 2026
      </p>

      <p>
        This Cancellation Policy explains how you may cancel your account or subscription to <strong>CORTEXA AI Revenue OS</strong> ("Cortexa", "we", "our", "us"). By using our Services, you agree to this policy.
      </p>

      <Section title="1. Free Trial — No Charge, No Auto-Conversion">
          <ul style={styles.ul}>
            <li>Your free trial collects no payment and requires no card on file.</li>
            <li>The free trial does not automatically convert to a paid subscription, and you are never charged automatically.</li>
            <li>You can stop using your trial account at any time with nothing owed.</li>
          </ul>
        </Section>

        <Section title="2. Cancelling a Paid Subscription">
          <p>If you have chosen to start a paid subscription, you may cancel it at any time:</p>
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

        <Section title="3. Timing & Effect of Cancellation">
          <ul style={styles.ul}>
            <li>Cancel before your next billing date to avoid the next billing cycle.</li>
            <li>You retain access to paid features until the end of the current paid billing period.</li>
            <li>After that period ends, paid features may be limited, downgraded, or deactivated.</li>
            <li>Cancellation stops future charges but does not refund a billing period that has already been paid (see the Refund Policy).</li>
          </ul>
        </Section>

        <Section title="4. Account Deletion vs Cancellation">
          <ul style={styles.ul}>
            <li>Cancelling a subscription stops future billing only.</li>
            <li>It does not automatically delete your account or data.</li>
          </ul>
          <p>To request full account deletion, contact support at support@cortexaaicrm.com.</p>
        </Section>

        <Section title="5. Payment Disputes">
          <p>If you have a billing issue:</p>
          <ul style={styles.ul}>
            <li>Please contact Cortexa support before initiating a dispute or chargeback.</li>
            <li>
              Unresolved or unjustified disputes may result in:
              <ul style={styles.ul}>
                <li>Account suspension</li>
                <li>Permanent account termination</li>
              </ul>
            </li>
          </ul>
        </Section>

        <Section title="6. Changes to This Policy">
          <p>We may update this Cancellation Policy at any time.</p>
          <p>Continued use of Cortexa after updates constitutes acceptance of the revised policy.</p>
        </Section>

        <Section title="7. Contact">
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
