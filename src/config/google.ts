// Google sign-in (Firebase Authentication → Sign-in method → Google).
// These client IDs are public identifiers, not secrets.

// "Web client ID" from the Google provider's Web SDK configuration.
// Firebase checks the ID token against this one, on Android and iOS.
export const GOOGLE_WEB_CLIENT_ID = '518106146797-3rmm8hmqk4q9sh7lvetiqrjk0mgt8da7.apps.googleusercontent.com';

// CLIENT_ID from the iOS app's GoogleService-Info.plist. Empty until the
// iOS app is registered in Firebase; Android doesn't need it.
export const GOOGLE_IOS_CLIENT_ID = '';
