-- Apply after schema.sql. Safe to reapply. Existing selections are retained until saved.
begin;

insert into public.teams (id, name, short_name, country, competition, accent_color) values
('paok', 'PAOK', 'PAOK', 'Greece', 'Super League', '#1e3a8a'),
('ael', 'AEL', 'AEL', 'Greece', 'Super League', '#b91c1c'),
('aek', 'AEK Athens', 'AEK', 'Greece', 'Super League', '#0ea5e9'),
('aris', 'Aris', 'ARI', 'Greece', 'Super League', '#facc15'),
('asteras-tripolis', 'Asteras Tripolis', 'AST', 'Greece', 'Super League', '#facc15'),
('atromitos', 'Atromitos', 'ATR', 'Greece', 'Super League', '#22d3ee'),
('kifisia', 'Kifisia', 'KIF', 'Greece', 'Super League', '#16a34a'),
('levadiakos', 'Levadiakos', 'LEV', 'Greece', 'Super League', '#15803d'),
('olympiacos', 'Olympiacos', 'OLY', 'Greece', 'Super League', '#f59e0b'),
('ofi', 'OFI', 'OFI', 'Greece', 'Super League', '#111827'),
('panetolikos', 'Panetolikos', 'PAN', 'Greece', 'Super League', '#facc15'),
('panathinaikos', 'Panathinaikos', 'PAN', 'Greece', 'Super League', '#22c55e'),
('panserraikos', 'Panserraikos', 'PAN', 'Greece', 'Super League', '#dc2626'),
('volos', 'Volos', 'VOL', 'Greece', 'Super League', '#dc2626'),
('aston-villa', 'Aston Villa', 'AVL', 'England', 'Premier League', '#7c3aed'),
('bournemouth', 'Bournemouth', 'BOU', 'England', 'Premier League', '#dc2626'),
('brentford', 'Brentford', 'BRE', 'England', 'Premier League', '#dc2626'),
('brighton', 'Brighton', 'BRI', 'England', 'Premier League', '#2563eb'),
('burnley', 'Burnley', 'BUR', 'England', 'Premier League', '#7f1d1d'),
('liverpool', 'Liverpool', 'LIV', 'England', 'Premier League', '#c8102e'),
('crystal-palace', 'Crystal Palace', 'CRY', 'England', 'Premier League', '#1d4ed8'),
('everton', 'Everton', 'EVE', 'England', 'Premier League', '#1d4ed8'),
('fulham', 'Fulham', 'FUL', 'England', 'Premier League', '#f8fafc'),
('leeds', 'Leeds United', 'LEE', 'England', 'Premier League', '#f8fafc'),
('arsenal', 'Arsenal', 'ARS', 'England', 'Premier League', '#ef4444'),
('chelsea', 'Chelsea', 'CHE', 'England', 'Premier League', '#1d4ed8'),
('man-city', 'Manchester City', 'MCI', 'England', 'Premier League', '#6ee7b7'),
('manchester-united', 'Manchester United', 'MUN', 'England', 'Premier League', '#dc2626'),
('newcastle', 'Newcastle United', 'NEW', 'England', 'Premier League', '#f8fafc'),
('nottingham-forest', 'Nottingham Forest', 'NFO', 'England', 'Premier League', '#dc2626'),
('sunderland', 'Sunderland', 'SUN', 'England', 'Premier League', '#dc2626'),
('tottenham', 'Tottenham Hotspur', 'TOT', 'England', 'Premier League', '#f8fafc'),
('west-ham', 'West Ham United', 'WHU', 'England', 'Premier League', '#7c2d12'),
('wolverhampton', 'Wolverhampton Wanderers', 'WOL', 'England', 'Premier League', '#f59e0b'),
('augsburg', 'Augsburg', 'FCA', 'Germany', 'Bundesliga', '#dc2626'),
('borussia-dortmund', 'Borussia Dortmund', 'BVB', 'Germany', 'Bundesliga', '#f3b30d'),
('bayern-munich', 'Bayern Munich', 'BAY', 'Germany', 'Bundesliga', '#e11d48'),
('werder-bremen', 'Werder Bremen', 'SVW', 'Germany', 'Bundesliga', '#16a34a'),
('eintracht-frankfurt', 'Eintracht Frankfurt', 'SGE', 'Germany', 'Bundesliga', '#dc2626'),
('freiburg', 'Freiburg', 'SCF', 'Germany', 'Bundesliga', '#dc2626'),
('hamburg', 'Hamburg', 'HSV', 'Germany', 'Bundesliga', '#2563eb'),
('heidenheim', 'Heidenheim', 'HDH', 'Germany', 'Bundesliga', '#dc2626'),
('hoffenheim', 'Hoffenheim', 'TSG', 'Germany', 'Bundesliga', '#2563eb'),
('koln', 'Koln', 'KOE', 'Germany', 'Bundesliga', '#dc2626'),
('mainz', 'Mainz 05', 'M05', 'Germany', 'Bundesliga', '#dc2626'),
('borussia-monchengladbach', 'Borussia Monchengladbach', 'BMG', 'Germany', 'Bundesliga', '#f8fafc'),
('rb-leipzig', 'RB Leipzig', 'RBL', 'Germany', 'Bundesliga', '#f97316'),
('bayer-leverkusen', 'Bayer Leverkusen', 'LEV', 'Germany', 'Bundesliga', '#84cc16'),
('st-pauli', 'St. Pauli', 'STP', 'Germany', 'Bundesliga', '#78350f'),
('stuttgart', 'VfB Stuttgart', 'VFB', 'Germany', 'Bundesliga', '#f8fafc'),
('union-berlin', 'Union Berlin', 'FCU', 'Germany', 'Bundesliga', '#dc2626'),
('wolfsburg', 'Wolfsburg', 'WOB', 'Germany', 'Bundesliga', '#65a30d'),
('alaves', 'Alaves', 'ALA', 'Spain', 'LaLiga', '#2563eb'),
('athletic-bilbao', 'Athletic Bilbao', 'ATH', 'Spain', 'LaLiga', '#dc2626'),
('real-madrid', 'Real Madrid', 'RMA', 'Spain', 'LaLiga', '#f1f5f9'),
('barcelona', 'Barcelona', 'BAR', 'Spain', 'LaLiga', '#0f766e'),
('atletico-madrid', 'Atletico Madrid', 'ATM', 'Spain', 'LaLiga', '#f43f5e'),
('celta-vigo', 'Celta Vigo', 'CEL', 'Spain', 'LaLiga', '#38bdf8'),
('elche', 'Elche', 'ELC', 'Spain', 'LaLiga', '#16a34a'),
('espanyol', 'Espanyol', 'ESP', 'Spain', 'LaLiga', '#2563eb'),
('getafe', 'Getafe', 'GET', 'Spain', 'LaLiga', '#2563eb'),
('girona', 'Girona', 'GIR', 'Spain', 'LaLiga', '#dc2626'),
('mallorca', 'Mallorca', 'MLL', 'Spain', 'LaLiga', '#dc2626'),
('rayo-vallecano', 'Rayo Vallecano', 'RAY', 'Spain', 'LaLiga', '#dc2626'),
('real-sociedad', 'Real Sociedad', 'RSO', 'Spain', 'LaLiga', '#facc15'),
('osasuna', 'Osasuna', 'OSA', 'Spain', 'LaLiga', '#dc2626'),
('real-betis', 'Real Betis', 'BET', 'Spain', 'LaLiga', '#16a34a'),
('sevilla', 'Sevilla', 'SEV', 'Spain', 'LaLiga', '#dc2626'),
('valencia', 'Valencia', 'VAL', 'Spain', 'LaLiga', '#f59e0b'),
('villarreal', 'Villarreal', 'VIL', 'Spain', 'LaLiga', '#facc15'),
('levante', 'Levante', 'LEV', 'Spain', 'LaLiga', '#2563eb'),
('oviedo', 'Real Oviedo', 'OVI', 'Spain', 'LaLiga', '#2563eb'),
('atalanta', 'Atalanta', 'ATA', 'Italy', 'Serie A', '#2563eb'),
('inter', 'Inter Milan', 'INT', 'Italy', 'Serie A', '#0f172a'),
('juventus', 'Juventus', 'JUV', 'Italy', 'Serie A', '#f8fafc'),
('ac-milan', 'AC Milan', 'MIL', 'Italy', 'Serie A', '#dc2626'),
('bologna', 'Bologna', 'BOL', 'Italy', 'Serie A', '#dc2626'),
('cagliari', 'Cagliari', 'CAG', 'Italy', 'Serie A', '#dc2626'),
('como', 'Como', 'COM', 'Italy', 'Serie A', '#38bdf8'),
('cremonese', 'Cremonese', 'CRE', 'Italy', 'Serie A', '#dc2626'),
('fiorentina', 'Fiorentina', 'FIO', 'Italy', 'Serie A', '#7c3aed'),
('genoa', 'Genoa', 'GEN', 'Italy', 'Serie A', '#dc2626'),
('lazio', 'Lazio', 'LAZ', 'Italy', 'Serie A', '#38bdf8'),
('napoli', 'Napoli', 'NAP', 'Italy', 'Serie A', '#3b82f6'),
('lecce', 'Lecce', 'LEC', 'Italy', 'Serie A', '#facc15'),
('parma', 'Parma', 'PAR', 'Italy', 'Serie A', '#7c3aed'),
('pisa', 'Pisa', 'PIS', 'Italy', 'Serie A', '#2563eb'),
('roma', 'Roma', 'ROM', 'Italy', 'Serie A', '#f59e0b'),
('sassuolo', 'Sassuolo', 'SAS', 'Italy', 'Serie A', '#16a34a'),
('torino', 'Torino', 'TOR', 'Italy', 'Serie A', '#dc2626'),
('udinese', 'Udinese', 'UDI', 'Italy', 'Serie A', '#f8fafc'),
('verona', 'Verona', 'VER', 'Italy', 'Serie A', '#facc15'),
('alverca', 'Alverca', 'ALV', 'Portugal', 'Primeira Liga', '#dc2626'),
('avs', 'AVS', 'AVS', 'Portugal', 'Primeira Liga', '#facc15'),
('arouca', 'Arouca', 'ARO', 'Portugal', 'Primeira Liga', '#facc15'),
('benfica', 'Benfica', 'BEN', 'Portugal', 'Primeira Liga', '#e11d48'),
('casa-pia', 'Casa Pia', 'CPI', 'Portugal', 'Primeira Liga', '#111827'),
('estoril', 'Estoril', 'EST', 'Portugal', 'Primeira Liga', '#facc15'),
('estrela-amadora', 'Estrela Amadora', 'EST', 'Portugal', 'Primeira Liga', '#f8fafc'),
('famalicao', 'Famalicao', 'FAM', 'Portugal', 'Primeira Liga', '#2563eb'),
('gil-vicente', 'Gil Vicente', 'GIL', 'Portugal', 'Primeira Liga', '#dc2626'),
('moreirense', 'Moreirense', 'MOR', 'Portugal', 'Primeira Liga', '#16a34a'),
('nacional', 'Nacional', 'NAC', 'Portugal', 'Primeira Liga', '#111827'),
('porto', 'Porto', 'POR', 'Portugal', 'Primeira Liga', '#fbbf24'),
('rio-ave', 'Rio Ave', 'RIO', 'Portugal', 'Primeira Liga', '#16a34a'),
('sporting-cp', 'Sporting CP', 'SPO', 'Portugal', 'Primeira Liga', '#22c55e'),
('santa-clara', 'Santa Clara', 'SAN', 'Portugal', 'Primeira Liga', '#dc2626'),
('tondela', 'Tondela', 'TON', 'Portugal', 'Primeira Liga', '#facc15'),
('vitoria-guimaraes', 'Vitoria Guimaraes', 'VIT', 'Portugal', 'Primeira Liga', '#111827'),
('braga', 'Braga', 'BRA', 'Portugal', 'Primeira Liga', '#f97316')
on conflict (id) do update set name = excluded.name, short_name = excluded.short_name,
  country = excluded.country, competition = excluded.competition, accent_color = excluded.accent_color;

alter table public.user_teams enable row level security;
drop policy if exists "Users can read their own teams" on public.user_teams;
create policy "Users can read their own teams" on public.user_teams
  for select to authenticated using (auth.uid()::text = user_id);
-- Browser clients must use the transaction below for writes.
revoke all on public.user_teams from public, anon, authenticated;
grant select on public.user_teams to authenticated;

create or replace function public.replace_user_teams(selected_team_ids text[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id text := auth.uid()::text;
  normalized_ids text[];
begin
  if current_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if selected_team_ids is null or array_position(selected_team_ids, null) is not null then
    raise exception 'Invalid team selection' using errcode = '22023';
  end if;
  select array_agg(distinct id) into normalized_ids from unnest(selected_team_ids) as ids(id);
  if coalesce(cardinality(normalized_ids), 0) not between 1 and 3 then
    raise exception 'Select between 1 and 3 teams' using errcode = '22023';
  end if;
  if exists (select 1 from unnest(normalized_ids) as ids(id)
    where not exists (select 1 from public.teams t where t.id = ids.id)) then
    raise exception 'Unknown team' using errcode = '22023';
  end if;
  -- Serialize saves for the same account, including when it has no rows yet.
  perform pg_advisory_xact_lock(hashtextextended(current_user_id, 0));
  delete from public.user_teams where user_id = current_user_id;
  insert into public.user_teams (user_id, team_id)
    select current_user_id, id from unnest(normalized_ids) as ids(id);
end;
$$;
revoke all on function public.replace_user_teams(text[]) from public, anon;
grant execute on function public.replace_user_teams(text[]) to authenticated;
commit;
