# Aether owner setup

## 1. Create or update the database

For a **new Supabase project**:
1. Open the Supabase project and go to **SQL Editor**.
2. Run `schema.sql`.
3. Run `approval_triggers.sql`.

For the **existing prototype project** that already ran the old schema:
1. Open **SQL Editor**.
2. Run `migrate-dob-exe-packages.sql`.
3. Run `approval_triggers.sql` if the developer approval trigger is not already installed.

Do not rerun the original schema on an existing database: its policies are not designed as a repeatable migration.

## 2. Configure authentication

1. In **Authentication → Providers**, enable Email.
2. Require email confirmation for public use.
3. In **Authentication → URL Configuration**, add your GitHub Pages website URL and any local development URL.
4. Aether accounts require a date of birth showing age 13+. Developer applications require age 18+. These are self-declared dates, not verified identity or age checks.

## 3. Configure the public client values

Copy the Supabase **Project URL** and **anon/public key** from Project Settings → API.

Set those two values in both:
- `website/app.js` — `SUPABASE_URL` and `SUPABASE_ANON_KEY`
- `pc/main.js` — `SUPABASE_URL` and `SUPABASE_ANON_KEY`

The Aether public integration identifier is already set in `website/app.js`. Approved developers can copy it from the Developer section. It is a public identifier, not a password or authentication secret.

Never put the Supabase **service-role key** in either public file, the desktop app, a game folder, or the README.

## 4. Make your account an admin

1. Create your account through the Aether website.
2. In Supabase, open **Authentication → Users** and copy your user's UUID.
3. In SQL Editor, run this command with your UUID:

```sql
update public.profiles
set role = 'admin'
where id = 'YOUR_AUTH_USER_UUID';
```

The admin review panel appears after you sign in again.

## 5. Deploy the game publishing function

The website's moderator approval calls `publish-game`. It copies approved files from the private `game-submissions` bucket into the public `published-games` bucket and creates the public catalog row.

1. Open **Edge Functions** in the Supabase dashboard.
2. Create a function named `publish-game`.
3. Use the code in `supabase/functions/publish-game/index.ts`.
4. Deploy it.
5. In the function's secrets/settings, ensure `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are available. Supabase normally provides project values automatically; add missing values in the function's secret settings. The service-role key must stay server-side only.

The function checks that the caller is signed in and has the admin role. Do not disable JWT verification.

## 6. Build and publish the Windows app

1. In the GitHub repository, edit `website/app.js` and `pc/main.js` with the same Supabase Project URL and anon/public key.
2. In repository **Settings → Pages**, publish from the `main` branch and root folder.
3. In **Actions**, run **Build Aether for Windows** (or push a change under `pc/`).
4. Download the `Aether-Windows` artifact from the completed workflow. It contains the Windows installer.

## Important limitations and safety

- Date-of-birth checks are self-declared. They are not reliable age verification. Do not describe users as verified or automatically ban player accounts based only on the date they enter.
- There is not yet an AI or antivirus scanning service connected. Human review is required, but review is not a malware guarantee. Do not advertise automated scanning until a real server-side scanner is implemented and tested.
- The desktop app downloads approved game files and asks before launching third-party EXEs. A warning does not make an unknown executable safe. Add publisher identity, cryptographic hashes, scan results, and a stronger signed update/install pipeline before public launch.
- The public Aether key in a game manifest is only an identifier. It cannot authenticate a game by itself. Use backend-validated Supabase sessions/tokens for any real game-to-platform authentication. Never trust a key embedded in client files as proof of identity.
- The Terms and Privacy pages are starter drafts. Have a qualified adult and lawyer review child safety, privacy, moderation, security, and legal requirements before opening registration publicly.
