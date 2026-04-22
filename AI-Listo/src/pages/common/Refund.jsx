import React from "react";

const Refund = () => {
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Refund Policy</h1>
      <p style={styles.effectiveDate}>
        Effective Date: April 22, 2026
      </p>

      <p>
        This Refund Policy outlines the terms under which payments made to{" "}
        <strong>Cortexa CRM</strong> ("Cortexa", "we", "our", "us") are handled.
      </p>

      <p>
        By purchasing or subscribing to our services, you agree to this Refund Policy.
      </p>

      <Section title="1. No Refunds">
        <p>All payments made to Cortexa CRM are non-refundable.</p>
        <p>This includes:</p>
        <ul>
          <li>Subscription fees (monthly or annual)</li>
          <li>Setup or activation fees (if applicable)</li>
        </ul>
        <p>Once a payment has been processed, it cannot be reversed.</p>
      </Section>

      <Section title="2. Free Trials (If Offered)">
        <ul>
          <li>You will not be charged during the trial period</li>
          <li>
            You must cancel your subscription before the trial ends to avoid billing
          </li>
        </ul>
        <p>
          Failure to cancel before the trial ends will result in automatic charges.
        </p>
      </Section>

      <Section title="3. Subscription Billing">
        <ul>
          <li>All subscriptions are billed in advance</li>
          <li>Payments are automatically renewed unless canceled</li>
          <li>
            You may cancel at any time, but no refunds will be issued for unused time
          </li>
        </ul>
      </Section>

      <Section title="4. Chargebacks & Disputes">
        <p>If you initiate a chargeback or payment dispute:</p>
        <ul>
          <li>Your account may be immediately suspended or terminated</li>
          <li>
            You agree to contact us first to resolve any billing issues
          </li>
        </ul>
      </Section>

      <Section title="5. Exceptions">
        <p>Refunds may only be issued:</p>
        <ul>
          <li>If required by applicable law</li>
          <li>At our sole discretion in exceptional circumstances</li>
        </ul>
      </Section>

      <Section title="6. Contact">
        <p>For billing or refund inquiries, contact:</p>
        <p>Email: support@cortexa.ai</p>
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

export default Refund;