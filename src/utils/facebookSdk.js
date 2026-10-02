// Facebook JS SDK loader shared by Integrations and Ads Manager.
export const FB_APP_ID = import.meta.env.VITE_FACEBOOK_APP_ID || '1551778202757963';
export const FB_LOGIN_CONFIG_ID = import.meta.env.VITE_FACEBOOK_LOGIN_CONFIG_ID || '4416725028596340';

export const loadFbSdk = () =>
  new Promise((resolve) => {
    if (window.FB) return resolve(window.FB);
    window.fbAsyncInit = () => {
      window.FB.init({ appId: FB_APP_ID, version: 'v25.0', xfbml: false, cookie: true });
      resolve(window.FB);
    };
    const s = document.createElement('script');
    s.src = 'https://connect.facebook.net/en_US/sdk.js';
    s.async = true;
    document.head.appendChild(s);
  });
