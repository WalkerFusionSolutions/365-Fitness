declare const Deno: {
  env: { get(key: string): string | undefined };
  serve(handler: (request: Request) => Response | Promise<Response>): void;
};

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const functionSecret = Deno.env.get('PHASE7_FUNCTION_SECRET');

type PushRequest = {
  body: string;
  data?: Record<string, unknown>;
  notification_id?: string;
  title: string;
  user_id: string;
};

Deno.serve(async (request) => {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  if (!supabaseUrl || !serviceRoleKey) {
    return json({ error: 'Server is not configured for push delivery.' }, 500);
  }

  if (functionSecret && request.headers.get('x-phase7-secret') !== functionSecret) {
    return json({ error: 'Unauthorized' }, 401);
  }

  const payload = (await request.json()) as PushRequest;
  if (!payload.user_id || !payload.title || !payload.body) {
    return json({ error: 'Missing push notification payload.' }, 400);
  }

  const devices = await supabaseRequest<{
    id: string;
    expo_push_token: string;
  }[]>(`/rest/v1/push_devices?user_id=eq.${payload.user_id}&is_active=eq.true&select=id,expo_push_token`);

  if (devices.length === 0) {
    return json({ sent: 0 });
  }

  const messages = devices.map((device) => ({
    to: device.expo_push_token,
    sound: 'default',
    title: payload.title,
    body: payload.body,
    data: {
      notification_id: payload.notification_id,
      ...payload.data,
    },
  }));

  const expoResponse = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-Encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(messages),
  });

  const result = await expoResponse.json();
  const tickets = Array.isArray(result?.data) ? result.data : [];
  const invalidDeviceIds = devices
    .filter((device, index) => {
      const ticket = tickets[index];
      return ticket?.status === 'error' && ticket?.details?.error === 'DeviceNotRegistered';
    })
    .map((device) => device.id);

  if (invalidDeviceIds.length > 0) {
    await supabaseRequest('/rest/v1/push_devices?id=in.(' + invalidDeviceIds.join(',') + ')', {
      body: JSON.stringify({ is_active: false, updated_at: new Date().toISOString() }),
      method: 'PATCH',
      prefer: 'return=minimal',
    });
  }

  return json({ result, sent: messages.length });
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
