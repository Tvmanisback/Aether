# Aether Supabase setup

1. Create a Supabase project.
2. Open SQL Editor and run `schema.sql`.
3. In Authentication → Providers, enable Email. Require email confirmation for public use.
4. In Authentication → URL Configuration, add your GitHub Pages URL and local development URL.
5. Copy Project URL and anon/public key from Project Settings → API into `website/app.js`. Never put the service-role key in browser code or GitHub.
6. Create your account through the website. In SQL Editor, find its UUID in Authentication → Users and run the admin promotion statement at the bottom of schema.sql with that UUID.
7. Uploads use a private bucket. Only approved catalog rows should be visible publicly. The admin dashboard is a human review queue; do not treat automated checks as approval.

## Important limitations

- Age is self-declared, not verified. The 13+ checkbox and 18+ developer form are a basic gate, not reliable age assurance. Do not claim users are verified or automatically permanently ban them based only on an age field.
- This starter has no AI malware scanner. Add a server-side scanning pipeline (never expose API keys in the website) and require a human review of the source and packaged files before publishing.
- The starter schema intentionally keeps submitted archives private. To publish, a trusted server-side admin workflow must copy the approved package into a separate public distribution bucket and insert the corresponding `games` row. Do not make the submission bucket public.
- Do not allow the desktop app to silently execute downloaded EXEs. Show the publisher, hash, scan/review status, and an explicit Windows launch confirmation. Unsigned apps may trigger Windows SmartScreen.
- Have a qualified adult review child safety, privacy, terms, security, and legal obligations before opening registrations publicly.
