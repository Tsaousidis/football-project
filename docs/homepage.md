# Marketing homepage

Replaces the technical project-status page with an English product landing page:
hero and decorative pitch, an explicitly illustrative briefing preview, benefits,
three-step introduction, native FAQ accordions and registration calls to action.
Copy describes Claude research, manual Telegram delivery and opt-in scheduling.
No fabricated scores, customer testimonials or usage statistics are displayed.

Styles are scoped in `src/app/home.module.css`. Layouts adapt at 900px and 650px.
Navigation remains available on mobile; decorative content is hidden from assistive
technology, links have focus indicators and a skip link leads to main content.

Registration links open `/auth/signup` with Create account selected. Login and
signup use the extracted shared `AuthForm`; authentication behaviour is unchanged.
The app metadata now describes the product instead of the development stack.

Checks: lint and TypeScript; HTTP 200 and expected content from `/`, `/auth/login`
and `/auth/signup`. Browser screenshot verification was blocked by the local Chrome
GPU/process environment; manually review the page at desktop and mobile widths.

```powershell
git add -- src/app/page.tsx src/app/home.module.css src/app/layout.tsx src/app/auth/AuthForm.tsx src/app/auth/login/page.tsx src/app/auth/signup/page.tsx docs/homepage.md
git commit -m "feat(home): build English marketing landing page"
```
