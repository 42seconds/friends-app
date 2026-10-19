// Adds the Firebase Android file for push notifications once it is in the
// project (see docs/push-notifications.md). Everything else is in app.json.
const fs = require('fs');

module.exports = ({ config }) => {
  if (!fs.existsSync('./google-services.json')) return config;
  return { ...config, android: { ...config.android, googleServicesFile: './google-services.json' } };
};
