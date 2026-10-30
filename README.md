# Aether

A Windows-only desktop game library and a separate web storefront for discovering independently created games.

## Project layout

- `website/` — browser storefront; browser users can only play the built-in Introduction to Aether demo.
- `pc/` — Electron desktop app. The Windows workflow builds only this directory and uses `pc/index.html` for its UI.
- `supabase/` — database schema, access policies, and Edge Functions.

## Game package format

Aether currently accepts static HTML5 game ZIPs. The desktop client downloads and extracts them into the user's Aether game library; games run in a sandboxed window with no Node.js access. Arbitrary executables and installer EXEs are not accepted.

## Important safety notes

AI review is advisory and cannot guarantee that a game is safe. Publication requires a human moderator's approval after automated checks. Age is self-declared in this starter implementation; it is not identity or age verification. Do not collect identity documents or launch public developer onboarding until an adult has reviewed the privacy, child-safety, moderation, and legal requirements.

See `supabase/schema.sql` and `supabase/README.md` for setup.