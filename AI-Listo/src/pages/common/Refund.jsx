import React from "react";

const Refund = () => {
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Refund Policy</h1>
      <p style={styles.effectiveDate}>
        Effective Date: April 22, 2026
      </p>

      <p>
        This Refund Policy explains how payments for <strong>Cortexa CRM</strong> ("Cortexa", "we", "our", "us") are handled. By purchasing or subscribing to our Services, you agree to this policy.
      </p>

      <Section title="1. Free Trial & Activation Fee">
          <p>Cortexa offers a 14-day free trial to new users.</p>

          <p>To activate your account:</p>
          <ul style={styles.ul}>
            <li>A one-time activation fee of $97 may be charged at signup</li>
          </ul>

          <p>During the 14-day trial:</p>
          <ul style={styles.ul}>
            <li>You receive full access to the platform</li>
            <li>You may cancel at any time before the trial ends</li>
          </ul>

          <p>At the end of the trial:</p>
          <ul style={styles.ul}>
            <li>Your account will automatically convert to a paid subscription</li>
            <li>You will be charged the applicable plan fee (selected plan)</li>
            <li>Billing will continue on a recurring basis unless canceled</li>
          </ul>

          <p>
            By signing up, you authorize Cortexa to charge your payment method accordingly.
          </p>
        </Section>

        <Section title="2. No Refunds">
          <p>All payments are non-refundable.</p>

          <p>This includes:</p>
          <ul style={styles.ul}>
            <li>Subscription fees (monthly or annual)</li>
            <li>Activation or setup fees</li>
            <li>Charges after trial conversion</li>
          </ul>

          <p>Once a payment has been processed, it cannot be reversed.</p>
        </Section>

        <Section title="3. Subscription Billing & Cancellation">
          <ul style={styles.ul}>
            <li>Subscriptions are billed in advance on a recurring basis</li>
            <li>You may cancel your subscription at any time</li>
          </ul>

          <p>To cancel:</p>
          <ul style={styles.ul}>
            <li>Use your account settings, OR</li>
            <li>
              Contact support via:
              <ul style={styles.ul}>
                <li>AI Support (Contact page)</li>
                <li>Email: support@cortexa.ai</li>
              </ul>
            </li>
          </ul>

          <p>Cancellation:</p>
          <ul style={styles.ul}>
            <li>Prevents future charges</li>
            <li>Does NOT refund any current or past billing period</li>
          </ul>
        </Section>

        <Section title="4. Chargebacks & Payment Disputes">
          <p>If you initiate a chargeback or dispute:</p>
          <ul style={styles.ul}>
            <li>Your account may be suspended or permanently terminated</li>
            <li>Access to the platform may be revoked</li>
            <li>You agree to contact Cortexa support before filing a dispute</li>
          </ul>

          <p>
            We are committed to resolving billing issues quickly when contacted directly.
          </p>
        </Section>

        <Section title="5. Exceptions">
          <p>Refunds may only be issued:</p>
          <ul style={styles.ul}>
            <li>If required by applicable law</li>
            <li>At Cortexa’s sole discretion in exceptional circumstances</li>
          </ul>
        </Section>

        <Section title="6. Contact">
          <p>For billing, cancellation, or refund inquiries:</p>
          <p>AI Support: Available via the Contact page</p>
          <p>Email: support@cortexa.ai</p>

          <p>We aim to respond promptly and resolve all issues efficiently.</p>
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

export default Refund;