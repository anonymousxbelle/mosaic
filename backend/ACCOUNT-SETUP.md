# Optional login and cross-device libraries

Prepared, not activated. The site remains usable without login. Authentication uses the official Supabase SDK and email verification codes; Mosaic never handles account passwords. Cloud saves are explicit snapshots, with a separate merge action to prevent silent overwriting when signing in from a new browser.

## Create the service

1. Create a [Supabase account and project](https://supabase.com/dashboard). Keep its database password private.
2. Run `backend/account-schema.sql` in the project's SQL editor. It creates one library per user and row-level policies permitting access only when the authenticated user owns that row. Never disable row-level security.
3. Enable email authentication. In Authentication → Email Templates → Magic Link, include `{{ .Token }}` so the email displays the one-time code used by the interface. Follow [passwordless email instructions](https://supabase.com/docs/guides/auth/auth-email-passwordless).
4. Configure production SMTP/email delivery before allowing public signups. Supabase's default sender restricts delivery and is unsuitable for unrestricted public users. Review provider quotas and configure abuse controls.
5. Set Site URL to `https://anonymousxbelle.github.io/mosaic/`. The implemented flow uses an entered email code, not a custom redirect route.
6. In GitHub Settings → Secrets and variables → Actions → Variables, add SUPABASE_URL (project URL) and SUPABASE_PUBLISHABLE_KEY (the publishable/anon client key). These are intentionally public browser configuration. Never use a service-role or secret key here.
7. Rerun Publish Mosaic. Test email delivery, login, sign-out and save/merge in two browsers. Test two separate accounts and verify neither can read or overwrite the other's row. Do not mark account functionality live until these checks pass.

## Data behavior

- Guest libraries stay local to the browser.
- Save this library to account replaces that user's cloud snapshot.
- Merge saved cloud library combines known titles; existing local ratings/tag edits win conflicts. The library limit is 200 additions.
- Sign-out does not clear the browser's local library; the interface states this explicitly. Use a private browser on shared devices.
- Saved ratings, tags and avoided genres are private user data protected by database policies. Catalog providers receive searches, not account libraries.

Database migration and real account isolation tests await project provisioning. Current automated tests do not prove deployed database policy enforcement.
