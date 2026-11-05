const getToken = () => localStorage.getItem('medisync_auth_token');

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    const text = await response.text();
    throw new Error(`Server returned non-JSON response: ${text.slice(0, 100)}...`);
  }

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'API request failed');
  }

  return data;
}

export const api = {
  get: (endpoint: string) => apiRequest(endpoint, { method: 'GET' }),
  post: (endpoint: string, body: any) => apiRequest(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  put: (endpoint: string, body: any) => apiRequest(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (endpoint: string) => apiRequest(endpoint, { method: 'DELETE' }),
};
