# Size Down

Mobile-first trading journal for day traders and prop-firm evals: ten-second trade log, your own rules, the tilt tax (rule-following P&L vs actual), and eval tracking with correct static / EOD-trailing / intraday-trailing drawdown math.

- Expo SDK 57 / React Native 0.86, runs on web (`npx expo export -p web`, deployed at https://tryforma.app/sizedown/app/) and iOS.
- Backend: Supabase (tables `sd_*`, RLS; entitlements written only by the Stripe webhook via `sd_grant`).
- Payments: Stripe Payment Links (web). Webhook: `forma/api/sizedown-webhook.js`. Restore: `forma/api/sizedown-restore.js`.
- `npx tsc --noEmit` to typecheck. Web demo states: `?demo=today|journal|rules|eval|me|paywall|onboard|trade`.
