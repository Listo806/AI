import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { LANG_CHOICE_KEY } from './LanguageAutoDetect';
import '../styles/language-selector.css';

const languages = [
  { code: 'en', label: 'English', native: 'EN' },
  { code: 'es', label: 'Español', native: 'ES' },
  { code: 'pt', label: 'Português', native: 'PT' },
];

export default function LanguageSelector() {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const handleLanguageChange = (langCode) => {
    i18n.changeLanguage(langCode);
    // Record it as an explicit choice so first-visit auto-detection never
    // overrides a language the visitor picked on purpose.
    try {
      localStorage.setItem(LANG_CHOICE_KEY, langCode);
    } catch (_e) {
      /* storage blocked — choice just won't persist */
    }
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="language-selector" ref={dropdownRef}>
      <button
        className="language-selector-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Select language"
      >
        <span className="language-icon">🌐</span>
        <span className="language-code">{currentLanguage.native}</span>
        <span className="language-arrow">▼</span>
      </button>
      {isOpen && (
        <div className="language-dropdown">
          {languages.map((lang) => (
            <button
              key={lang.code}
              className={`language-option ${i18n.language === lang.code ? 'active' : ''}`}
              onClick={() => handleLanguageChange(lang.code)}
            >
              <span className="language-label">{lang.label}</span>
              <span className="language-code-small">({lang.native})</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
