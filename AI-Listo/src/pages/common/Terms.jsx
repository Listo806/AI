import React from "react";

const Terms = () => {
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Terms of Service</h1>
      <p style={styles.effectiveDate}>Effective Date: April 22, 2026</p>

      <p>
        These Terms of Service ("Terms") govern your access to and use of{" "}
        <strong>CORTEXA AI Revenue OS</strong> ("CORTEXA", "we", "our", or
        "us"). By accessing, using, or subscribing to the platform, you agree to
        be bound by these Terms.
      </p>

      <Section title="Eligibility">
        <p>You must:</p>
        <ul style={styles.ul}>
          <li>Be at least 18 years old.</li>
          <li>Operate a legitimate business, professional service, or organization.</li>
          <li>Have the legal authority to enter into this agreement.</li>
        </ul>
        <p>
          You may not use CORTEXA AI Revenue OS for illegal, fraudulent,
          abusive, deceptive, or prohibited activities.
        </p>
      </Section>

      <Section title="Services">
        <p>
          CORTEXA AI Revenue OS provides business automation and customer
          management tools, including but not limited to:
        </p>
        <ul style={styles.ul}>
          <li>CRM functionality</li>
          <li>Lead management</li>
          <li>Pipeline management</li>
          <li>AI-powered assistance</li>
          <li>WhatsApp automation</li>
          <li>Contact management</li>
          <li>Team collaboration tools</li>
          <li>Analytics and reporting</li>
          <li>Workflow automation</li>
          <li>Appointment booking</li>
          <li>Integrations with third-party services</li>
        </ul>
        <p>We may modify, improve, suspend, or discontinue features at any time.</p>
      </Section>

      <Section title="Account Responsibility">
        <p>You are responsible for:</p>
        <ul style={styles.ul}>
          <li>Maintaining the security of your account.</li>
          <li>All activities that occur under your account.</li>
          <li>Providing accurate and current information.</li>
          <li>Maintaining access credentials securely.</li>
        </ul>
        <p>
          We may suspend or terminate accounts involved in suspicious, abusive,
          fraudulent, or prohibited activity.
        </p>
      </Section>

      <Section title="Acceptable Use">
        <p>You agree NOT to:</p>
        <ul style={styles.ul}>
          <li>Engage in fraud or illegal activity.</li>
          <li>Send spam or unauthorized messages.</li>
          <li>Violate privacy or data protection laws.</li>
          <li>Misrepresent yourself or your business.</li>
          <li>Harass, abuse, or deceive users.</li>
          <li>Attempt to gain unauthorized access to systems.</li>
          <li>Reverse engineer, exploit, or disrupt the platform.</li>
        </ul>
        <p>Violation of these Terms may result in immediate suspension or termination.</p>
      </Section>

      <Section title="Free Trial, Setup Fee & Billing">
        <p><strong>Free Trial</strong></p>
        <p>CORTEXA AI Revenue OS offers a 14-day free trial.</p>

        <p><strong>Setup Fee</strong></p>
        <p>To activate your account:</p>
        <ul style={styles.ul}>
          <li>
            A one-time setup and activation fee of $97 USD may be charged at
            signup.
          </li>
        </ul>
        <p>
          The setup fee covers onboarding, account provisioning, platform
          configuration, and activation services.
        </p>

        <p><strong>Subscription Plans</strong></p>
        <p>CORTEXA AI Revenue OS currently offers the following plans:</p>
        <ul style={styles.ul}>
          <li>
            <strong>Solo Plan:</strong> $197 USD per month. Designed for
            individual professionals and business owners. Includes access to all
            core platform features.
          </li>
          <li>
            <strong>Team Plan:</strong> $347 USD per month. Includes up to three
            (3) users. Includes access to all core platform features.
          </li>
          <li>
            <strong>Growth Plan:</strong> $497 USD per month. Includes up to
            five (5) users. Includes access to all core platform features.
          </li>
        </ul>

        <p><strong>Feature Access</strong></p>
        <p>
          All subscription plans include access to the same core CORTEXA AI
          Revenue OS platform features.
        </p>
        <p>Plan differences are based primarily on:</p>
        <ul style={styles.ul}>
          <li>Included users</li>
          <li>Team size</li>
          <li>Supported business scale</li>
          <li>Platform capacity and usage requirements</li>
        </ul>
        <p>
          CORTEXA AI Revenue OS does not restrict core functionality based solely
          on plan tier.
        </p>
        <p>
          Customers selecting higher-tier plans receive increased capacity and
          support for larger teams and growing businesses rather than access to
          a separate feature set.
        </p>

        <p><strong>Additional Users</strong></p>
        <p>Customers may add additional users to any plan for:</p>
        <ul style={styles.ul}>
          <li>$97 USD per user per month</li>
        </ul>

        <p><strong>Pricing Changes</strong></p>
        <p>
          Pricing may be updated from time to time. Existing customers will
          receive notice of material pricing changes where required by law.
        </p>

        <p><strong>Billing</strong></p>
        <p>After the trial period:</p>
        <ul style={styles.ul}>
          <li>
            Your subscription automatically converts to a paid plan unless
            canceled before the renewal date.
          </li>
          <li>Billing is recurring and continues until canceled.</li>
          <li>Charges are processed through authorized third-party payment providers.</li>
          <li>
            Additional users added during an active subscription may result in
            prorated charges where applicable.
          </li>
        </ul>
        <p>
          By subscribing, you authorize CORTEXA AI Revenue OS to charge your
          selected payment method according to your selected plan and any
          additional services you purchase.
        </p>
      </Section>

      <Section title="AI Fair Usage Policy">
        <p>
          CORTEXA AI Revenue OS includes AI-powered functionality as part of your
          subscription.
        </p>
        <p>Normal business usage is included.</p>
        <p>To ensure platform reliability for all customers:</p>
        <ul style={styles.ul}>
          <li>AI usage may be subject to reasonable fair-use limits.</li>
          <li>
            Accounts generating unusually high AI workloads, excessive
            automation activity, or enterprise-scale processing may require a
            higher-tier plan or additional AI capacity package.
          </li>
          <li>
            CORTEXA AI Revenue OS reserves the right to notify customers before
            implementing any usage-related upgrade requirements.
          </li>
        </ul>
        <p>
          CORTEXA AI Revenue OS does not utilize customer-facing AI credit
          systems as part of standard subscriptions.
        </p>
      </Section>

      <Section title="Contact Database Usage">
        <p>
          CORTEXA AI Revenue OS does not charge customers solely based on the
          number of contacts stored within the platform.
        </p>
        <p>
          Customers may manage contacts within the limits of their subscription
          plan without per-contact billing fees.
        </p>
        <p>
          Reasonable storage, database, and platform limits may apply to ensure
          platform performance and reliability.
        </p>
      </Section>

      <Section title="Third-Party Services">
        <p>
          CORTEXA AI Revenue OS may integrate with third-party providers,
          including but not limited to:
        </p>
        <ul style={styles.ul}>
          <li>WhatsApp</li>
          <li>Google</li>
          <li>Microsoft</li>
          <li>Email providers</li>
          <li>CRM and automation platforms</li>
          <li>Payment processors</li>
        </ul>
        <p>We are not responsible for:</p>
        <ul style={styles.ul}>
          <li>Third-party outages</li>
          <li>Third-party pricing</li>
          <li>Third-party policies</li>
          <li>Third-party performance</li>
          <li>Third-party data handling practices</li>
        </ul>
        <p>Your use of third-party services remains subject to their respective terms and policies.</p>
      </Section>

      <Section title="Cancellation & Refund Policy">
        <p>You may cancel your subscription at any time.</p>
        <p>
          Cancellation prevents future billing but does not retroactively refund
          charges already processed.
        </p>

        <p><strong>Non-Refundable Fees</strong></p>
        <p>The following are generally non-refundable:</p>
        <ul style={styles.ul}>
          <li>Setup and activation fees</li>
          <li>Subscription fees already billed</li>
          <li>Completed onboarding services</li>
          <li>Professional services already delivered</li>
        </ul>
        <p>Refunds may be provided where required by applicable law.</p>
      </Section>

      <Section title="User Data & Responsibility">
        <p>You retain ownership of your data.</p>
        <p>
          CORTEXA AI Revenue OS processes customer data solely to provide
          platform functionality and services.
        </p>
        <p>You are responsible for ensuring that your data:</p>
        <ul style={styles.ul}>
          <li>Is lawfully obtained.</li>
          <li>Is lawfully processed.</li>
          <li>Complies with applicable regulations.</li>
          <li>Does not infringe the rights of others.</li>
        </ul>
        <p>We do not sell customer data.</p>
      </Section>

      <Section title="Intellectual Property">
        <p>
          All software, content, branding, platform designs, functionality,
          workflows, and technology associated with CORTEXA AI Revenue OS remain
          the exclusive property of CORTEXA AI Revenue OS.
        </p>
        <p>You may not:</p>
        <ul style={styles.ul}>
          <li>Copy</li>
          <li>Reproduce</li>
          <li>Distribute</li>
          <li>Modify</li>
          <li>Resell</li>
          <li>Reverse engineer</li>
          <li>Create derivative works</li>
        </ul>
        <p>without prior written authorization.</p>
      </Section>

      <Section title="Service Availability">
        <p>
          While we strive for reliable service, we do not guarantee
          uninterrupted or error-free availability.
        </p>
        <p>Service availability may be affected by:</p>
        <ul style={styles.ul}>
          <li>Maintenance</li>
          <li>Updates</li>
          <li>Infrastructure issues</li>
          <li>Third-party outages</li>
          <li>Security events</li>
          <li>Events beyond our reasonable control</li>
        </ul>
      </Section>

      <Section title="Limitation of Liability">
        <p>
          To the maximum extent permitted by law, CORTEXA AI Revenue OS shall
          not be liable for:
        </p>
        <ul style={styles.ul}>
          <li>Lost profits</li>
          <li>Lost revenue</li>
          <li>Lost business opportunities</li>
          <li>Loss of data</li>
          <li>Business interruption</li>
          <li>Indirect damages</li>
          <li>Consequential damages</li>
          <li>Special or incidental damages</li>
        </ul>
        <p>
          Our total liability shall not exceed the amount paid by you to CORTEXA
          AI Revenue OS during the preceding twelve (12) months.
        </p>
      </Section>

      <Section title="Indemnification">
        <p>
          You agree to defend, indemnify, and hold harmless CORTEXA AI Revenue
          OS, its owners, employees, contractors, and affiliates from claims,
          liabilities, damages, losses, and expenses arising from:
        </p>
        <ul style={styles.ul}>
          <li>Your use of the platform</li>
          <li>Your content or data</li>
          <li>Violations of these Terms</li>
          <li>Violations of applicable laws</li>
        </ul>
      </Section>

      <Section title="Termination">
        <p>We may suspend or terminate accounts for:</p>
        <ul style={styles.ul}>
          <li>Violation of these Terms</li>
          <li>Fraudulent activity</li>
          <li>Abuse of the platform</li>
          <li>Security concerns</li>
          <li>Legal or regulatory requirements</li>
          <li>Non-payment</li>
        </ul>
        <p>Termination may occur with or without notice where legally permitted.</p>
      </Section>

      <Section title="Changes to Terms">
        <p>
          We may update these Terms periodically. Continued use of the platform
          after updates become effective constitutes acceptance of the revised
          Terms.
        </p>
      </Section>

      <Section title="Governing Law">
        <p>
          These Terms shall be governed by and interpreted in accordance with the
          laws applicable to the jurisdiction in which CORTEXA AI Revenue OS
          operates, without regard to conflict of law principles.
        </p>
      </Section>

      <Section title="Contact Information">
        <p><strong>Support Email:</strong> support@cortexaaios.com</p>
        <p><strong>Platform:</strong> CORTEXA AI Revenue OS</p>
        <p><strong>Legal Business Name:</strong> Listo Qasa S.A.</p>
        <p><strong>Trade Name / Brand:</strong> CORTEXA Agentic AI Revenue OS</p>
        <p><strong>RUC:</strong> 1793234655001</p>
        <p><strong>Country of Registration:</strong> Ecuador</p>
        <p>
          For questions regarding these Terms, billing, platform usage, or legal
          matters, please contact our support team at support@cortexaaios.com.
        </p>
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
