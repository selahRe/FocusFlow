const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

const buildQuery = (params = {}) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, String(value));
    }
  });
  const qs = search.toString();
  return qs ? `?${qs}` : '';
};

const request = async (path, options = {}) => {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  if (!res.ok) {
    const message = await res.text();
    const error = new Error(message || 'Request failed');
    error.status = res.status;
    throw error;
  }

  return res.json();
};

const entities = {
  Task: {
    list: (order, limit) => request(`/api/tasks${buildQuery({ order, limit })}`),
    filter: async (filter = {}, order, limit) => {
      if (filter.id) {
        const item = await request(`/api/tasks/${filter.id}`);
        return item ? [item] : [];
      }
      return request(`/api/tasks${buildQuery({ ...filter, order, limit })}`);
    },
    create: (data) => request('/api/tasks', { method: 'POST', body: data }),
    update: (id, data) => request(`/api/tasks/${id}`, { method: 'PUT', body: data }),
    delete: (id) => request(`/api/tasks/${id}`, { method: 'DELETE' })
  },
  HabitAnchor: {
    list: (order, limit) => request(`/api/habit-anchors${buildQuery({ order, limit })}`),
    create: (data) => request('/api/habit-anchors', { method: 'POST', body: data }),
    update: (id, data) => request(`/api/habit-anchors/${id}`, { method: 'PUT', body: data }),
    delete: (id) => request(`/api/habit-anchors/${id}`, { method: 'DELETE' })
  },
  HabitLog: {
    list: (order, limit) => request(`/api/habit-logs${buildQuery({ order, limit })}`),
    filter: async (filter = {}, order, limit) => {
      if (filter.id) {
        const item = await request(`/api/habit-logs/${filter.id}`);
        return item ? [item] : [];
      }
      return request(`/api/habit-logs${buildQuery({ ...filter, order, limit })}`);
    },
    create: (data) => request('/api/habit-logs', { method: 'POST', body: data }),
    update: (id, data) => request(`/api/habit-logs/${id}`, { method: 'PUT', body: data }),
    delete: (id) => request(`/api/habit-logs/${id}`, { method: 'DELETE' })
  },
  MonthGoal: {
    list: (order, limit) => request(`/api/month-goals${buildQuery({ order, limit })}`),
    filter: async (filter = {}, order, limit) => {
      if (filter.id) {
        const item = await request(`/api/month-goals/${filter.id}`);
        return item ? [item] : [];
      }
      return request(`/api/month-goals${buildQuery({ ...filter, order, limit })}`);
    },
    create: (data) => request('/api/month-goals', { method: 'POST', body: data }),
    update: (id, data) => request(`/api/month-goals/${id}`, { method: 'PUT', body: data }),
    delete: (id) => request(`/api/month-goals/${id}`, { method: 'DELETE' })
  },
  UserPreference: {
    list: (order, limit) => request(`/api/user-preferences${buildQuery({ order, limit })}`),
    create: (data) => request('/api/user-preferences', { method: 'POST', body: data }),
    update: (id, data) => request(`/api/user-preferences/${id}`, { method: 'PUT', body: data })
  },
  DailyStats: {
    list: (order, limit) => request(`/api/daily-stats${buildQuery({ order, limit })}`),
    filter: (filter = {}, order, limit) => request(`/api/daily-stats${buildQuery({ ...filter, order, limit })}`),
    create: (data) => request('/api/daily-stats', { method: 'POST', body: data }),
    update: (id, data) => request(`/api/daily-stats/${id}`, { method: 'PUT', body: data })
  },
  FocusSession: {
    list: (order, limit) => request(`/api/focus-sessions${buildQuery({ order, limit })}`),
    create: (data) => request('/api/focus-sessions', { method: 'POST', body: data })
  }
};

const integrations = {
  Core: {
    InvokeLLM: (payload) => request('/api/llm', { method: 'POST', body: payload })
  }
};

const agents = {
  createConversation: (payload) => request('/api/conversations', { method: 'POST', body: payload }),
  getConversation: (id) => request(`/api/conversations/${id}`),
  addMessage: (conversation, payload) => request(`/api/conversations/${conversation.id}/messages`, { method: 'POST', body: payload }),
  subscribeToConversation: () => () => {}
};

const auth = {
  me: async () => ({ id: 'local-user', role: 'user', name: 'Local User' }),
  logout: () => {},
  redirectToLogin: () => {}
};

const appLogs = {
  logUserInApp: () => Promise.resolve()
};

export const localApi = {
  entities,
  integrations,
  agents,
  auth,
  appLogs
};
