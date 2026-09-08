declare const Deno: {
  env: { get(key: string): string | undefined };
  serve(handler: (request: Request) => Response | Promise<Response>): void;
};

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const sendPushFunctionUrl = Deno.env.get('SEND_PUSH_NOTIFICATION_URL');
const functionSecret = Deno.env.get('PHASE7_FUNCTION_SECRET');

type Reminder = {
  id: string;
};

type CreatedNotification = {
  id: string;
  user_id: string;
  title: string;
  body: string;
  related_entity_type: string | null;
  related_entity_id: string | null;
};

Deno.serve(async (request) => {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  if (!supabaseUrl || !serviceRoleKey) {
    return json({ error: 'Server is not configured for reminder processing.' }, 500);
  }

  if (functionSecret && request.headers.get('x-phase7-secret') !== functionSecret) {
    return json({ error: 'Unauthorized' }, 401);
  }

  const reminders = await supabaseRequest<Reminder[]>(
    "/rest/v1/appointment_reminders?status=eq.pending&remind_at=lte.now()&select=id&order=remind_at.asc&limit=50"
  );
  const results = [];

  for (const reminder of reminders) {
    const notification = await supabaseRequest<CreatedNotification[]>(
      '/rest/v1/rpc/create_due_reminder_notification',
      {
        body: JSON.stringify({ reminder_uuid: reminder.id }),
        method: 'POST',
      }
    );
    const created = Array.isArray(notification) ? notification[0] : notification;

    if (!created?.id) {
      results.push({ reminder_id: reminder.id, status: 'skipped' });
      continue;
    }

    if (sendPushFunctionUrl) {
      const pushResponse = await fetch(sendPushFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(functionSecret ? { 'x-phase7-secret': functionSecret } : {}),
        },
        body: JSON.stringify({
          body: created.body,
          data: {
            related_entity_id: created.related_entity_id,
            related_entity_type: created.related_entity_type,
          },
          notification_id: created.id,
          title: created.title,
          user_id: created.user_id,
        }),
      });

      await supabaseRequest(`/rest/v1/appointment_reminders?id=eq.${reminder.id}`, {
        body: JSON.stringify({
          processed_at: new Date().toISOString(),
          status: pushResponse.ok ? 'sent' : 'failed',
        }),
        method: 'PATCH',
        prefer: 'return=minimal',
      });

      results.push({
        notification_id: created.id,
        reminder_id: reminder.id,
        status: pushResponse.ok ? 'sent' : 'failed',
      });
    } else {
      results.push({
        notification_id: created.id,
        reminder_id: reminder.id,
        status: 'in_app_created',
      });
    }
  }

  return json({ processed: results.length, results });
});

async function supabaseRequest<T = unknown>(
  path: string,
  init: {
    body?: string;
    method?: string;
    prefer?: string;
  } = {}
): Promise<T> {
  const response = await fetch(`${supabaseUrl}${path}`, {
    method: init.method ?? 'GET',
    headers: {
      apikey: serviceRoleKey!,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
      ...(init.prefer ? { Prefer: init.prefer } : {}),
    },
    body: init.body,
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json();
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json' },
    status,
  });
}
