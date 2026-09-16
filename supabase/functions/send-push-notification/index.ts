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

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_TITLE_LENGTH = 120;
const MAX_BODY_LENGTH = 500;
const MAX_DATA_BYTES = 4096;
const PUSH_REQUEST_KEYS = new Set([
  'body',
  'data',
  'notification_id',
  'title',
  'user_id',
]);

Deno.serve(async (request) => {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  if (!supabaseUrl || !serviceRoleKey || !functionSecret) {
    return json({ error: 'Server is not securely configured.' }, 500);
  }

  if (request.headers.get('x-phase7-secret') !== functionSecret) {
    return json({ error: 'Unauthorized' }, 401);
  }

  try {
    const rawPayload: unknown = await request.json();
    const payload = validatePushRequest(rawPayload);

    const query = new URLSearchParams({
      is_active: 'eq.true',
      select: 'id,expo_push_token',
      user_id: `eq.${payload.user_id}`,
    });
    const devices = await supabaseRequest<{
      id: string;
      expo_push_token: string;
    }[]>(`/rest/v1/push_devices?${query.toString()}`);

    if (devices.length === 0) {
      return json({ sent: 0 });
    }

    const messages = devices.map((device) => ({
      to: device.expo_push_token,
      sound: 'default',
      title: payload.title,
      body: payload.body,
      data: {
        ...payload.data,
        notification_id: payload.notification_id,
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

    if (!expoResponse.ok) {
      throw new Error('Push provider rejected the request.');
    }

    const result = await expoResponse.json();
    const tickets = Array.isArray(result?.data) ? result.data : [];
    const invalidDeviceIds = devices
      .filter((device, index) => {
        const ticket = tickets[index];
        return ticket?.status === 'error' && ticket?.details?.error === 'DeviceNotRegistered';
      })
      .map((device) => device.id);

    if (invalidDeviceIds.length > 0) {
      const invalidQuery = new URLSearchParams({
        id: `in.(${invalidDeviceIds.join(',')})`,
      });
      await supabaseRequest(`/rest/v1/push_devices?${invalidQuery.toString()}`, {
        body: JSON.stringify({ is_active: false, updated_at: new Date().toISOString() }),
        method: 'PATCH',
        prefer: 'return=minimal',
      });
    }

    return json({ result, sent: messages.length });
  } catch (error) {
    if (error instanceof RequestValidationError) {
      return json({ error: error.message }, 400);
    }

    console.error('Push notification delivery failed.');
    return json({ error: 'Unable to deliver push notifications.' }, 500);
  }
});

class RequestValidationError extends Error {}

function validatePushRequest(value: unknown): PushRequest {
  if (!isPlainObject(value)) {
    throw new RequestValidationError('Invalid push notification payload.');
  }

  if (Object.keys(value).some((key) => !PUSH_REQUEST_KEYS.has(key))) {
    throw new RequestValidationError('Push notification payload contains unsupported fields.');
  }

  const userId = requireUuid(value.user_id, 'user_id');
  const notificationId =
    value.notification_id === undefined
      ? undefined
      : requireUuid(value.notification_id, 'notification_id');
  const title = requireBoundedText(value.title, 'title', MAX_TITLE_LENGTH);
  const body = requireBoundedText(value.body, 'body', MAX_BODY_LENGTH);

  if (value.data !== undefined && !isPlainObject(value.data)) {
    throw new RequestValidationError('data must be a JSON object.');
  }

  const data = value.data as Record<string, unknown> | undefined;
  if (data && new TextEncoder().encode(JSON.stringify(data)).byteLength > MAX_DATA_BYTES) {
    throw new RequestValidationError('data is too large.');
  }

  return { body, data, notification_id: notificationId, title, user_id: userId };
}

function requireUuid(value: unknown, field: string) {
  if (typeof value !== 'string' || !UUID_PATTERN.test(value)) {
    throw new RequestValidationError(`${field} must be a valid UUID.`);
  }

  return value;
}

function requireBoundedText(value: unknown, field: string, maxLength: number) {
  if (typeof value !== 'string' || !value.trim() || value.length > maxLength) {
    throw new RequestValidationError(
      `${field} must be a non-empty string no longer than ${maxLength} characters.`
    );
  }

  return value.trim();
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

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
