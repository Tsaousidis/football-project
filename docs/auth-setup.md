# Email verification setup

This step separates password sign-in from registration. All interface text is in
English. Research continues to use Claude; no AI provider change is included.

## Supabase configuration

1. Enable the Email provider and **Confirm email** in Supabase Authentication.
   This setting enforces verification on the server. The UI cannot enforce it
   if the Supabase project permits unverified sign-ins.
2. Set Authentication > URL Configuration > Site URL to the deployed app origin.
   For local-only testing, use `http://localhost:3000`.
3. Add the exact deployed `/auth/callback` URL and
   `http://localhost:3000/auth/callback` to allowed redirect URLs. Allow the
   `?next=/onboarding` variant used by signup too.
4. In Authentication > Email Templates > Confirm signup, use this link:

   ```html
   <h2>Confirm your email</h2>
   <p>Welcome to Football Intelligence. Verify your email to get started.</p>
   <p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">Verify email address</a></p>
   ```

   The token-hash endpoint supports opening the email on another browser/device.
   It redirects to team selection after confirmation and does not forward tokens.
   Site URL determines which deployment receives the link.
5. Configure and test your email delivery settings for production.

The existing `/auth/callback` endpoint also supports PKCE code exchange for older
links using the default confirmation template. That flow needs the browser that
started registration. New templates should use `/auth/confirm` above.

References: [Supabase Next.js tutorial](https://supabase.com/nextjs),
[email templates](https://supabase.com/docs/guides/auth/auth-email-templates).

## Manual acceptance checks

- Create an account with a new email and matching passwords of at least 8 characters.
- Verify that sign-in before email confirmation is rejected.
- Open the email link, including in a different browser, and confirm team selection opens.
- Sign out, then sign in with the verified email and password; Dashboard opens.
- Use a wrong password: an error appears and no signup email is sent.
- Submit mismatched passwords: no signup request is made.
- Open an expired/used link: the error page offers a return to sign-in.
- Try registering an existing address: the response does not promise a new account.
- Refresh an authenticated page and confirm the session remains valid.

Actual email delivery and project settings must be checked against the configured
Supabase instance. Local mocked tests do not verify those external services.

Resending confirmation emails and password recovery are the next separate step.

## Commit scope

Earlier schedule, dashboard and team-selection edits are still separate work.
Stage only this authentication step:

```powershell
git add -- src/app/auth/login/page.tsx src/app/auth/callback/route.ts src/app/auth/confirm/route.ts src/app/auth/auth-code-error/page.tsx middleware.ts docs/auth-setup.md tests/auth-routes.test.mjs
git commit -m "fix(auth): separate sign-in and verified registration"
```
