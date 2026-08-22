import { useState } from "react";
import {
  User,
  Briefcase,
  Clock,
  CheckCircle,
  Mail,
  MessageCircle,
  ChevronDown,
  Paperclip,
  Send,
  Headphones,
  Globe,
  ChevronRight,
  ShieldCheck,
  Bot,
  Zap,
  Users
} from "lucide-react";
import headlogoImg from "../../assets/cortexa/headlogo.png";
import styles from "./Contact.module.css";

export default function Contact() {
  const helpItems = [
    "Account support",
    "Billing questions",
    "Technical issues",
    "Sales & partnerships",
    "General inquiries",
  ];

  const [isOpen, setIsOpen] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    company: "",
    reason: "",
    message: "",
  });

  const reasons = [
    "Account Support",
    "Billing Question",
    "Sales & Partnerships",
    "Technical Issue",
    "General Inquiry",
  ];

  const handleInputChange = (key, value) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Dữ liệu gửi đi:", formData);
  };

  return (
    <main className={styles.page}>
      <section className={styles.contactShell}>
        <div className={styles.topSupportBar}>
          <div className={styles.topSupportSpacer} />

          <div className={styles.topSupportActions}>
            <div className={styles.supportAvailability}>
              <Headphones size={19} />
              <span>24/7 Support</span>
            </div>

            <a href="/support" className={styles.aiSupportTopLink}>
              <Bot size={18} />
              <span>AI Support Assistant</span>
              <ChevronRight size={18} />
            </a>
          </div>
        </div>

        <section className={styles.hero}>
          <h1 className={styles.title}>
            We’re here to <span>help</span>
          </h1>
          <p className={styles.subtitle}>
            Our team is available <strong>24/7</strong> to support your success.
          </p>
        </section>

        <section className={styles.contactGrid}>
          <form className={styles.formBox} onSubmit={handleSubmit}>
            <div className={styles.formGrid2Cols}>
              <Field
                label="Full Name"
                icon={<User size={19} />}
                placeholder="Enter your full name"
                type="text"
                value={formData.fullName}
                onChange={(val) => handleInputChange("fullName", val)}
              />

              <Field
                label="Email"
                icon={<Mail size={19} />}
                placeholder="Enter your email address"
                type="email"
                value={formData.email}
                onChange={(val) => handleInputChange("email", val)}
              />

              <Field
                label="Company (Optional)"
                icon={<Briefcase size={19} />}
                placeholder="Enter your company name"
                type="text"
                value={formData.company}
                onChange={(val) => handleInputChange("company", val)}
              />

              <div className={styles.fieldGroup}>
                <label>Reason for Contact</label>

                <div
                  className={`${styles.selectRow} ${
                    isOpen ? styles.selectRowActive : ""
                  }`}
                  onClick={() => setIsOpen(!isOpen)}
                >
                  <MessageCircle className={styles.blue} size={19} />
                  <span className={formData.reason ? styles.selectedText : ""}>
                    {formData.reason || "Select a reason"}
                  </span>
                  <ChevronDown
                    size={18}
                    className={`${styles.arrowIcon} ${
                      isOpen ? styles.arrowRotate : ""
                    }`}
                  />
                </div>

                {isOpen && (
                  <div className={styles.reasonMenu}>
                    {reasons.map((reason) => (
                      <button
                        type="button"
                        key={reason}
                        className={styles.menuItem}
                        onClick={() => {
                          handleInputChange("reason", reason);
                          setIsOpen(false);
                        }}
                      >
                        {reason}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label>Message</label>

              <div className={styles.messageBox}>
                <Paperclip size={19} className={styles.messageIcon} />

                <textarea
                  className={styles.textareaInput}
                  placeholder="Tell us how we can help you..."
                  value={formData.message}
                  onChange={(e) => handleInputChange("message", e.target.value)}
                  rows={5}
                  maxLength={1000}
                />

                <span className={styles.messageCounter}>
                  {formData.message.length} / 1000
                </span>
              </div>
            </div>

            <div className={styles.formFooter}>
              <div className={styles.secureNote}>
                <LockIcon />
                <span>Your information is secure and confidential.</span>
              </div>

              <button type="submit" className={styles.sendButton}>
                <Send size={20} />
                Send Message
              </button>
            </div>
          </form>

          <aside className={styles.sideColumn}>
            <div className={styles.supportInfoCard}>
              <div className={styles.supportInfoItem}>
                <div className={`${styles.infoIcon} ${styles.infoIconBlue}`}>
                  <Mail size={27} />
                </div>

                <div>
                  <h3>Support Email</h3>
                  <a href="mailto:support@cortexaaicrm.com">
                    support@cortexaaicrm.com
                  </a>
                </div>
              </div>

              <div className={styles.supportInfoDivider} />

              <div className={styles.supportInfoItem}>
                <div className={`${styles.infoIcon} ${styles.infoIconGreen}`}>
                  <Clock size={27} />
                </div>

                <div>
                  <h3>Response Time</h3>
                  <p className={styles.greenText}>Usually within 24 hours</p>
                </div>
              </div>

              <div className={styles.supportInfoDivider} />

              <div className={styles.supportHelpBlock}>
                <div className={styles.supportInfoItem}>
                  <div className={`${styles.infoIcon} ${styles.infoIconPurple}`}>
                    <Headphones size={27} />
                  </div>

                  <div>
                    <h3>What can we help with?</h3>

                    <div className={styles.helpList}>
                      {helpItems.map((item) => (
                        <div key={item} className={styles.helpItem}>
                          <CheckCircle size={18} />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </section>

        <section className={styles.bottomBar}>
          <TrustItem
            icon={<ShieldCheck size={30} />}
            tone="blue"
            title="Secure & Private"
            text={
              <>
                Your data is protected with{" "}
                <strong>enterprise-grade security.</strong>
              </>
            }
          />

          <TrustItem
            icon={<Zap size={30} />}
            tone="green"
            title="Fast Response"
            text={
              <>
                We typically respond <strong>within 24 hours.</strong>
              </>
            }
          />

          <TrustItem
            icon={<Users size={30} />}
            tone="purple"
            title="Real People, Real Support"
            text={
              <>
                Talk to our team.
                <br />
                No bots, just real humans.
              </>
            }
          />

          <a href="/support" className={styles.instantHelpCard}>
            <div className={`${styles.trustIcon} ${styles.trustIconBlue}`}>
              <Bot size={30} />
            </div>

            <div className={styles.instantHelpCopy}>
              <h3>Need instant help?</h3>
              <p>
                Chat with our AI Support
                <br />
                available 24/7.
              </p>
            </div>

            <ChevronRight size={22} />
          </a>
        </section>
      </section>
    </main>
  );
}

function Field({ label, icon, placeholder, type = "text", value, onChange }) {
  return (
    <div className={styles.fieldGroup}>
      <label>{label}</label>
      <div className={styles.inputRow}>
        {icon}
        <input
          type={type}
          className={styles.realInput}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  );
}


function TrustItem({ icon, tone, title, text }) {
  return (
    <div className={styles.trustItem}>
      <div
        className={`${styles.trustIcon} ${
          tone === "green"
            ? styles.trustIconGreen
            : tone === "purple"
              ? styles.trustIconPurple
              : styles.trustIconBlue
        }`}
      >
        {icon}
      </div>

      <div>
        <h3>{title}</h3>
        <p>{text}</p>
      </div>
    </div>
  );
}

function LockIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M7 10V8a5 5 0 0 1 10 0v2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <rect
        x="5"
        y="10"
        width="14"
        height="10"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function PublicHeader() {
  return (
    <header className={styles.header}>
      <a href="/" className={styles.logoWrap}>
        <img src={headlogoImg} className="cx-logo-img" alt="logo" />
      </a>
      <div className={styles.headerRight}>
        <Globe size={22} />
        <span>EN</span>
        <ChevronDown size={16} />
        <div className={styles.avatar}>A</div>
      </div>
    </header>
  );
}