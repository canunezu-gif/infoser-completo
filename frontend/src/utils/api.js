const API_URL =
  process.env.NODE_ENV === 'production'
    ? 'https://infoser-backend.onrender.com'
    : (process.env.REACT_APP_API_URL || 'http://localhost:5000');

/** Normaliza la ruta y asegura prefijo /api cuando corresponda */
function normalizeUrl(path) {
  if (!path) return `${API_URL}/api`;
  if (/^https?:\/\//i.test(path)) return path;
  const p = path.startsWith('/api')
    ? path
    : `/api${path.startsWith('/') ? path : `/${path}`}`;
  return `${API_URL}${p}`;
}

/** Construye una URL con query params */
function withQuery(path, params) {
  if (!params || typeof params !== 'object') return normalizeUrl(path);
  const url = new URL(normalizeUrl(path));
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    if (Array.isArray(v)) v.forEach((vv) => url.searchParams.append(k, vv));
    else url.searchParams.set(k, String(v));
  });
  return url.toString();
}

/**
 * raw(path, options)
 * options:
 *   - method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
 *   - body: object | FormData (si es FormData NO se serializa)
 *   - headers: { ... }
 *   - auth: boolean (por defecto true)
 *   - query: objeto con query params
 *   - responseType: 'json' | 'text' | 'blob' (default: json)
 */
async function raw(path, options = {}) {
  const {
    auth = true,
    query,
    responseType = 'json',
    method = 'GET',
    headers: headersIn = {},
    body: bodyIn,
    ...rest
  } = options;

  const isFormData =
    typeof FormData !== 'undefined' && bodyIn instanceof FormData;

  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...headersIn,
  };

  if (auth !== false) {
    const token = localStorage.getItem('authToken');
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const url = query ? withQuery(path, query) : normalizeUrl(path);

  const fetchOpts = {
    method,
    headers,
    ...rest,
  };

  if (bodyIn !== undefined) {
    fetchOpts.body = isFormData
      ? bodyIn
      : typeof bodyIn === 'object'
        ? JSON.stringify(bodyIn)
        : bodyIn;
  }

  const res = await fetch(url, fetchOpts);

  let data;
  try {
    if (responseType === 'blob') data = await res.blob();
    else if (responseType === 'text') data = await res.text();
    else {
      const txt = await res.text();
      data = txt ? JSON.parse(txt) : null;
    }
  } catch {
    data = null;
  }

  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
    }
    const message =
      (data && data.message) ||
      (typeof data === 'string' && data) ||
      `${res.status} ${res.statusText}`;
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

export async function apiFetch(path, options = {}) {
  return raw(path, options);
}

// Azúcar sintáctico (JSON)
export const api = {
  get: (path, opts) => raw(path, { ...(opts || {}), method: 'GET' }),
  post: (path, body, opts) =>
    raw(path, { ...(opts || {}), method: 'POST', body }),
  put: (path, body, opts) =>
    raw(path, { ...(opts || {}), method: 'PUT', body }),
  patch: (path, body, opts) =>
    raw(path, { ...(opts || {}), method: 'PATCH', body }),
  del: (path, opts) =>
    raw(path, { ...(opts || {}), method: 'DELETE' }),

  // No auth
  getNoAuth: (path, opts) =>
    raw(path, { ...(opts || {}), method: 'GET', auth: false }),
  postNoAuth: (path, body, opts) =>
    raw(path, { ...(opts || {}), method: 'POST', body, auth: false }),

  // FormData
  postForm: (path, formData, opts) =>
    raw(path, { ...(opts || {}), method: 'POST', body: formData }),
  putForm: (path, formData, opts) =>
    raw(path, { ...(opts || {}), method: 'PUT', body: formData }),
  patchForm: (path, formData, opts) =>
    raw(path, { ...(opts || {}), method: 'PATCH', body: formData }),

  // Descargas
  getBlob: (path, opts) =>
    raw(path, {
      ...(opts || {}),
      method: 'GET',
      responseType: 'blob',
    }),
  getText: (path, opts) =>
    raw(path, {
      ...(opts || {}),
      method: 'GET',
      responseType: 'text',
    }),
};

export { API_URL, withQuery, normalizeUrl };
export default apiFetch;
