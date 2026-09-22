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

## Password recovery and verification resend

The login and authentication error pages now link to:

- /auth/resend-verification: resends an existing signup confirmation.
- /auth/forgot-password: requests a password recovery email.
- /auth/reset-password: lets an authenticated user save a new password.

Email request forms display neutral success messages and a 60-second UI cooldown.
Supabase enforces actual server-side email rate limits; reloading the UI does not
replace that protection. Password update requires a valid Supabase session and
matching passwords of at least 8 characters. Success retains the session and
links to Dashboard. Signed-in users can also use the form to change their password.

In Supabase Authentication > Email Templates > Reset password, set:

```html
<h2>Reset your password</h2>
<p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery">Choose a new password</a></p>
<p>If you did not request this email, you can ignore it.</p>
```

Keep the Confirm signup template above for verification resend. Add the exact
local and production /auth/callback?next=/auth/reset-password URLs to the allowed
redirect list for the PKCE fallback. The token-hash template uses Site URL and
works across browsers. Never put service-role credentials in the browser.

Recovery acceptance checks:

- Resend verification for an unconfirmed account and open the new email link.
- Request password reset, open the link in another browser and save a new password.
- Sign out; the new password should work and the previous password should fail.
- Check mismatched/short passwords and a session expiring before submission.
- Open /auth/reset-password without a session: a new-link prompt should appear.
- Open an expired or reused recovery link: show the error page with recovery links.
- Check unknown email, throttled requests and network failure messages.

References: [password recovery](https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail),
[verification resend](https://supabase.com/docs/reference/javascript/auth-resend).

Commit for this second step (after the first authentication commit):

```powershell
git add -- src/app/auth/EmailRequestForm.tsx src/app/auth/forgot-password src/app/auth/resend-verification src/app/auth/reset-password src/app/auth/login/page.tsx src/app/auth/confirm/route.ts src/app/auth/callback/route.ts src/app/auth/auth-code-error/page.tsx tests/auth-routes.test.mjs docs/auth-setup.md
git commit -m "feat(auth): add verification resend and password reset"
```


## Commit scope

Earlier schedule, dashboard and team-selection edits are still separate work.
Stage only this authentication step:

```powershell
git add -- src/app/auth/login/page.tsx src/app/auth/callback/route.ts src/app/auth/confirm/route.ts src/app/auth/auth-code-error/page.tsx middleware.ts docs/auth-setup.md tests/auth-routes.test.mjs
git commit -m "fix(auth): separate sign-in and verified registration"
```
