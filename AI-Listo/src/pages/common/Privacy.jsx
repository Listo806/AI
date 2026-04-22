import React from "react";

const Privacy = () => {
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Privacy Policy</h1>
      <p style={styles.effectiveDate}>
        Effective Date: April 22, 2026
      </p>

      <p>
        This Privacy Policy describes how <strong>Cortexa CRM</strong> ("Cortexa",
        "we", "our", "us") collects, uses, and protects your information when
        you use our platform and services ("Services").
      </p>

      <p>
        By using Cortexa CRM, you agree to this Privacy Policy.
      </p>

      <Section title="1. Information We Collect">
        <p>We may collect the following information:</p>

        <h4>A. Personal Information:</h4>
        <ul>
          <li>Name</li>
          <li>Email address</li>
          <li>Phone number</li>
          <li>Billing information</li>
        </ul>

        <h4>B. Business Data:</h4>
        <ul>
          <li>
            Leads, contacts, and customer data you input into the platform
          </li>
        </ul>

        <h4>C. Technical Data:</h4>
        <ul>
          <li>IP address</li>
          <li>Browser type</li>
          <li>Device information</li>
          <li>Usage data</li>
        </ul>
      </Section>

      <Section title="2. How We Use Your Information">
        <ul>
          <li>Provide and operate the Services</li>
          <li>Process payments and manage subscriptions</li>
          <li>Improve performance and functionality</li>
          <li>Communicate with you</li>
          <li>Provide customer support</li>
          <li>Comply with legal obligations</li>
        </ul>
      </Section>

      <Section title="3. Data Ownership">
        <p>You retain ownership of your data.</p>
        <p>Cortexa does NOT sell your personal data.</p>
        <p>We only process your data to provide our Services.</p>
      </Section>

      <Section title="4. Data Sharing">
        <p>We may share information with:</p>
        <ul>
          <li>Payment processors (e.g., PayPal)</li>
          <li>Service providers supporting our platform</li>
          <li>Legal authorities if required by law</li>
        </ul>
        <p>We do not sell or rent your data.</p>
      </Section>

      <Section title="5. Data Security">
        <p>
          We implement reasonable security measures to protect your data.
        </p>
        <p>However, no system is completely secure.</p>
      </Section>

      <Section title="6. Data Retention">
        <p>We retain data only as long as necessary to:</p>
        <ul>
          <li>Provide services</li>
          <li>Meet legal obligations</li>
          <li>Resolve disputes</li>
        </ul>
      </Section>

      <Section title="7. Cookies & Tracking">
        <p>
          We may use cookies and similar technologies to improve user experience
          and analyze usage.
        </p>
        <p>You can control cookies through your browser settings.</p>
      </Section>

      <Section title="8. Your Rights">
        <p>You may have the right to:</p>
        <ul>
          <li>Access your data</li>
          <li>Request corrections</li>
          <li>Request deletion</li>
        </ul>
        <p>Contact us to exercise these rights.</p>
      </Section>

      <Section title="9. Changes to This Policy">
        <p>
          We may update this Privacy Policy at any time. Continued use of the
          Services means you accept updates.
        </p>
      </Section>

      <Section title="10. Contact">
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

export default Privacy;