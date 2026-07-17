// 统一请求层：阶段一由 MSW 拦截，阶段二切真实后端只需改这里的 BASE_URL。
const BASE_URL = '/api/v1';

export interface QueryParams {
  [key: string]: string | number | boolean | undefined | null;
}

function buildQuery(params?: QueryParams): string {
  if (!params) return '';
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') usp.append(k, String(v));
  });
  const s = usp.toString();
  return s ? `?${s}` : '';
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `请求失败：${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const http = {
  get: <T>(path: string, params?: QueryParams) =>
    fetch(`${BASE_URL}${path}${buildQuery(params)}`).then((r) => handle<T>(r)),

  post: <T>(path: string, body?: unknown) =>
    fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    }).then((r) => handle<T>(r)),

  put: <T>(path: string, body?: unknown) =>
    fetch(`${BASE_URL}${path}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    }).then((r) => handle<T>(r)),

  del: <T>(path: string) =>
    fetch(`${BASE_URL}${path}`, { method: 'DELETE' }).then((r) => handle<T>(r)),
};
