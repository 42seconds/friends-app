# &friends as an installable web app (iPhone and Android)

&friends is also an installable web app (a PWA): one app that runs on any
phone without an app store. People open the link once and add it to their
home screen; from then on it opens full screen from its own icon, like an
installed app, and **works without signal**. It uses the same live database
and logins as the Android APK, and nothing has to run on anyone's laptop.

**Link:** https://42seconds.github.io/friends-app/

(Also on Firebase Hosting at https://andfriends-c5552.web.app once that is
set up, see below. Both are the same app.)

## Installing it

**iPhone:** open the link in **Safari** (or Chrome) → tap **Share** →
**Add to Home Screen** → **Add**.

**Android:** open the link in **Chrome** → tap **Install the app** on the
card on Explore (or ⋮ menu → **Add to Home screen** / **Install app**).

Then open **&friends** from the home screen. On a phone's browser, Explore
shows a "Get the app on your phone" card with these steps; it disappears
once the app is opened from the home screen.

## Without signal

The first time the app is opened with internet, it saves itself on the
phone (about 4 MB: its code, fonts and images). After that it opens with no
signal and shows what was last loaded: events (with their pictures), your
tickets and QR codes, and your profile. An "Offline" strip shows at the top.
Booking, paying, logging in and staff approvals need a connection, and say
so.

Updates: when the phone has signal, opening the app checks for a newer
version; it's used from the next time the app is opened.

## What's different from the Android APK

- Push notifications are not sent to the web app. Ticket updates still
  show inside the app.
- The staff door scanner needs Safari's permission to use the camera
  (Safari asks the first time).
- Continue with Google is not offered; email sign-up and log in work.

## Publishing updates

The web app is published automatically: every push to `master` that passes
CI runs the **Publish web app to GitHub Pages** job in GitHub Actions, which
builds the app and puts it on GitHub Pages. No keys or setup are needed.
People get the new version the next time they open the app.

GitHub Pages is switched on under the repository's **Settings → Pages**
with Source set to **GitHub Actions**.

### Optional: also publish to Firebase Hosting

The job needs a key that lets GitHub publish to Firebase Hosting. It is
stored as a GitHub secret, never in the code.

1. If Hosting has never been used on the project: Firebase console →
   **Build → Hosting → Get started** (click through; nothing to install).
2. Firebase console → ⚙ **Project settings → Service accounts** →
   **Generate new private key**. A `.json` file downloads.
3. GitHub → the repository → **Settings → Secrets and variables → Actions**
   → **New repository secret**.
   - Name: `FIREBASE_SERVICE_ACCOUNT_ANDFRIENDS_C5552`
   - Secret: open the downloaded `.json` file in Notepad, copy everything,
     paste it here.
4. Delete the downloaded `.json` file from your computer. Never commit it
   or send it to anyone.

Until the secret is added, the job still builds the web app (downloadable
from the run's Artifacts) and skips publishing.

### Publishing by hand

From the project folder:

```powershell
npx firebase-tools login
npm run deploy:web
```
