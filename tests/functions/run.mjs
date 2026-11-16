// Runs tests/functions/otp-flow.test.mjs in the Firebase emulators.
// The functions need SMTP_USER/SMTP_PASS secrets to start; for the
// emulator these are dummy values in functions/.secret.local, made here
// if missing (and removed again afterwards). Nothing is ever sent: the
// test project's emails go to the test's own fake mail server.
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const secret = new URL('../../functions/.secret.local', import.meta.url);
const made = !fs.existsSync(secret);
if (made) fs.writeFileSync(secret, 'SMTP_USER=test@example.com\nSMTP_PASS=test\n');
const r = spawnSync('npx', ['-y', 'firebase-tools@15', 'emulators:exec', '--only', 'auth,firestore,functions', '--project', 'demo-friends', 'node tests/functions/otp-flow.test.mjs'], { stdio: 'inherit', shell: process.platform === 'win32' });
if (made) fs.rmSync(secret, { force: true });
process.exit(r.status ?? 1);
