# Generates azure-boards-backlog.csv for Azure Boards (Agile process).
# Boards > Work items > Import work items > choose this CSV.
# "Title 1/2/3" columns build the Epic > Feature > Story/Task tree.
import csv, os

P = 'FRIENDS-App'  # Azure DevOps project name (no "&" allowed in project names)
S = lambda n: f'{P}\\Sprint {n}'
rows = []
def epic(t, state, sprint, desc=''): rows.append(['Epic', t, '', '', state, S(sprint), 'epic', desc])
def feat(t, state, sprint, desc=''): rows.append(['Feature', '', t, '', state, S(sprint), '', desc])
def story(t, state, sprint, desc=''): rows.append(['User Story', '', '', t, state, S(sprint), '', desc])
# Agile process levels are Epic > Feature > User Story, so third-level
# delivery items are imported as User Stories tagged "task".
def task(t, state, sprint, desc=''): rows.append(['User Story', '', '', t, state, S(sprint), 'task', desc])

epic('DevOps and project setup', 'Closed', 1, 'Repository, tooling, boards and pipelines for the full DevOps life cycle.')
feat('Repository and tooling', 'Closed', 1)
task('Create GitHub repository and branch strategy (master + feature branches + pull requests)', 'Closed', 1)
task('Set up Expo (React Native) project with TypeScript', 'Closed', 1)
task('Set up Firebase project (Authentication, Firestore, Storage)', 'Closed', 2)
task('Create Azure DevOps project, sprints and backlog', 'Closed', 7)
feat('Continuous integration and delivery', 'Closed', 6)
task('GitHub Actions: typecheck and unit tests on every pull request', 'Closed', 6)
task('GitHub Actions: Firestore security-rules tests on the emulator', 'Closed', 6)
task('GitHub Actions: build installable Android APK artifact', 'Closed', 6)
task('GitHub Actions: iOS simulator build (manual / master / label)', 'Closed', 6)
task('Azure Pipelines: test + build pipeline (azure-pipelines.yml)', 'Closed', 7)

epic('Design (Braam Night+)', 'Closed', 2, 'UI/UX design of all app screens in the design canvas.')
feat('Design system and screens', 'Closed', 2)
story('As a designer I want a colour, type and component system so screens look consistent', 'Closed', 2)
story('As a user I want a clear onboarding so I understand the app on first open', 'Closed', 5)
task('Design 75+ app screens (explore, event, booking, tickets, staff, settings)', 'Closed', 2)
task('Design first-time guide, coach marks and guided first payment', 'Closed', 7)

epic('Accounts and authentication', 'Closed', 4, 'Register, log in, SSO, password reset, settings.')
feat('Register and log in', 'Closed', 4)
story('As a new user I want to register with my email and a password so I can buy tickets', 'Closed', 4, 'Passwords are hashed by Firebase Authentication (scrypt) and never stored by the app.')
story('As a user I want to log in and stay logged in between app launches', 'Closed', 4)
story('As a user I want clear errors when my details are wrong', 'Closed', 6)
task('Input validation: names, email, password strength, SA mobile numbers', 'Closed', 6)
feat('Single sign-on (SSO)', 'Closed', 6)
story('As a user I want to Continue with Google instead of making a new password', 'Closed', 6)
task('Enable Google provider, register Android/iOS apps and SHA-1', 'Closed', 6)
task('Create user profile on first Google sign-in', 'Closed', 6)
feat('Password and sessions', 'Closed', 7)
story('As a user who forgot my password I want a reset link by email', 'Closed', 7)
story('As a user I want a clear log out with a chance to cancel', 'Closed', 7)
feat('Settings', 'Closed', 5)
story('As a user I want to edit my profile, notifications, language and refund bank details', 'Closed', 5)
story('As a user I want to delete my account', 'Closed', 5)

epic('Events and discovery', 'Closed', 3)
feat('Explore and search', 'Closed', 3)
story('As a user I want to see this week\'s events from the database', 'Closed', 3)
story('As a user I want to filter by sub-brand, price and date, and search', 'Closed', 5)
story('As a user I want to save events and see past events and galleries', 'Closed', 5)
feat('Event details', 'Closed', 3)
story('As a user I want to see lineup, venue, map and all-in prices', 'Closed', 5)

epic('Booking and EFT payment', 'Closed', 3)
feat('Reserve and pay', 'Closed', 3)
story('As a user I want to reserve tickets and have them held for 24 hours', 'Closed', 3)
story('As a user I want bank details and a reference I can copy to pay by EFT', 'Closed', 3)
story('As a user I want to upload proof of payment from my camera or photos', 'Closed', 3)
story('As a user I want to see where my payment check is (timeline)', 'Closed', 5)
story('As a user I want to use promo and access codes', 'Closed', 5)
feat('Guided first payment', 'Closed', 7, 'Step tracker on the real screens, banking-app helper, upload quick check, pay-later reminders.')
story('As a first-time buyer I want step-by-step help through my first payment', 'Closed', 7)
story('As a user I want reminders when I choose to pay later', 'Closed', 7)

epic('Tickets and the door', 'Closed', 5)
feat('Tickets', 'Closed', 5)
story('As a user I want a QR ticket that admits everyone on my booking', 'Closed', 5)
story('As a user I want to send a ticket to a friend or release it to the waitlist', 'Closed', 5)
story('As a user I want to join a waitlist for sold-out events', 'Closed', 5)
story('As a user I want a notification when my payment is approved or needs a fix', 'Closed', 7)
story('As a user I want a push notification even when the app is closed', 'Closed', 7)
feat('Staff mode', 'Closed', 5)
story('As an admin I want to review proofs and approve or reject with a reason', 'Closed', 5)
story('As door staff I want to scan QR codes, see the guest list, and keep scanning offline', 'Closed', 5)

epic('Database and security', 'Closed', 2)
feat('Firestore database', 'Closed', 2)
task('Design collections: users, events, tickets, waitlist, ratings, enquiries, promoCodes, config, gallery, content', 'Closed', 2)
task('Seed script: at least 10 records per collection', 'Closed', 6)
task('Read website bookings (shared database with the admin website)', 'Closed', 6)
feat('Security', 'Closed', 5)
task('Firestore security rules (roles: resident, admin)', 'Closed', 5)
task('53 automated rules tests on the Firestore emulator', 'Closed', 6)

epic('Quality and user support', 'Active', 6)
feat('Stability fixes', 'Closed', 6)
task('Fix Expo Go crash (notifications), GO_BACK errors, listener errors', 'Closed', 6)
task('Fix redirect loop when logging in before onboarding', 'Closed', 6)
task('Fix app hanging on the splash screen when reopened', 'Closed', 7)
task('Replace the default Expo icon with the &FRIENDS logo', 'Closed', 7)
feat('Help system and user documentation', 'Active', 7)
story('As a user I want a searchable help page with step-by-step answers', 'Closed', 7)
story('As a new user I want a 9-step guide after my first login', 'Closed', 7)
story('As a new user I want one-time bubbles pointing at what to tap', 'Closed', 7)
task('Write the user guide and technical documentation', 'Active', 7)
feat('Offline mode', 'Closed', 7)
story('As a user I want to open my tickets and recent events without internet', 'Closed', 7)
story('As a user I want to see when I am offline', 'Closed', 7)
feat('Automated testing', 'Closed', 6)
task('Unit tests (Jest): pricing, dates, filters, validation, tickets, help, alerts', 'Closed', 6)

epic('Release and demonstration', 'Active', 7)
feat('Demo and submission', 'Active', 7)
task('Record demonstration video on a real phone with voice-over', 'New', 7)
task('Launch video (motion graphics, voice-over, soundtrack)', 'Closed', 7)
task('Merge to master and tag release', 'New', 7)
task('Submit documentation on ARC (no zip files)', 'New', 7)

# Azure only lets an import create items in their first state ("New"), so
# the real state goes into a tag instead. After importing, query each tag
# and bulk-edit State (see README step 3).
STATE_TAG = {'Closed': 'done', 'Active': 'in-progress', 'New': 'to-do'}
out = os.path.join(os.path.dirname(__file__), 'azure-boards-backlog.csv')
with open(out, 'w', newline='', encoding='utf-8') as f:
    w = csv.writer(f)
    w.writerow(['Work Item Type', 'Title 1', 'Title 2', 'Title 3', 'Iteration Path', 'Tags', 'Description'])
    for kind, t1, t2, t3, state, it, tags, desc in rows:
        w.writerow([kind, t1, t2, t3, it, '; '.join(x for x in (tags, STATE_TAG[state]) if x), desc])
print(len(rows), 'work items ->', out)

# The same backlog as JSON for setup-azure-boards.ps1, which creates the
# items through the Azure DevOps API with their real state and parent.
import json
items, last = [], {}
for kind, t1, t2, t3, state, it, tags, desc in rows:
    level = 0 if t1 else 1 if t2 else 2
    last[level] = len(items)
    items.append({
        'type': kind, 'title': t1 or t2 or t3, 'state': state, 'sprint': int(it.rsplit(' ', 1)[1]),
        'tags': tags, 'description': desc, 'parent': last.get(level - 1) if level else None,
    })
with open(os.path.join(os.path.dirname(__file__), 'azure-boards-backlog.json'), 'w', encoding='utf-8') as f:
    json.dump(items, f, indent=1, ensure_ascii=False)
