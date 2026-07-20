import React from "react";

const Refund = () => {
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Refund Policy</h1>
      <p style={styles.effectiveDate}>
        Effective Date: July 20, 2026
      </p>

      <p>
        This Refund Policy explains how payments for <strong>CORTEXA AI Revenue OS</strong> ("Cortexa", "we", "our", "us") are handled. By using our Services, you agree to this policy.
      </p>

      <Section title="1. Free Trial — No Payment Collected">
          <p>Cortexa offers a free trial to new users.</p>
          <ul style={styles.ul}>
            <li>No payment is collected when you start your free trial.</li>
            <li>No credit card or payment method is required to sign up.</li>
            <li>Your free trial does not automatically convert to a paid subscription.</li>
            <li>No charge is ever made automatically.</li>
          </ul>
          <p>
            Because no payment is taken during the free trial, there is nothing to refund for the trial itself.
          </p>
        </Section>

        <Section title="2. Future Paid Subscriptions">
          <p>
            If you later choose to subscribe to a paid plan, you will be asked to add a payment method and actively confirm the purchase at that time. Nothing is charged until you do so.
          </p>
          <p>Current plan pricing (applies only if and when you choose to subscribe):</p>
          <ul style={styles.ul}>
            <li>Solo Plan: $197 USD per month</li>
            <li>Team Plan: $347 USD per month</li>
            <li>Growth Plan: $497 USD per month</li>
            <li>A one-time setup fee of $97 USD may apply when you activate a paid subscription.</li>
          </ul>
          <p>
            You will always be shown the amount and asked to confirm before any payment is processed. We do not charge a payment method without your explicit authorization.
          </p>
        </Section>

        <Section title="3. Refunds on Paid Subscriptions">
          <p>If you have an active paid subscription:</p>
          <ul style={styles.ul}>
            <li>You may cancel at any time to prevent future charges.</li>
            <li>
              Fees for a billing period that has already been paid are generally non-refundable, except where required by applicable law.
            </li>
          </ul>
          <p>
            We are committed to resolving any billing issue quickly — please contact support first.
          </p>
        </Section>

        <Section title="4. Chargebacks & Payment Disputes">
          <p>
            If you have a billing concern, please contact Cortexa support before initiating a chargeback or dispute so we can resolve it directly. Unresolved or unjustified disputes may result in suspension or termination of the account.
          </p>
        </Section>

        <Section title="5. Contact">
          <p>For billing, cancellation, or refund inquiries:</p>
          <p>AI Support: Available via the Contact page</p>
          <p>Email: support@cortexaaicrm.com</p>

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
