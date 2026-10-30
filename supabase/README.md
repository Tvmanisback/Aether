# Aether owner setup

## 1. Create or update the database

For a **new Supabase project**:
1. Open the Supabase project and go to **SQL Editor**.
2. Run `schema.sql`.
3. Run `approval_triggers.sql`.

For the **existing prototype project** that already ran the old schema:
1. Open **SQL Editor**.
2. Run `migrate-dob-exe-packages.sql`.
3. Run `migrate-public-auth-keys.sql`.
4. Run `approval_triggers.sql` to install the backend key-generation trigger.

Do not rerun the original schema on an existing database: its policies are not designed as a repeatable migration.

## 2. Configure game upload size\n\nAether allows up to 10 GiB (10,737,418,240 bytes) per complete game package. For an existing project, run `migrate-game-upload-limit-10gb.sql` in the Supabase SQL Editor. For a new project, `schema.sql` already sets both game buckets to 10 GiB per object. Also check **Project Settings → Storage** and make sure the project's global file-size limit is at least 10 GiB; the maximum available depends on your Supabase plan. Large uploads may require resumable uploads and sufficient storage/bandwidth quota.\n\n## 3. Configure authentication

1. In **Authentication → Providers**, enable Email.
2. Require email confirmation for public use.
3. In **Authentication → URL Configuration**, add your GitHub Pages website URL and any local development URL.
4. Aether accounts require a date of birth showing age 13+. Developer applications require age 18+. These are self-declared dates, not verified identity or age checks.

## 4. Configure the public client values

Copy the Supabase **Project URL** and **anon/public key** from Project Settings → API.

Set those two values in both:
- `website/app.js` — `SUPABASE_URL` and `SUPABASE_ANON_KEY`
- `pc/main.js` — `SUPABASE_URL` and `SUPABASE_ANON_KEY`

Aether does not use a hard-coded shared key. When an admin approves a developer application, a database trigger generates a random 256-bit developer public key on the backend and stores it in that developer's profile. The Developer section displays the signed-in developer's own key. The same key is attached to their published games.

Never put the Supabase **service-role key** in either public file, the desktop app, a game folder, or the README.

## 5. Make your account an admin

1. Create your account through the Aether website.
2. In Supabase, open **Authentication → Users** and copy your user's UUID.
3. In SQL Editor, run this command with your UUID:

```sql
update public.profiles
set role = 'admin'
where id = 'YOUR_AUTH_USER_UUID';
```

The admin review panel appears after you sign in again.

## 6. Deploy the game publishing function

The website's moderator approval calls `publish-game`. It copies approved files from the private `game-submissions` bucket into the public `published-games` bucket and creates the public catalog row.

1. Open **Edge Functions** in the Supabase dashboard.
2. Create a function named `publish-game`.
3. Use the code in `supabase/functions/publish-game/index.ts`.
4. Deploy it.
5. In the function's secrets/settings, ensure `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are available. Supabase normally provides project values automatically; add missing values in the function's secret settings. The service-role key must stay server-side only.

The function checks that the caller is signed in and has the admin role. Do not disable JWT verification.

## 7. Deploy game authentication

1. In **Edge Functions**, create a function named `game-auth`.
2. Deploy `supabase/functions/game-auth/index.ts`.
3. Keep JWT verification enabled.
4. A game sends its `game_id`, the developer's `x-aether-public-key`, and the player's normal Aether Supabase access token. The backend validates both the signed-in user session and that the key belongs to that published game.
5. A public key by itself never authenticates a user. Do not put service-role keys or private signing secrets in a game.

## 8. Build and publish the Windows app

1. In the GitHub repository, edit `website/app.js` and `pc/main.js` with the same Supabase Project URL and anon/public key.
2. In repository **Settings → Pages**, publish from the `main` branch and root folder.
3. In **Actions**, run **Build Aether for Windows** (or push a change under `pc/`).
4. Download the `Aether-Windows` artifact from the completed workflow. It contains the Windows installer.

## Important limitations and safety

- Date-of-birth checks are self-declared. They are not reliable age verification. Do not describe users as verified or automatically ban player accounts based only on the date they enter.
- There is not yet an AI or antivirus scanning service connected. Human review is required, but review is not a malware guarantee. Do not advertise automated scanning until a real server-side scanner is implemented and tested.
- The desktop app downloads approved game files and asks before launching third-party EXEs. A warning does not make an unknown executable safe. Add publisher identity, cryptographic hashes, scan results, and a stronger signed update/install pipeline before public launch.
- The random developer public key is intentionally public and can be copied from a game. It identifies the developer/game integration; it is not a password. The backend also requires a valid Supabase user session. Never trust the public key alone as proof of a user's identity.
- The Terms and Privacy pages are starter drafts. Have a qualified adult and lawyer review child safety, privacy, moderation, security, and legal requirements before opening registration publicly.
