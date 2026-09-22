# Team selection replacement

## Database setup (required before deploying this change)

Run `supabase/migrations/202609220001_replace_user_teams.sql` in the Supabase SQL
editor. For a fresh database, apply `supabase/schema.sql` first, then migrations.
The migration is repeatable and includes the current app team catalog, read access
to the signed-in user's selections, and a transactional replacement function.
It does not remove existing selections during installation.

Writes from browser clients now go through `replace_user_teams`. The function
derives the user ID from the authenticated session, validates 1–3 distinct known
teams and serializes concurrent saves for that account. Delete and insert occur
in one transaction; a database error rolls them both back. Direct authenticated
table writes are revoked to prevent bypassing the limit.

Deploy the matching app after the migration. Older app versions use direct writes
and will no longer be able to save teams after those permissions are revoked.

## Behaviour

- Teams loads persisted selections from the signed-in account, not local storage.
- Failed loads show a retry screen instead of an editable empty list.
- Saving replaces the whole shortlist, so removed teams do not return.
- Invalid, empty and oversized selections return 400 instead of being truncated.
- Old lists with more than three teams remain visible for correction; remove
  teams until 1–3 remain, then save. Unavailable IDs are omitted with a warning.
- Selection controls and Save are locked while saving or animating a team addition.
- Saving teams does not trigger AI research. Newly selected teams need a research
  refresh to populate their dashboard details.

## Validation

Run `node --test tests/team-selection.test.mjs`, `npm run lint`, and `npx tsc --noEmit`.
The route tests mock Supabase; they do not execute the PostgreSQL migration.

After applying the migration, verify with two test accounts:

1. Save three teams, reload Teams, and confirm the same three are selected.
2. Replace one team, save, and check both Teams and Dashboard.
3. Sign into the other account and confirm the lists remain separate.
4. Try four distinct IDs, unknown IDs, and an empty list; no selection should change.
5. Save different shortlists from two tabs concurrently; the final list should be
   one complete shortlist, never a combination.
6. Force an insert failure in a test database and verify the previous list survives.

## Commit

```powershell
git add -- src/app/api/onboarding/route.ts src/app/onboarding/page.tsx src/lib/teams.ts supabase/migrations/202609220001_replace_user_teams.sql tests/team-selection.test.mjs docs/team-selection-setup.md
git commit -m "fix(teams): persist and replace team selections atomically"
```
