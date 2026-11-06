// Adds the Firebase Android file for push notifications once it is in the
// project (see docs/push-notifications.md). Everything else is in app.json.
//
// WEB_BASE_URL (e.g. /friends-app) builds the web app to live in a
// sub-folder, as on GitHub Pages (see docs/iphone-web-app.md).
const fs = require('fs');

module.exports = ({ config }) => {
  let out = config;
  if (fs.existsSync('./google-services.json')) {
    out = { ...out, android: { ...out.android, googleServicesFile: './google-services.json' } };
  }
  if (process.env.WEB_BASE_URL) {
    out = { ...out, experiments: { ...out.experiments, baseUrl: process.env.WEB_BASE_URL } };
  }
  return out;
};
