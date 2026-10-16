# Live (push) notifications

When the team approves a booking or asks for a new proof, the guest gets a
notification on their phone **even when the app is closed**.

How it works:

1. When someone logs in and allows notifications, the app gets an **Expo push
   token** for the phone and saves it on their profile (`users/{uid}.pushTokens`).
2. When staff tap **Approve** or **Reject** (Staff mode), the app sends the
   message to those tokens through Expo's push service
   (`https://exp.host/--/api/v2/push/send`). Expo delivers it through Firebase
   Cloud Messaging (Android) or Apple Push (iOS).
3. While the app is open it still shows its own alert, and the push is not
   shown twice.

Code: `src/lib/push.ts`, `src/services/ticketService.ts` (`notifyOwner`),
`src/hooks/useTicketAlerts.ts`.

## One-time setup for Android (about 10 minutes)

Push needs two files from Firebase. Without them the app still works and
still shows alerts while it is open; only "app closed" pushes need this.

### 1. `google-services.json` (goes in the project)

1. Firebase console → ⚙ **Project settings** → **General** → **Your apps**.
2. Pick the Android app **com.andfriends.app** (the one you added the SHA-1
   to for Google sign-in) → **Download google-services.json**.
3. Put the file in the **root of the project** (next to `app.json`), then commit
   and push it. This file only identifies the project, so it is fine in Git.
   `app.config.js` picks it up automatically.

### 2. FCM key for Expo (stays private, never in Git)

1. Firebase console → ⚙ **Project settings** → **Service accounts** →
   **Generate new private key**. A JSON file downloads. **Keep it private.**
2. Go to **https://expo.dev** → account **wamboxs-team** → project
   **friends-app** → **Credentials** → **Android** → **com.andfriends.app**.
3. Under **FCM V1 service account key** click **Add a service account key**
   → **Upload new key** and choose the JSON file.
4. Delete the JSON file from your computer afterwards.

### 3. Build and test

1. Push a commit; GitHub Actions builds a new APK (Actions → latest run →
   **Artifacts**). Install it.
2. Log in on the phone and allow notifications.
3. On another phone (or the website), log in as an admin and approve one of
   that user's bookings. Close the app on the first phone before approving:
   the notification should still arrive.

To test without staff mode, copy the user's token from Firestore
(`users/{uid}.pushTokens`) into **https://expo.dev/notifications** and press
**Send**.

## iOS

Apple only delivers pushes to apps signed with a paid Apple Developer account
(APNs key). The iOS simulator build in CI can't receive pushes. With an
account, run `npx eas-cli credentials` → iOS → **Push Notifications** to add
the key.

## Approving on the website

If the admin website approves bookings, it should send the same message.
After it sets `status: 'confirmed'` (or `'rejected'`), add:

```js
import { doc, getDoc } from 'firebase/firestore';

async function pushToUser(db, uid, title, body, url) {
  const snap = await getDoc(doc(db, 'users', uid));
  const tokens = (snap.data()?.pushTokens ?? []).filter((t) => t.startsWith('Expo'));
  if (!tokens.length) return;
  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(tokens.map((to) => ({
      to, title, body, sound: 'default', channelId: 'tickets', priority: 'high', data: { url },
    }))),
  });
}

// After approving:
await pushToUser(db, ticket.userId, 'Your tickets are ready 🎉',
  `Payment approved for ${ticket.eventTitle}. Tap to see your QR.`, `/ticket/${ticketId}`);
```

Browsers may block this call with CORS. If so, send it from a small server or
Firebase Cloud Function instead.
