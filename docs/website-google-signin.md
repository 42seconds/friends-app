# Google sign-in for the &FRIENDS website

The mobile app already has **Continue with Google**. The app and the website use the
same Firebase project (`andfriends-c5552`), so a person who signs in with Google on
either side gets the **same account (same UID)**, with the same profile and tickets.

This guide adds the same sign-in to the website.

## 1. Firebase console (once)

- **Authentication → Sign-in method → Google** is already enabled. Nothing to do here.
- **Authentication → Settings → Authorized domains**: make sure the website's domain is
  listed. `localhost`, `andfriends-c5552.firebaseapp.com` and `andfriends-c5552.web.app`
  are there by default. Add any custom domain (e.g. `andfriends.co.za`) and any
  hosting preview domain you use.

## 2. Code

This uses the modular Firebase JS SDK (v9 or later, `import { … } from 'firebase/auth'`).
`auth` and `db` are the instances the website already creates with `getAuth(app)` and
`getFirestore(app)`.

```js
// googleSignIn.js
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase'; // wherever the website sets up Firebase

// Opens Google's account picker in a popup, signs into Firebase and,
// the first time, creates the users/{uid} profile in the same shape the
// mobile app uses. Returns { user, isNew }.
export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' }); // always show the picker

  const { user } = await signInWithPopup(auth, provider);

  const ref = doc(db, 'users', user.uid);
  const existing = await getDoc(ref);
  if (existing.exists()) return { user, isNew: false };

  // Must match the app: role is always "resident" for new accounts
  // (the security rules reject anything else).
  await setDoc(ref, {
    name: user.displayName ?? '',
    email: user.email ?? '',
    phone: '',
    role: 'resident',
    interests: [],
    createdAt: new Date().toISOString(),
  });
  return { user, isNew: true };
}

// Friendly messages for the errors people actually hit.
export function googleErrorMessage(err) {
  const code = err?.code ?? '';
  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return ''; // they closed it: say nothing
  if (code === 'auth/popup-blocked') return 'Your browser blocked the sign-in window. Allow pop-ups for this site and try again.';
  if (code === 'auth/unauthorized-domain') return 'Google sign-in is not enabled for this web address yet.';
  if (code === 'auth/network-request-failed') return "You're offline. Check your connection and try again.";
  if (code === 'auth/account-exists-with-different-credential') return 'You already have an account with this email. Log in with your password instead.';
  return "Couldn't sign in with Google. Try again or use your email.";
}
```

### Using it on the login / register page

Plain JavaScript:

```js
import { signInWithGoogle, googleErrorMessage } from './googleSignIn';

document.querySelector('#google-btn').addEventListener('click', async () => {
  try {
    const { isNew } = await signInWithGoogle();
    window.location.href = isNew ? '/welcome' : '/dashboard'; // your own pages
  } catch (err) {
    const msg = googleErrorMessage(err);
    if (msg) document.querySelector('#login-error').textContent = msg;
  }
});
```

React:

```jsx
<button type="button" onClick={async () => {
  try {
    const { isNew } = await signInWithGoogle();
    navigate(isNew ? '/welcome' : '/dashboard');
  } catch (err) {
    const msg = googleErrorMessage(err);
    if (msg) setError(msg);
  }
}}>
  Continue with Google
</button>
```

Logging out needs nothing new. The website's existing `signOut(auth)` also signs out
Google users.

## 3. Admin pages

Signing in with Google never makes someone an admin. The admin dashboard should keep
checking `users/{uid}.role === 'admin'`, exactly as it does for email logins. Roles are
still changed only in the Firebase console.

## 4. How to test

1. Run the website on `localhost` and click **Continue with Google**.
2. In Firebase → **Authentication → Users**, the account shows a Google "G" icon.
3. In **Firestore → users**, there's a doc with that UID and `role: "resident"`.
4. Sign in with the **same Google account** in the mobile app (the APK from GitHub
   Actions). You should see the same profile, because both sides use the same UID.
