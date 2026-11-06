# &friends on iPhone (web app)

iPhone users get &friends from the website, not the App Store. They open
it in Safari once and add it to their home screen; from then on it opens
full screen from its own icon, like an installed app. It uses the same
live database and logins as the Android app, and nothing has to run on
anyone's laptop.

**Link:** https://42seconds.github.io/friends-app/

(Also on Firebase Hosting at https://andfriends-c5552.web.app once that is
set up, see below. Both are the same app.)

## For iPhone users

1. Open the link in **Safari** (not Chrome or the Instagram/WhatsApp browser).
2. Tap the **Share** button (square with an arrow) in Safari's bar.
3. Scroll down, tap **Add to Home Screen**, then **Add**.
4. Open **&friends** from the home screen.

Safari also shows a "Get the app on your iPhone" card on Explore with these
steps; it disappears once the app is opened from the home screen.

What's different from the Android app:

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
