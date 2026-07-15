import React from "react";

const Privacy = () => {
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Privacy Policy</h1>
      <p style={styles.effectiveDate}>
        Effective Date: April 22, 2026
      </p>

      <p>
        This Privacy Policy explains how <strong>CORTEXA AI Revenue OS</strong> ("Cortexa", "we", "our", "us") collects, uses, and protects your information when you use our platform and services ("Services").
      </p>

      <p>
        By using CORTEXA AI Revenue OS, you agree to this Privacy Policy.
      </p>

      <Section title="1. Information We Collect">
          <p>We may collect the following categories of information:</p>

          <h4>A. Personal Information</h4>
          <ul style={styles.ul}>
            <li>Name</li>
            <li>Email address</li>
            <li>Phone number (if provided)</li>
            <li>Billing and payment details (processed via third-party providers)</li>
          </ul>

          <h4>B. Business & CRM Data</h4>
          <ul style={styles.ul}>
            <li>Leads, contacts, and customer data you input into the platform</li>
            <li>Messages, notes, and activity within your CRM workspace</li>
          </ul>

          <h4>C. Technical & Usage Data</h4>
          <ul style={styles.ul}>
            <li>IP address</li>
            <li>Browser type and device information</li>
            <li>Pages visited, actions taken, and usage behavior</li>
            <li>Log data and performance metrics</li>
          </ul>
        </Section>

        <Section title="2. How We Use Your Information">
          <p>We use your information to:</p>
          <ul style={styles.ul}>
            <li>Provide, operate, and maintain the Services</li>
            <li>Process payments and manage subscriptions</li>
            <li>Automate workflows and CRM functionality</li>
            <li>Improve performance, features, and user experience</li>
            <li>Communicate with you (support, updates, notifications)</li>
            <li>Respond to support requests (including AI-assisted support)</li>
            <li>Monitor for fraud, abuse, or security risks</li>
            <li>Comply with legal obligations</li>
          </ul>
        </Section>

        <Section title="3. Data Ownership & Control">
          <ul style={styles.ul}>
            <li>You retain ownership of all data you input into Cortexa</li>
            <li>Cortexa does NOT sell your personal or business data</li>
            <li>We process your data only to provide and improve our Services</li>
          </ul>

          <p>You are responsible for ensuring that your data:</p>
          <ul style={styles.ul}>
            <li>Is lawfully collected</li>
            <li>Complies with applicable data protection laws</li>
          </ul>
        </Section>

        <Section title="4. Data Sharing">
          <p>We may share information only as necessary with:</p>
          <ul style={styles.ul}>
            <li>Payment processors (e.g., PayPal)</li>
            <li>Cloud hosting and infrastructure providers</li>
            <li>Service providers that support platform functionality</li>
            <li>Legal authorities when required by law or to protect rights</li>
          </ul>
          <p>We do NOT sell, rent, or trade your data.</p>
        </Section>

        <Section title="5. Third-Party Integrations">
          <p>
            Cortexa may integrate with third-party tools (e.g., messaging platforms, email services, automation tools).
          </p>
          <p>When you connect third-party services:</p>
          <ul style={styles.ul}>
            <li>You authorize us to exchange data with those services</li>
            <li>Their privacy policies will also apply</li>
          </ul>
          <p>Cortexa is not responsible for third-party data practices.</p>
        </Section>

        <Section title="6. Data Security">
          <p>
            We implement reasonable administrative, technical, and security measures to protect your data.
          </p>
          <p>However:</p>
          <ul style={styles.ul}>
            <li>No system is 100% secure</li>
            <li>You use the platform at your own risk</li>
          </ul>
          <p>You are responsible for maintaining the security of your account credentials.</p>
        </Section>

        <Section title="7. Data Retention">
          <p>We retain data only as long as necessary to:</p>
          <ul style={styles.ul}>
            <li>Provide our Services</li>
            <li>Maintain your account</li>
            <li>Comply with legal obligations</li>
            <li>Resolve disputes and enforce agreements</li>
          </ul>
          <p>We may delete or anonymize data when no longer required.</p>
        </Section>

        <Section title="8. Cookies & Tracking Technologies">
          <p>We use cookies and similar technologies to:</p>
          <ul style={styles.ul}>
            <li>Improve functionality and performance</li>
            <li>Analyze usage and behavior</li>
            <li>Support marketing and advertising (e.g., Google Ads tracking)</li>
          </ul>
          <p>You can manage cookie preferences through your browser settings.</p>
        </Section>

        <Section title="9. Your Rights">
          <p>Depending on your location, you may have rights to:</p>
          <ul style={styles.ul}>
            <li>Access your personal data</li>
            <li>Correct inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Restrict or object to certain processing</li>
            <li>Request data portability</li>
          </ul>
          <p>To exercise your rights, contact us at the email below.</p>
        </Section>

        <Section title="10. International Users">
          <p>
            If you access Cortexa from outside your country of residence, your data may be transferred and processed in other jurisdictions.
          </p>
          <p>By using our Services, you consent to this transfer.</p>
        </Section>

        <Section title="11. Changes to This Policy">
          <p>
            We may update this Privacy Policy at any time.
          </p>
          <p>
            Continued use of the Services after changes means you accept the updated Policy.
          </p>
        </Section>

        <Section title="12. Contact">
          <p>Support Email: support@cortexaaicrm.com</p>
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

export default Privacy;