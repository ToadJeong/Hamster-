-- 0014: 햄스터 상품 추천 게시판 (링크 미리보기)

create table if not exists public.product_posts (
  id          uuid primary key default gen_random_uuid(),
  author_id   uuid references public.profiles(id) on delete cascade,
  title       text not null,
  url         text,                 -- 상품 링크 (선택)
  image_url   text,                 -- 미리보기/대표 이미지
  price       text,                 -- 자유 형식 (예: ₩12,900)
  category    text not null default 'etc' check (category in ('cage','food','wheel','bedding','toy','sand','etc')),
  description text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  view_count  int not null default 0
);
create index if not exists product_posts_created_idx  on public.product_posts (created_at desc);
create index if not exists product_posts_category_idx on public.product_posts (category, created_at desc);

alter table public.product_posts enable row level security;
create policy "products readable" on public.product_posts for select using (true);
create policy "products insert by author" on public.product_posts
  for insert with check (auth.uid() = author_id);
create policy "products update by author" on public.product_posts
  for update using (auth.uid() = author_id) with check (auth.uid() = author_id);
create policy "products delete by author or staff" on public.product_posts
  for delete using (auth.uid() = author_id or public.is_staff());

drop trigger if exists product_posts_touch on public.product_posts;
create trigger product_posts_touch before update on public.product_posts
  for each row execute function public.touch_updated_at();

-- 좋아요(추천)
create table if not exists public.product_likes (
  product_id uuid not null references public.product_posts(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (product_id, user_id)
);
alter table public.product_likes enable row level security;
create policy "product_likes readable" on public.product_likes for select using (true);
create policy "product_likes insert" on public.product_likes for insert with check (auth.uid() = user_id);
create policy "product_likes delete" on public.product_likes for delete using (auth.uid() = user_id);

-- 작성자/추천수 포함 피드 뷰
drop view if exists public.product_posts_feed;
create view public.product_posts_feed
with (security_invoker = on) as
select
  pp.*,
  p.username   as author_username,
  p.avatar_url as author_avatar_url,
  coalesce((select count(*) from public.product_likes l where l.product_id = pp.id), 0) as like_count
from public.product_posts pp
left join public.profiles p on p.id = pp.author_id;

-- 상품 이미지 버킷
insert into storage.buckets (id, name, public) values ('product-images','product-images',true)
on conflict (id) do nothing;
drop policy if exists "product-images readable"          on storage.objects;
drop policy if exists "product-images writable by owner" on storage.objects;
drop policy if exists "product-images deletable by owner" on storage.objects;
create policy "product-images readable" on storage.objects for select using (bucket_id='product-images');
create policy "product-images writable by owner" on storage.objects for insert
  with check (bucket_id='product-images' and auth.uid()::text=(storage.foldername(name))[1]);
create policy "product-images deletable by owner" on storage.objects for delete
  using (bucket_id='product-images' and auth.uid()::text=(storage.foldername(name))[1]);

-- 제보 자동반영을 위해 운영자(staff)가 가이드도 수정할 수 있도록 정책 추가
drop policy if exists "guides updatable by staff" on public.guides;
create policy "guides updatable by staff" on public.guides
  for update using (public.is_staff()) with check (true);
