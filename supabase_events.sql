-- The Bridge 행사일정(Calendar) 테이블
-- Supabase 대시보드 > SQL Editor 에 붙여넣고 Run 하세요.

create table if not exists public.events (
    id         bigint generated always as identity primary key,
    date       date not null,
    time       time,
    title      text not null,
    place      text,
    note       text,
    created_at timestamptz not null default now()
);

alter table public.events enable row level security;

-- 홈페이지(anon 키)에서 조회/등록/삭제를 허용합니다.
create policy "events_select" on public.events for select to anon using (true);
create policy "events_insert" on public.events for insert to anon with check (true);
create policy "events_delete" on public.events for delete to anon using (true);
