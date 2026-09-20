# AQUIS

A mascot-driven hydration companion. Expo + React Native + TypeScript, local-first.

> Set a goal → receive a considerate reminder → log water → watch the glass fill → see the mascot react.

This repository implements **Phases 1–2** of the Product Bible development plan (section 20):
foundation and core hydration. Phases 3–5 are not built yet — see [Not built yet](#not-built-yet).

## Running it

```bash
npm install
npm start          # then scan the QR code with Expo Go
```

Other scripts:

| Command | What it does |
| --- | --- |
| `npm run android` / `npm run ios` | Start with a platform preselected |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run check:domain` | Runs the domain-logic checks (hydration maths, goal periods, local dates) |

## What is implemented

**Phase 1 — Foundation**

- Expo TypeScript project with Expo Router file-based navigation.
- Design tokens in [`src/theme/tokens.ts`](src/theme/tokens.ts) — palette, spacing, type scale and the
  motion budget from section 08 (150–500 ms micro-interactions, 1–2 s celebrations).
- SQLite database with versioned, append-only migrations ([`src/db/`](src/db/)) covering every entity
  in section 13. Tables for Phase 3/4 (notification events, streaks, achievements) are created now so
  later phases need no migration against live data.
- Repository layer ([`src/repositories/`](src/repositories/)) — screens never touch SQL.
- Onboarding and auth shell. `authService` is an interface with a local adapter; Google and email
  screens exist and create a real profile record, so swapping in a provider is one line.
- Mascot and glass prototypes as SVG + Reanimated.

**Phase 2 — Core hydration**

- Goal creation with duration; one active goal at a time, enforced in a transaction.
- Water entry persistence with timestamps and source.
- Home glass driven directly from the stored daily total.
- Quick-add (150/250/500 ml, configurable) and custom amount with validation.
- Undo, available for 12 s after logging.
- Goal completion: celebration, a "reminders are off for today" state, and extra logging that does
  not move the target.

## Screens

| Route | Product Bible |
| --- | --- |
| [`app/index.tsx`](app/index.tsx) | 06.1 Splash |
| [`app/(onboarding)/welcome.tsx`](app/(onboarding)/welcome.tsx) | 06.2 Welcome |
| [`app/(onboarding)/sign-in.tsx`](app/(onboarding)/sign-in.tsx) | 06.3 Authentication |
| [`app/(onboarding)/goal.tsx`](app/(onboarding)/goal.tsx) | 06.4 Goal setup |
| [`app/(onboarding)/duration.tsx`](app/(onboarding)/duration.tsx) | 06.5 Goal duration |
| [`app/(onboarding)/notifications.tsx`](app/(onboarding)/notifications.tsx) | 06.6 Notification setup |
| [`app/(onboarding)/mascot.tsx`](app/(onboarding)/mascot.tsx) | 06.7 Mascot introduction |
| [`app/(onboarding)/confirm.tsx`](app/(onboarding)/confirm.tsx) | 06.8 Goal confirmation |
| [`app/(tabs)/index.tsx`](app/(tabs)/index.tsx) | 06.9 Home, 06.11 Daily complete |
| [`app/custom-amount.tsx`](app/custom-amount.tsx) | 06.10 Custom water entry |
| [`app/(tabs)/history.tsx`](app/(tabs)/history.tsx) | 06.12 / 06.13 — partial, see below |
| [`app/(tabs)/achievements.tsx`](app/(tabs)/achievements.tsx) | 06.14 — partial, see below |
| [`app/(tabs)/profile.tsx`](app/(tabs)/profile.tsx) | 06.15 Profile / Settings |

## Two rules the code is built around

**Derived totals (09).** A day's consumed amount is never stored as an independently editable value.
Every entry insert, undo and delete recomputes the day from `water_entry` inside the same
transaction, so the acceptance criterion *"the visual glass always matches the stored daily total"*
holds by construction.

**Historical integrity (11).** `daily_hydration.goal_ml` is stamped once, when a day's row is first
created, and never re-stamped. Changing your goal starts a new period; days already logged keep the
target that applied on the day they happened.

Local dates are handled explicitly as `YYYY-MM-DD` keys built from local calendar fields —
`toISOString()` is deliberately never used for a day key, so a glass of water at 23:30 does not move
to tomorrow. `npm run check:domain` covers this along with DST and month boundaries.

## Not built yet

| Phase | Scope |
| --- | --- |
| **3 — Notification engine** | Permission flow, eligibility pipeline, randomized 3-hour opportunity windows, suppression rules, daily caps, rescheduling after logs, deep-link to Home. The onboarding screen records the preference in `AppSettings`; the OS permission is intentionally *not* requested yet, since section 17 says to ask only for permissions the app actually needs. |
| **4 — History & motivation** | The month calendar of completion droplets, day detail with entry timeline, streak calculation, achievement engine, celebration animations. History currently lists the last 14 logged days; Achievements lists the badge catalogue with nothing marked earned. |
| **5 — Polish** | Rive mascot state machine (the current mascot is the SVG prototype), physics-style glass animation, full empty/error state pass, performance and battery review. |

Reduce Motion and haptics are already wired through both the OS preference and in-app toggles.

## Architecture

```
app/                    Expo Router routes
  (onboarding)/         06.2 – 06.8
  (tabs)/               Home · History · Achievements · Profile
src/
  components/           Glass, Mascot, Icon, CountUp, Celebration, ui primitives
  db/                   SQLite client + migrations
  domain/               Types and pure logic (hydration, goals, dates, mascot states)
  repositories/         Data access — the only layer that writes SQL
  services/             authService (provider interface + local adapter)
  state/                AppProvider, OnboardingProvider
  theme/                Design tokens
  utils/                haptics, reduce-motion, ids
scripts/check-domain.ts Domain-logic checks
```

Data flows one way: UI → `AppProvider` → repositories → SQLite. The provider caches only the slice
every screen needs (profile, settings, active goal, today's hydration); the database stays the single
source of truth.

## Privacy

Everything stays on the device. No backend, no analytics upload, no ads, and no calendar or health
permissions. AQUIS offers general wellness guidance and is not a medical device.
