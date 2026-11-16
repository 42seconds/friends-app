# Email codes: confirm email, forgot password, admin 2-step

&friends emails 6-digit one-time codes (OTP) for:

| When | What happens |
|---|---|
| **Sign up** | "Confirm your email" emails a code. Entering it confirms the email, which is needed before booking. |
| **Forgot password** (and Settings → Privacy → Change password) | A code is emailed; the code plus a new password changes it. Every other device is logged out. |
| **Admin login (2-step verification)** | After an admin's password, a code is emailed. It unlocks the app and staff mode on that device for 12 hours. Logging out, or 12 hours passing, asks again. |

Codes work for 10 minutes. Five wrong tries cancel a code. A new code can
be sent once a minute, at most five an hour. Forgot password answers the
same whether or not an account exists, so it can't be used to find out
who is signed up.

## How it works

The codes are made, emailed and checked on the server, by two Cloud
Functions in `functions/index.js` (`sendCode`, `verifyCode`), so the app
can't fake or skip them. Only a salted hash of each code is stored, in the
`otpCodes` collection, which the app can't read or write (`firestore.rules`).
When an admin enters the right code, the server also marks their login
(`mfaUntil` on the account) for 12 hours.

Phone numbers are checked for a valid South African mobile format when
they're entered. They are not yet confirmed by SMS.

## One-time setup

You need the Firebase project on the **Blaze** plan (Cloud Functions need
it; normal use of this app stays within the free allowance) and an email
account to send from.

### 1. Make a Gmail app password

Use a Gmail account for the app (e.g. a new `andfriends.app@gmail.com`):

1. Turn on **2-Step Verification** for that Google account
   (myaccount.google.com → Security).
2. myaccount.google.com → search **App passwords** → create one called
   `&friends`. Copy the 16-letter password. Keep it private.

### 2. Deploy (Google Cloud Shell: nothing to install on your PC)

Open https://shell.cloud.google.com (signed in with the Google account that
owns the Firebase project). It already has `git`, `node` and `firebase`.

```bash
git clone https://github.com/42seconds/friends-app.git
cd friends-app
npm ci --prefix functions
firebase login --no-localhost
firebase use andfriends-c5552
firebase functions:secrets:set SMTP_USER   # paste the Gmail address
firebase functions:secrets:set SMTP_PASS   # paste the app password
firebase deploy --only functions,firestore:rules
```

(On your own PC it's the same, with `npx firebase-tools` in place of
`firebase`.)

That's it: the app uses the functions straight away. Until they're
deployed, the code screens say "Email codes aren't switched on yet".

### Using another email service

`SMTP_HOST` and `SMTP_PORT` in a `functions/.env` file switch from Gmail to
any SMTP service (e.g. `SMTP_HOST=smtp.sendgrid.net`, `SMTP_PORT=587`).

## Tests

- `npm test --prefix functions`: the code rules (expiry, tries, limits).
- `npm run test:otp`: the whole flow in the local Firebase emulators, with
  a fake mail server catching the emails. Never touches the live project.
- `npm run test:rules`: includes "nobody can read or change code records".

All three run in CI on every push.
