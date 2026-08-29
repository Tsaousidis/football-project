-- Team catalog
create table if not exists public.teams (
  id text primary key,
  name text not null,
  short_name text,
  country text,
  competition text,
  accent_color text,
  created_at timestamptz default now()
);

-- User-selected teams
create table if not exists public.user_teams (
  user_id text not null,
  team_id text not null,
  created_at timestamptz default now(),
  primary key (user_id, team_id),
  constraint user_teams_team_fk foreign key (team_id) references public.teams(id) on delete cascade
);

-- Matches snapshot data
create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  team_id text not null,
  opponent_name text not null,
  competition text,
  venue text,
  match_date timestamptz,
  kickoff_time text,
  is_home boolean,
  status text default 'scheduled',
  created_at timestamptz default now(),
  constraint matches_team_fk foreign key (team_id) references public.teams(id) on delete cascade
);

-- Standings snapshot data
create table if not exists public.standings (
  id uuid primary key default gen_random_uuid(),
  team_id text not null,
  competition text not null,
  position integer,
  points integer default 0,
  played integer default 0,
  wins integer default 0,
  draws integer default 0,
  losses integer default 0,
  goal_difference integer default 0,
  updated_at timestamptz default now(),
  constraint standings_team_fk foreign key (team_id) references public.teams(id) on delete cascade
);

-- AI-generated stories
create table if not exists public.stories (
  id uuid primary key default gen_random_uuid(),
  team_id text not null,
  title text not null,
  summary text,
  category text,
  importance text,
  source_count integer default 0,
  published_at timestamptz,
  created_at timestamptz default now(),
  constraint stories_team_fk foreign key (team_id) references public.teams(id) on delete cascade
);

-- Source references for each story
create table if not exists public.story_sources (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null,
  source_name text not null,
  source_url text,
  created_at timestamptz default now(),
  constraint story_sources_story_fk foreign key (story_id) references public.stories(id) on delete cascade
);

create index if not exists idx_user_teams_user_id on public.user_teams(user_id);
create index if not exists idx_matches_team_id on public.matches(team_id);
create index if not exists idx_standings_team_id on public.standings(team_id);
create index if not exists idx_stories_team_id on public.stories(team_id);
