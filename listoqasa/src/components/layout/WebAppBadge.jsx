import React from 'react';
import './WebAppBadge.css';

/** Ordinary navigation to search; PWA installation remains a browser action. */
export default function WebAppBadge({ vacation = false }) {
  return (
    <div className="lq-webapp-shortcut">
      <span className="lq-webapp-shortcut-label">Get the app</span>
      <a className="lq-webapp-badge" href={vacation ? '/vacation-rentals/app' : '/app'} aria-label={vacation ? 'Open vacation rental guest search' : 'Open ListoQasa property search'}>
        <span className="lq-webapp-house" aria-hidden="true"><span>LQ</span></span>
        <span className="lq-webapp-badge-copy"><small>Get it on</small><strong>Web App</strong></span>
      </a>
    </div>
  );
}
