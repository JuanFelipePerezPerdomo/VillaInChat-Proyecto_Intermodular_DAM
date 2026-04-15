-- ─────────────────────────────────────────────────────────────────────────────
-- Trigger: llama a la edge function `send-mention-notification` cada vez que
-- se inserta una fila en la tabla `mentions`.
--
-- Requisitos previos (ejecutar UNA VEZ en el proyecto Supabase):
--
--   1. Asegúrate de que la extensión pg_net está habilitada:
--        Database → Extensions → pg_net → Enable
--
--   2. Guarda tu URL y service role key como configuración de Postgres:
--        alter database postgres
--          set "app.settings.supabase_url"        = 'https://<project-ref>.supabase.co';
--        alter database postgres
--          set "app.settings.service_role_key"    = '<service-role-key>';
--      (Hazlo desde el SQL Editor del dashboard, no en producción en texto plano;
--       preferiblemente usa Vault o lo mismo via supabase CLI secrets.)
-- ─────────────────────────────────────────────────────────────────────────────

-- Función que dispara la notificación
create or replace function public.notify_mention_push()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    perform net.http_post(
        url     := current_setting('app.settings.supabase_url')
                    || '/functions/v1/send-mention-notification',
        headers := jsonb_build_object(
            'Content-Type',  'application/json',
            'Authorization', 'Bearer '
                || current_setting('app.settings.service_role_key')
        ),
        body    := to_jsonb(NEW)
    );
    return NEW;
end;
$$;

-- Trigger sobre la tabla mentions
drop trigger if exists on_mention_insert on public.mentions;

create trigger on_mention_insert
    after insert on public.mentions
    for each row
    execute function public.notify_mention_push();
