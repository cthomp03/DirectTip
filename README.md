# DirectTip

Tip workers directly — 100% free, no platform cut. Mobile-first PWA.

**Live:** https://cthomp03.github.io/DirectTip

## Features
- 📍 GPS nearby scan (find checked-in workers within 50m)
- ⬛ QR code profiles — workers share a QR, customers scan straight into the tip flow (works offline; profile is embedded in the QR)
- 🔤 Manual @handle lookup
- 💸 3-step tip flow with messages + confirmation codes
- 📊 Worker earnings dashboard (today / week / month / all-time) with live tip feed
- 🔥 Firebase sync layer (local-first: localStorage is instant source of truth, Firestore syncs in background) — see FIREBASE_SETUP.md
- 📱 Installable PWA with offline support (service worker v2)

## Files
- `index.html` — the entire app (single file)
- `sw.js` — service worker (Firebase-safe caching)
- `manifest.json` — PWA manifest
- `FIREBASE_SETUP.md` — how to turn on the cloud backend
