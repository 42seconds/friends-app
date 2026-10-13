# Azure DevOps setup for &FRIENDS

This sets up **Azure Boards** (planning, sprints, backlog) and **Azure Pipelines**
(build and test) for the project, alongside GitHub (code) and GitHub Actions (CI).
It takes about 20 minutes.

Files in this folder:

| File | What it is |
|---|---|
| `azure-boards-backlog.csv` | 86 work items (9 epics, 20 features, 57 user stories) over 7 sprints, ready to import |
| `make_backlog.py` | The script that makes the CSV (edit it and run `python docs/azure-devops/make_backlog.py` to regenerate) |
| `../../azure-pipelines.yml` | The Azure Pipeline: typecheck, unit tests (with a Tests tab), Firestore rules tests, Android APK |

---

## 1. Create the organisation and project (5 min)

1. Go to **https://dev.azure.com** and sign in with your student Microsoft account.
2. If asked, create an **organisation** (e.g. `andfriends-team`). Choose **South Africa North** (or nearest) as the region.
3. Click **+ New project**:
   - **Project name:** `FRIENDS-App` (exactly this, because the backlog file uses it. Azure doesn't allow "&" in names.)
   - **Visibility:** Private
   - **Advanced → Version control:** Git. **Work item process: Agile** ← important
4. Click **Create**.
5. **Add your team:** Project settings → Teams → FRIENDS-App Team → **Add** each team member's email.

## 2. Create the sprints (3 min)

Project settings → **Boards → Project configuration → Iterations**. Under `FRIENDS-App`, make
sure these exist (rename the default "Iteration 1/2/3" and add the rest). Set the dates:

| Sprint | Dates | What happened |
|---|---|---|
| Sprint 1 | 21 Jul – 3 Aug | Repository, Expo + TypeScript, planning (Task 1) |
| Sprint 2 | 4 Aug – 17 Aug | Design system, Firebase, database design |
| Sprint 3 | 18 Aug – 31 Aug | Events, booking, EFT checkout and proof upload |
| Sprint 4 | 1 Sep – 14 Sep | Register / log in and authentication screens |
| Sprint 5 | 15 Sep – 28 Sep | Tickets, staff mode, Braam Night+ redesign, security rules |
| Sprint 6 | 29 Sep – 12 Oct | Bug fixes, CI/CD, validation, Google SSO, seed data |
| Sprint 7 | 13 Oct – 26 Oct | Password reset, notifications, guide, help, docs, video |

Then **Project settings → Team configuration → Iterations → + Select iteration(s)** and tick all 7,
so they appear under Boards → Sprints.

## 3. Import the backlog (2 min)

1. **Boards → Work items → Import work items** (top right, or the "…" menu).
2. Choose `docs/azure-devops/azure-boards-backlog.csv` (download it from GitHub: open the file → **Download raw file**).
3. Click **Import**, check the preview, then **Save items**.

The epics, features and stories are linked parent → child automatically, and each has its
sprint and state (Closed = done, Active = in progress, New = to do).

> If the import complains about **State**, delete the `State` column in Excel, import again,
> then select items on the board and bulk-edit **State** (select → right-click → Edit).

4. **Assign work:** open **Boards → Backlogs**, select stories and set **Assigned To** for each
   team member (who built or owns what). The lecturer uses this to see who did which tasks.

## 4. Connect GitHub to Boards (3 min)

This links commits and pull requests to work items.

1. **Project settings → Boards → GitHub connections → Connect your GitHub account**.
2. Select the repository **42seconds/friends-app** and approve the **Azure Boards** GitHub app.
3. From now on, write `AB#<id>` in a commit message or PR description to link it, e.g.
   `Add coach marks on Explore AB#57`. The work item shows the commit, and
   `Fixes AB#57` closes the item when merged.

## 5. Run the pipeline (5 min)

1. **Pipelines → New pipeline → GitHub (YAML)** → pick **42seconds/friends-app** (approve access).
2. Choose **Existing Azure Pipelines YAML file**. Branch: `claude/friends-app-braam-night-screens-3mxbsj`
   (or `master` after merging). Path: `/azure-pipelines.yml`. Click **Continue → Run**.
3. Stages: **Typecheck and tests** (unit tests + rules tests) → **Build Android APK**.
   The **Tests** tab shows every unit test, and the APK is under **Artifacts**.

> **First run says "No hosted parallelism has been purchased or granted"?** New Azure DevOps
> organisations must request free build minutes once. Fill in
> **https://aka.ms/azpipelines-parallelism-request** (private project, free tier). Approval usually
> takes 2–3 working days. Until then, the same checks run on **GitHub Actions** (Actions tab),
> which you can show as the CI evidence.

## 6. Use it during the project

- **Daily:** move cards on **Boards → Sprints → Taskboard** (New → Active → Closed).
- **Meetings:** record each meeting in **Overview → Wiki** (date, attendees, decisions, actions).
  Create a page "Meeting notes" with one sub-page per meeting.
- **Problems:** log bugs as **Bug** work items (e.g. "GO_BACK error on Android", which is fixed).
- **Peer accountability:** the backlog's **Assigned To** and history show who did what.

## 7. Screenshots for the documentation

| Screenshot | Where |
|---|---|
| Backlog tree (epics → features → stories) | Boards → Backlogs → Epics level, expand all |
| Sprint board | Boards → Sprints → Sprint 7 → Taskboard |
| Burndown / velocity | Boards → Sprints → Analytics, or Overview → Dashboards (add the Burndown and Velocity widgets) |
| GitHub connection | A work item showing a linked commit (Development section) |
| Pipeline run | Pipelines → a green run (both stages) |
| Test results | The run's **Tests** tab |
| APK artifact | The run's **Artifacts** |
| Wiki meeting notes | Overview → Wiki |

## How this covers the DevOps life cycle

| Phase | Tool |
|---|---|
| **Plan** | Azure Boards: backlog, sprints, assignments |
| **Code** | GitHub: branches, pull requests, reviews |
| **Build** | Azure Pipelines + GitHub Actions: Android APK (and iOS simulator build) |
| **Test** | Jest unit tests, Firestore rules tests on the emulator, typecheck |
| **Release** | APK published as a build artifact, installable on a phone |
| **Deploy** | Firestore rules published to Firebase; app distributed as the APK |
| **Operate** | Firebase console (Auth users, Firestore data), Staff mode in the app |
| **Monitor** | Pipeline history, Firebase usage dashboard, in-app error handling |
