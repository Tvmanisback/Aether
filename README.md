# Welcome to Aether

Aether is a Windows game library and a website where you can discover independent games.

## Getting started

1. Open the Aether website and create an account. You must be at least 13.
2. Browse the Store and play the built-in **Introduction to Aether** demo in your browser.
3. Download the Aether Windows app when a Windows build is published.
4. The Aether Windows app lists approved games, downloads their files into your Aether game library, and asks before launching a third-party EXE. The website does not run uploaded games.

## Developer access

Developer publishing is restricted to people aged **18 or older**. Apply from the Developers section using your date of birth in MM/DD/YYYY format. Applications are reviewed by a human moderator. Enter your real date of birth; the form is an age declaration, not identity verification.

## Submitting a Windows game

After your developer application is approved, submit both required items:

- **Windows executable:** one `.exe` file.
- **Game folder:** select the complete, already-extracted folder containing the game's files. Do not upload a ZIP archive.

The selected EXE must also be present inside the selected folder. Aether does not accept a lone `index.html` as a game. If your game is made with HTML, package it as a Windows desktop executable (for example, using an Electron wrapper) and include the complete packaged game folder.

For an HTML-based game, include `aether.manifest.json` in the folder. It must contain the **random public authentication key issued to your developer account by Aether** and the executable's filename:

```json
{
  "aether_public_key": "YOUR_RANDOM_AETHER_DEVELOPER_KEY",
  "entry_exe": "YourGame.exe"
}
```

Aether generates this key on its backend after your developer application is approved. Copy it from the Developer section; do not invent or reuse another developer's key. The key identifies the approved developer/game integration. Actual authentication is handled by Aether's backend and requires a valid signed-in Aether user session as well as the matching key. The public key alone cannot sign in or prove a user's identity. Never put Supabase service-role keys, private API keys, passwords, or signing secrets in a game folder.

## Review and safety

Every submission stays private until a human moderator approves it. Automated security scanning is not connected in this early build, so human approval is not a guarantee that software is safe. Only submit software you own or are allowed to distribute. Players should review the publisher and make their own decision before running a downloaded executable.

## Help and updates

Check the Aether website for announcements and availability. This repository is the public source project for Aether.
