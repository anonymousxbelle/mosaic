-- Preparation only: requires a Supabase project. Review and test policies with two real accounts before activation.
-- Trusted server verifies provider IDs and registers canonical works. Browser users cannot create catalog truth.
create table public.catalog_works (
 id text primary key check(length(id) between 3 and 100),
 title text not null check(length(title) between 1 and 500),
 provider text not null,
 verified_at timestamptz not null default now()
);
alter table public.catalog_works enable row level security;
grant select on public.catalog_works to authenticated;
create policy "Read verified works" on public.catalog_works for select to authenticated using(true);
create table public.community_ratings (
 user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 work_id text not null references public.catalog_works(id),
 rating smallint not null check(rating between 1 and 5),
 consent boolean not null default false,
 updated_at timestamptz not null default now(),
 primary key(user_id,work_id)
);
alter table public.community_ratings enable row level security;
grant select,insert,update,delete on public.community_ratings to authenticated;
create policy "Own ratings only" on public.community_ratings for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
-- Shared rating rows are not exposed to other users. A trusted aggregate service runs the similarity algorithm.
create table public.community_feedback (
 id bigint generated always as identity primary key,
 user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 work_id text not null references public.catalog_works(id),
 related_id text references public.catalog_works(id),
 kind text not null check(kind in ('good-match','not-for-me','incorrect-tag','incorrect-content-rating','incorrect-details','suggest-similar')),
 reason text not null default '' check(length(reason)<=280),
 status text not null default 'pending' check(status in ('pending','approved','rejected')),
 created_at timestamptz not null default now(),
 check(related_id is null or related_id<>work_id),
 check(kind<>'suggest-similar' or related_id is not null)
);
create unique index feedback_once on public.community_feedback(user_id,work_id,coalesce(related_id,''),kind);
alter table public.community_feedback enable row level security;
grant select,insert,delete on public.community_feedback to authenticated;
create policy "Read own reports" on public.community_feedback for select to authenticated using(user_id=auth.uid());
create policy "Submit pending reports" on public.community_feedback for insert to authenticated with check(user_id=auth.uid() and status='pending');
create policy "Withdraw own reports" on public.community_feedback for delete to authenticated using(user_id=auth.uid());
-- Only the trusted moderation service may approve, reject or update submissions.
create table public.community_submission_log(user_id uuid not null,at timestamptz not null default now());
alter table public.community_submission_log enable row level security;
create index submission_window on public.community_submission_log(user_id,at);
create function public.limit_community_submission() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if auth.uid() is null or new.user_id<>auth.uid() then raise exception 'Sign in required'; end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
 if (select count(*) from public.community_submission_log where user_id=auth.uid() and at>now()-interval '1 minute')>=10 then raise exception 'Please wait before contributing again';end if;
 insert into public.community_submission_log(user_id) values(auth.uid());
 if tg_table_name='community_ratings' then new.updated_at=now();else new.created_at=now();end if;
 return new;
end;$$;
revoke all on function public.limit_community_submission() from public;
create trigger rating_limit before insert or update on public.community_ratings for each row execute function public.limit_community_submission();
create trigger feedback_limit before insert on public.community_feedback for each row execute function public.limit_community_submission();
