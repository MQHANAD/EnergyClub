import { logEvent, setUserId, setUserProperties } from 'firebase/analytics';
import { analytics } from './firebase';

// Track page views
export const logPageView = (pageName: string, pageTitle?: string) => {
  if (analytics) {
    logEvent(analytics, 'page_view', {
      page_title: pageTitle || pageName,
      page_location: window.location.href,
      page_path: window.location.pathname,
    });
  }
};

// Track event registration
export const logEventRegistration = (eventId: string, eventTitle: string) => {
  if (analytics) {
    logEvent(analytics, 'event_registration', {
      event_id: eventId,
      event_title: eventTitle,
    });
  }
};

// Track button clicks
export const logButtonClick = (buttonName: string, location: string) => {
  if (analytics) {
    logEvent(analytics, 'button_click', {
      button_name: buttonName,
      location: location,
    });
  }
};

// Track user login
export const logUserLogin = (method: string) => {
  if (analytics) {
    logEvent(analytics, 'login', {
      method: method,
    });
  }
};

// Track user signup
export const logUserSignup = (method: string) => {
  if (analytics) {
    logEvent(analytics, 'sign_up', {
      method: method,
    });
  }
};

// Set user ID for analytics
export const setAnalyticsUserId = (userId: string) => {
  if (analytics) {
    setUserId(analytics, userId);
  }
};

// Set user properties
export const setAnalyticsUserProperties = (properties: Record<string, string>) => {
  if (analytics) {
    setUserProperties(analytics, properties);
  }
};

// Track event view
export const logEventView = (eventId: string, eventTitle: string) => {
  if (analytics) {
    logEvent(analytics, 'view_item', {
      item_id: eventId,
      item_name: eventTitle,
      item_category: 'event',
    });
  }
};

// Track team page view
export const logTeamView = () => {
  if (analytics) {
    logEvent(analytics, 'view_team');
  }
};

// Track committee view
export const logCommitteeView = (committeeId: string, committeeName: string) => {
  if (analytics) {
    logEvent(analytics, 'view_committee', {
      committee_id: committeeId,
      committee_name: committeeName,
    });
  }
};

