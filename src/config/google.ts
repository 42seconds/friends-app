// Google sign-in (Firebase Authentication → Sign-in method → Google).
// These client IDs are public identifiers, not secrets.

// "Web client ID" from the Google provider's Web SDK configuration.
// Firebase checks the ID token against this one, on Android and iOS.
export const GOOGLE_WEB_CLIENT_ID = '518106146797-3rmm8hmqk4q9sh7lvetiqrjk0mgt8da7.apps.googleusercontent.com';

// CLIENT_ID from the iOS app's GoogleService-Info.plist (Android doesn't
// need it). Its reversed form is the iosUrlScheme in app.json.
export const GOOGLE_IOS_CLIENT_ID = '518106146797-lp6hri33gln28kvoehba4h4n2th60jna.apps.googleusercontent.com';
