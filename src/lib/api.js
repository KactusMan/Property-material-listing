export const authHeaders = (headers = {}) => {
  const token = localStorage.getItem('pm_token');
  return {
    ...headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

export const apiFetch = async (url, options = {}) => {
  const response = await fetch(url, {
    ...options,
    headers: authHeaders(options.headers)
  });

  if (response.status === 401) {
    localStorage.removeItem('pm_token');
    localStorage.removeItem('pm_user');
  }

  return response;
};
