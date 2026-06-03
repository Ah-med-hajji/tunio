# Tuneo — Setup & Test Guide (Windows)

This guide takes someone who has never seen the project from a fresh Windows machine
to a fully running application. Follow every step in order.

---

## Test accounts (quick reference)

These accounts are created during setup (section 4.6). Keep this table handy while testing.

| Role | Username | Password | Email | Access |
|---|---|---|---|---|
| Admin | `admin` | `admin` | admin@tuneo.tn | Full admin panel (`/dashboard`, categories, places, demandes, stats) |
| Partner | `partner` | `partner` | partner@tuneo.tn | Partner panel only (submit demande, profile) |
| Client | `user` | `user` | user@tuneo.tn | Client panel (`/user/dashboard`, reservations, historique, profile) |

> All three accounts use the same password as their username for simplicity.
> The Stripe test card for payments is `4242 4242 4242 4242` (any future expiry, any 3-digit CVC).

---

## 1. What you need to install first

Install each tool before moving on. Version numbers are the minimum required.

### 1.1 JDK 21

1. Go to **https://adoptium.net** → download **Eclipse Temurin 21 (LTS)** for Windows x64.
2. Run the installer; on the "Custom Setup" screen tick **"Set JAVA_HOME variable"** and
   **"Add to PATH"** — both must be checked.
3. Open a new **Command Prompt** and verify:
   ```
   java -version
   ```
   Expected output starts with `openjdk version "21.`

### 1.2 Apache Maven 3.9+

1. Go to **https://maven.apache.org/download.cgi** → download the **Binary zip archive**
   (e.g. `apache-maven-3.9.x-bin.zip`).
2. Extract it to a permanent folder, e.g. `C:\tools\maven`.
3. Add `C:\tools\maven\bin` to your **System PATH**:
   - Win + S → "Edit the system environment variables" → Environment Variables →
     under "System variables" find `Path` → Edit → New → paste the path.
4. Open a new Command Prompt and verify:
   ```
   mvn -v
   ```
   Expected: `Apache Maven 3.9.x`

### 1.3 Node.js 20 LTS

1. Go to **https://nodejs.org** → download the **LTS** installer (Node 20.x).
2. Run the installer with defaults — it adds `node` and `npm` to PATH automatically.
3. Verify in a new Command Prompt:
   ```
   node -v   → v20.x.x
   npm -v    → 10.x.x
   ```

### 1.4 Angular CLI 21

In Command Prompt (run as Administrator):
```
npm install -g @angular/cli@21
```
Verify:
```
ng version
```

### 1.5 MySQL 8.0

1. Go to **https://dev.mysql.com/downloads/installer/** → download
   **MySQL Installer for Windows** (the full ~450 MB package).
2. Run it, choose **"Developer Default"** setup type.
3. When prompted, set the **root password** — write it down.
   For this guide we use `root` as password (change it in the config if yours differs).
4. Ensure **MySQL Server 8.0** and **MySQL Workbench** are installed.
5. Start MySQL Server from **Windows Services** (Win + R → `services.msc` →
   "MySQL80" → Start) or from MySQL Installer's "MySQL Server" tab.

### 1.6 Keycloak 26

1. Go to **https://www.keycloak.org/downloads** → under "Keycloak" click
   **ZIP** for the latest 26.x release.
2. Extract to a permanent folder, e.g. `C:\tools\keycloak`.
3. No other installer needed.

---

## 2. Copy the project files

1. Download the Drive folder and extract/copy it somewhere convenient,
   e.g. `C:\projects\pfe_2026`.
2. The folder structure should look like this:
   ```
   pfe_2026\
   ├── tuneo.sql                        ← initial database dump
   └── middleoffice\
       ├── backend\core\                ← Spring Boot backend
       ├── frontend\tuneo\              ← Angular frontend
       └── db\migrations\              ← SQL migration file
   ```

---

## 3. Set up the database

Open **MySQL Workbench** (or the MySQL 8 command-line client).

### 3.1 Create the schema and import data

Run these three commands **one at a time** in the MySQL Workbench Query editor
(or paste into the command-line client after `mysql -uroot -p`):

```sql
CREATE DATABASE IF NOT EXISTS visite
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_0900_ai_ci;
```

Then import the dump (adjust the path to match where you put the project):

In the **Windows Command Prompt**:
```
mysql -uroot -p visite < C:\projects\pfe_2026\tuneo.sql
```
Enter your MySQL root password when prompted.

### 3.2 Apply the Phase 3 migration (mandatory)

```
mysql -uroot -p visite < C:\projects\pfe_2026\middleoffice\db\migrations\V2026_05_27_001__phase3_baseline.sql
```

This migration does three things the new backend requires:
- Makes `reservations.user_id` nullable.
- Converts `reservations` table engine from MyISAM → InnoDB.
- Adds the `users.avatar_url` column used by the profile page.

**Without this step the backend will fail to create or retrieve reservations.**

---

## 4. Configure Keycloak

### 4.1 Start Keycloak in development mode

Open **Command Prompt**, navigate to the Keycloak bin folder, and run:

```
cd C:\tools\keycloak\bin
kc.bat start-dev --http-port=9090
```

Leave this window open. Keycloak takes about 30–60 seconds to start.
When you see `Keycloak 26.x.x on JVM ... started` it is ready.

### 4.2 First-time admin account

On the very first start Keycloak shows a one-time setup screen at:
```
http://localhost:9090
```
Create the admin account:
- Username: `admin`
- Password: `admin`

If you skip this screen, use the `--bootstrap-admin-username` / `--bootstrap-admin-password`
flags on the command above:
```
kc.bat start-dev --http-port=9090 --bootstrap-admin-username=admin --bootstrap-admin-password=admin
```

### 4.3 Create the realm

1. Open `http://localhost:9090` in a browser and log in as `admin / admin`.
2. Click the realm dropdown (top-left, shows "Keycloak") → **Create realm**.
3. **Realm name:** `TUNEO` (exact case) → **Create**.

### 4.4 Create the client

1. In the left menu, go to **Clients** → **Create client**.
2. **Client ID:** `tuneoproject` → Next.
3. **Client authentication:** OFF (public client) → Next.
4. **Valid redirect URIs:** `http://localhost:4200/*`
5. **Web origins:** `http://localhost:4200`
6. Save.
7. Go to the **Advanced** tab → set **Proof Key for Code Exchange Code Challenge Method** to `S256`.
8. Save again.

### 4.5 Create realm roles

Go to **Realm roles** → **Create role** — create all three:

| Role name |
|---|
| `role_admin` |
| `role_partner` |
| `role_user` |

### 4.6 Create test users

For each user below: **Users** → **Add user** → fill the fields → **Create** →
**Credentials** tab → **Set password** (disable "Temporary").

| Username | First name | Email | Password | Role to assign |
|---|---|---|---|---|
| `admin` | Admin | admin@tuneo.tn | `admin` | `role_admin` |
| `partner` | Partner | partner@tuneo.tn | `partner` | `role_partner` |
| `user` | Client | user@tuneo.tn | `user` | `role_user` |

**Assigning a role:** after creating the user → go to **Role mapping** tab →
**Assign role** → filter by "realm roles" → select the appropriate role → **Assign**.

### 4.7 Enable "Forgot password"

**Realm Settings** → **Login** tab → turn on **Forgot password** → **Save**.

> **SMTP** (needed for the reset email to actually arrive): configure it under
> **Realm Settings** → **Email**. Without SMTP the link appears but the email
> is never sent.

---

## 5. Configure the backend

The backend reads all secrets from a local `application.yml` file that is **not committed to git**
(it's in `.gitignore` to prevent secret leaks). You must create it once.

### 5.1 Create application.yml

Copy the example file:
```
cd C:\projects\pfe_2026\middleoffice\backend\core\src\main\resources
copy application.yml.example application.yml
```

Then open `application.yml` in a text editor and fill in the three placeholders:

| Placeholder | Replace with |
|---|---|
| `gsk_replace_me` | Your Groq API key (free — get it at **https://console.groq.com** → API Keys → Create) |
| `sk_test_replace_me` | Your Stripe **secret** test key (from **https://dashboard.stripe.com** → Developers → API keys) |
| `pk_test_replace_me` | Your Stripe **publishable** test key (same page) |

> If you skip the Stripe keys the payment button will fail. If you skip the Groq key the chatbot
> will show "service indisponible" but everything else still works.

### 5.2 Start the backend

Open a **new Command Prompt** window:

```
cd C:\projects\pfe_2026\middleoffice\backend\core
mvnw.cmd spring-boot:run
```

Maven will download dependencies on the first run (~3–5 min depending on internet speed).
When you see:
```
Started CoreApplication in X.XXX seconds
```
the backend is running at **http://localhost:8081**.

**If your MySQL root password is not empty**, add it before running:

```
set DB_PASSWORD=your_password_here
mvnw.cmd spring-boot:run
```

---

## 6. Start the frontend

Open **another new Command Prompt** window:

```
cd C:\projects\pfe_2026\middleoffice\frontend\tuneo
```

**First time only** — install Node dependencies:
```
npm install
```
This takes 2–4 minutes.

Then start the dev server:
```
ng serve
```

When you see:
```
Application bundle generation complete. [X.XXX seconds]
Local:   http://localhost:4200/
```
the frontend is running.

Open **http://localhost:4200** in your browser.

---

## 7. Summary — what should be running

| Service | URL | How to verify |
|---|---|---|
| MySQL | localhost:3306 | MySQL Workbench can connect |
| Keycloak | http://localhost:9090 | Admin console loads |
| Backend | http://localhost:8081 | `http://localhost:8081/api/categories` returns JSON |
| Frontend | http://localhost:4200 | Homepage loads in browser |

---

## 8. Test checklist — feature by feature

Run through this list from top to bottom. Each item tells you where to go and
what to check.

---

### 8.1 Public homepage (no login)

1. Open `http://localhost:4200`.
2. You should see the **Tuneo homepage** with a list of places and a search bar.
3. The chatbot floating button should be visible.
4. **Expected:** page loads normally — you are NOT redirected to a Keycloak login screen.

---

### 8.2 User sign-up

1. From the homepage, click **S'inscrire** (or navigate to `/sign-up`).
2. Fill in the form and submit.
3. **Expected:** account is created in Keycloak; you are redirected to the sign-in page.

---

### 8.3 Sign in as a regular user (role_user)

1. Go to `/sign-in`.
2. Log in with `user / user`.
3. **Expected:**
   - You are redirected to `/user/dashboard`.
   - The sidebar on the left is visible and shows:
     - Mon tableau de bord
     - Découvrir
     - Mes réservations
     - Historique
     - Mon profil

---

### 8.4 Client dashboard (`/user/dashboard`)

While signed in as `user`:
1. Navigate to `http://localhost:4200/user/dashboard`.
2. **Expected:** a welcome card with your name, 4 KPI cards (Réservations, En attente,
   Confirmées, Annulées), and a list of your next 3 upcoming reservations.
   (Empty on a fresh database — that is normal.)

---

### 8.5 Browse and reserve a place

1. Click **Découvrir** in the sidebar or navigate to `/user/homepage`.
2. Click on any place card.
3. On the place detail page, choose dates and number of persons, then click **Réserver**.
4. The Stripe payment form appears — use the test card:
   - **Card number:** `4242 4242 4242 4242`
   - **Expiry:** any future date (e.g. `12/28`)
   - **CVC:** any 3 digits (e.g. `123`)
5. Submit the payment.
6. **Expected:** reservation is created; a PDF invoice is downloaded automatically;
   reservation status is **CONFIRMED**.

---

### 8.6 Mes réservations (`/user/reservations`)

1. Click **Mes réservations** in the sidebar.
2. **Expected:** a grid of reservation cards.
3. Find a **PENDING** reservation and click **Modifier** — change the dates and save.
   - **Expected:** dates update.
4. Click **Annuler** on a PENDING reservation and confirm.
   - **Expected:** status changes to CANCELLED; buttons become disabled.
5. Try to click Annuler on a **CONFIRMED** reservation.
   - **Expected:** button is greyed out (cannot cancel confirmed reservations).

---

### 8.7 Historique (`/historique`)

1. Click **Historique** in the sidebar.
2. **Expected:** a table listing all your reservations.
3. Use the status filter dropdown — select "CONFIRMED" — only confirmed reservations show.
4. Use the date range fields to filter by period.
5. Type a place name in the search box — table filters in real time.
6. Click **Télécharger PDF** on any row — a PDF of that reservation downloads.

---

### 8.8 Client profile (`/profile`)

1. Click **Mon profil** in the sidebar (while signed in as `user`).
2. **Expected:** form pre-filled with your name, email, and phone from Keycloak.
3. Change the first name and click **Enregistrer**.
   - **Expected:** success message; the name updates.
4. Click **Changer mon mot de passe**.
   - **Expected:** a Keycloak page opens to set a new password.

---

### 8.9 Sign in as admin (role_admin)

1. Sign out (user menu → Déconnexion) or open a private/incognito browser window.
2. Navigate to `/sign-in`.
3. Log in with `admin / admin`.
4. **Expected:** redirected to `/dashboard`. Sidebar shows:
   - Dashboard
   - Catégories
   - Places
   - Demandes
   - Calendrier
   - Mon profil

---

### 8.10 Admin dashboard (`/dashboard`)

While signed in as `admin`:
1. Navigate to `http://localhost:4200/dashboard`.
2. **Expected:**
   - 6 KPI cards: Utilisateurs, Places, Catégories, Réservations, Partenaires actifs,
     Demandes en attente.
   - A bar chart: monthly reservations (12 months).
   - An area chart: monthly revenue.
   - A donut chart: reservation status breakdown.
   - A table: 10 most recent reservations.

---

### 8.11 Admin — Catégories

1. Click **Catégories** in the admin sidebar.
2. **Expected:** list of categories.
3. Create a new category, edit one, delete one — all three actions should persist
   (reload the page to confirm).

---

### 8.12 Admin — Places

1. Click **Places** in the sidebar.
2. Create a new place linked to a category.
3. Edit an existing place.
4. **Expected:** changes visible in the public browse view at `/user/homepage`.

---

### 8.13 Admin — Demandes

1. Click **Demandes** in the sidebar.
2. **Expected:** list of partner place requests.
3. Accept one demande — it should create a new place and disappear from the pending list.

---

### 8.14 Admin profile (`/profile`)

1. Click **Mon profil** in the admin sidebar.
2. Edit first name and avatar URL, then save.
3. **Expected:** changes persist on page reload.
4. Click **Changer mon mot de passe** — Keycloak reset page opens.

---

### 8.15 Sign in as partner (role_partner)

1. Sign out, then log in with `partner / partner`.
2. **Expected:** redirected to `/dashboard`. Sidebar shows only:
   - Soumettre une demande
   - Mon profil

---

### 8.16 "Mot de passe oublié" flow

1. Go to `/sign-in` while signed out.
2. Click **Mot de passe oublié ?** at the bottom of the form.
3. **Expected:** Keycloak's password reset page opens.
   - Enter the email of a test user (e.g. `user@tuneo.tn`).
   - If SMTP is configured: an email arrives with a reset link.
   - If SMTP is NOT configured: Keycloak shows a message saying it tried to send an email.

---

### 8.17 Chatbot

1. Open the homepage `http://localhost:4200` while **signed out**.
2. Click the floating chat icon (bottom-right corner).
3. Type a question, e.g. **"hôtel à Sousse"**.
4. **Expected:** the AI assistant replies with relevant places from the database.

---

### 8.18 Security — unauthenticated API access

Open the browser's address bar or a tool like Postman:

```
GET http://localhost:8081/api/reservations
```
**Expected:** HTTP `401 Unauthorized` (not 200, not 403).

---

## 9. Troubleshooting

| Symptom | Fix |
|---|---|
| Backend fails to start — `Access denied for user 'root'` | Your MySQL root password is not empty. Set `DB_PASSWORD` before running: `set DB_PASSWORD=your_password` then run `mvnw.cmd spring-boot:run` again. |
| Backend fails to start — `Table 'visite.reservations' doesn't exist` | The SQL dump was not imported. Re-run step 3.1. |
| Backend fails to start — `Cannot add or update a child row: a foreign key constraint fails` | The Phase 3 migration was not applied. Re-run step 3.2. |
| Frontend blank white page | Open browser DevTools (F12) → Console tab. If you see CORS errors, verify the backend is running on port 8081. |
| Sign-in bounces back to login page | Keycloak realm `TUNEO` or client `tuneoproject` is not set up correctly. Re-check section 4. |
| Sidebar not visible on `/user/dashboard` | Make sure you are signed in as `user` (role_user). If signed out the public layout shows (no sidebar by design). |
| "Mot de passe oublié" link does nothing | Keycloak's "Forgot password" feature is not enabled. Re-check section 4.7. |
| Stripe payment form doesn't appear | The backend Stripe keys may be invalid. Check the `application.yml` for `stripe.secret.key` — replace with your real Stripe test keys. |
| Maven downloads many things on first run | Normal. First run downloads all Java dependencies (~100 MB). Subsequent starts are fast. |
| `ng serve` fails with `Cannot find module '@angular/cli'` | Run `npm install -g @angular/cli@21` again as Administrator. |

---

## 10. Stopping the application

Close (or Ctrl+C in) each Command Prompt window in this order:
1. Frontend (`ng serve`)
2. Backend (`mvnw.cmd spring-boot:run`)
3. Keycloak (`kc.bat start-dev`)

MySQL can stay running as a Windows Service; it will restart automatically on reboot.
To stop it manually: Win + R → `services.msc` → MySQL80 → Stop.
