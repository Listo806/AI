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
      <PublicHeader />

      <section className={styles.hero}>
        <div className={styles.badge}>
          <Mail size={18} />
          CONTACT CORTEXA
        </div>
        <h1 className={styles.title}>
          Get in touch with the <span>CORTEXA</span> team.
        </h1>
        <p className={styles.subtitle}>
          Send us your question and we’ll route it to the right team as quickly
          as possible.
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
                className={`${styles.selectRow} ${isOpen ? styles.selectRowActive : ""}`}
                onClick={() => setIsOpen(!isOpen)}
              >
                <MessageCircle className={styles.blue} size={19} />
                <span className={formData.reason ? styles.selectedText : ""}>
                  {formData.reason || "Select a reason"}
                </span>
                <ChevronDown
                  size={18}
                  className={`${styles.arrowIcon} ${isOpen ? styles.arrowRotate : ""}`}
                />
              </div>

              {isOpen && (
                <div className={styles.reasonMenu}>
                  {reasons.map((reason) => (
                    <div
                      key={reason}
                      className={styles.menuItem}
                      onClick={() => {
                        handleInputChange("reason", reason);
                        setIsOpen(false);
                      }}
                    >
                      {reason}
                    </div>
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
                rows={3}
              />
            </div>
          </div>

          <button type="submit" className={styles.sendButton}>
            <Send size={20} />
            Send Message
          </button>
        </form>

        <aside className={styles.sideColumn}>
          <InfoCard
            icon={<Mail size={24} />}
            title="Support Email"
            text="support@cortexacrm.com"
            color="#2563EB"
            bg="#EEF5FF"
          />
          <InfoCard
            icon={<Clock size={24} />}
            title="Response Time"
            text="Usually within 24 hours"
            color="#6D5BFF"
            bg="#F1EDFF"
          />
          <div className={styles.helpCard}>
            <div className={styles.helpCardHead}>
              <div className={styles.helpIcon}>
                <Headphones size={24} />
              </div>
              <h3>What can we help with?</h3>
            </div>
            {helpItems.map((item) => (
              <div key={item} className={styles.helpItem}>
                <CheckCircle size={18} />
                {item}
              </div>
            ))}
          </div>
        </aside>
      </section>

      <section className={styles.bottomBar}>
        <div className={styles.bottomAction}>
          <div className={styles.bottomIcon}>
            <Mail size={30} />
          </div>
          <div>
            <h3>Support Email</h3>
            <p className={styles.blue}>support@cortexacrm.com</p>
          </div>
          <ChevronRight size={24} />
        </div>
        <div className={styles.bottomAction}>
          <div
            className={styles.bottomIcon}
            style={{ background: "#f1edff", color: "#6d5bff" }}
          >
            <Clock size={30} />
          </div>
          <div>
            <h3>Response Time</h3>
            <p>Usually within 24 hours</p>
          </div>
          <ChevronRight size={24} />
        </div>
        <div className={styles.bottomAction}>
          <div
            className={styles.bottomIcon}
            style={{ background: "#EAFBF2", color: "#059669" }}
          >
            <Headphones size={30} />
          </div>
          <h3>Need instant help?</h3>
          <a href="/support" className={styles.support}>
            <p>Open 24-7 AI Support</p>
            <ChevronRight size={24} />
          </a>
        </div>
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

function InfoCard({ icon, title, text, color, bg }) {
  return (
    <div className={styles.infoCard}>
      <div className={styles.infoIcon} style={{ background: bg, color: color }}>
        {icon}
      </div>
      <div>
        <h3>{title}</h3>
        <p style={{ color: color }}>{text}</p>
      </div>
    </div>
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