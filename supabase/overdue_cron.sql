-- Overdue-task emails, checked every hour from 8:00 AM to 6:00 PM Myanmar time
-- (01:30-11:30 UTC). Each overdue task is only emailed once, so hourly checks don't repeat emails.
-- 1. Database -> Extensions: enable "pg_cron" and "pg_net" (or run the two lines below).
-- 2. Replace PUT-YOUR-CRON-SECRET-HERE with the same text you saved as the CRON_SECRET secret.
-- 3. Run this in SQL Editor.
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.unschedule('overdue-reminders-daily')
where exists (select 1 from cron.job where jobname = 'overdue-reminders-daily');

select cron.schedule(
  'overdue-reminders-daily',
  '30 1-11 * * *',
  $$
  select net.http_post(
    url := 'https://orjjnfyuaoftlzdirbaa.supabase.co/functions/v1/overdue-reminders',
    headers := jsonb_build_object('Content-Type', 'application/json',
                                  'x-cron-secret', 'PUT-YOUR-CRON-SECRET-HERE'),
    body := '{}'::jsonb
  );
  $$
);
