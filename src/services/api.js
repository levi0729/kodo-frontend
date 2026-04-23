const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

let authToken = sessionStorage.getItem('kodo_token');

function setToken(token) {
  authToken = token;
  if (token) {
    sessionStorage.setItem('kodo_token', token);
  } else {
    sessionStorage.removeItem('kodo_token');
  }
}

function getToken() {
  return authToken;
}

async function request(endpoint, options = {}) {
  const { body, method = 'GET', headers = {} } = options;

  const config = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...headers,
    },
  };

  if (authToken) {
    config.headers['Authorization'] = `Bearer ${authToken}`;
  }

  if (body && method !== 'GET') {
    config.body = JSON.stringify(body);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  config.signal = controller.signal;

  let res;
  try {
    res = await fetch(`${API_BASE}${endpoint}`, config);
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Request timed out. Check your connection.');
    }
    throw new Error('Cannot reach server. Check your connection.');
  }
  clearTimeout(timeoutId);

  if (res.status === 401) {
    setToken(null);
    sessionStorage.removeItem('kodo_user');
    // Dispatch event so AuthContext can handle logout without a race condition
    window.dispatchEvent(new Event('auth:expired'));
    throw new Error('Session expired. Please log in again.');
  }

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    let message;
    if (data?.errors && Object.keys(data.errors).length > 0) {
      message = Object.values(data.errors).flat().join(', ');
    } else if (data?.error?.message) {
      message = data.error.message;
    } else if (data?.message) {
      message = data.message;
    } else {
      message = `Something went wrong (code ${res.status}). Please try again.`;
    }
    const error = new Error(message);
    error.status = res.status;
    error.code = data?.error?.code || null;
    error.details = data?.error?.details || data?.errors || null;
    error.data = data;
    throw error;
  }

  return data;
}

// Multipart/form-data upload helper — mirrors request() but for binary bodies.
async function uploadRequest(endpoint, formData) {
  const config = {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
    },
    body: formData,
  };
  if (authToken) config.headers['Authorization'] = `Bearer ${authToken}`;

  let res;
  try {
    res = await fetch(`${API_BASE}${endpoint}`, config);
  } catch {
    throw new Error('Cannot reach server. Check your connection.');
  }

  if (res.status === 401) {
    setToken(null);
    sessionStorage.removeItem('kodo_user');
    window.dispatchEvent(new Event('auth:expired'));
    throw new Error('Session expired. Please log in again.');
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    let message;
    if (data?.message) {
      message = data.message;
    } else if (data?.errors) {
      message = Object.values(data.errors).flat().join(', ');
    } else {
      message = `Upload failed (${res.status})`;
    }
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }
  return data;
}

// ── Auth ──────────────────────────────────────────────────

export const auth = {
  async login(email, password, deviceToken = null) {
    const body = { email, password };
    if (deviceToken) body.device_token = deviceToken;
    const data = await request('/auth/login', {
      method: 'POST',
      body,
    });
    if (data.token) setToken(data.token);
    return data;
  },

  async register({ username, email, password, password_confirmation, display_name, job_title, phone_number }) {
    const data = await request('/auth/register', {
      method: 'POST',
      body: { username, email, password, password_confirmation, display_name, job_title, phone_number },
    });
    setToken(data.token);
    return data;
  },

  async logout() {
    try {
      await request('/auth/logout', { method: 'POST' });
    } finally {
      setToken(null);
      sessionStorage.removeItem('kodo_user');
    }
  },

  async me() {
    return request('/auth/me');
  },

  async changePassword(currentPassword, newPassword, newPasswordConfirmation) {
    return request('/auth/change-password', {
      method: 'POST',
      body: { current_password: currentPassword, password: newPassword, password_confirmation: newPasswordConfirmation },
    });
  },

  async forgotPassword(email) {
    return request('/auth/forgot-password', {
      method: 'POST',
      body: { email },
    });
  },

  async resetPassword({ email, token, password, password_confirmation }) {
    return request('/auth/reset-password', {
      method: 'POST',
      body: { email, token, password, password_confirmation },
    });
  },
};

// ── Dashboard ─────────────────────────────────────────────

export const dashboard = {
  async get() {
    return request('/dashboard');
  },
};

// ── Users ─────────────────────────────────────────────────

export const users = {
  async list(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return request(`/users${qs ? `?${qs}` : ''}`);
  },

  async show(id) {
    return request(`/users/${id}`);
  },

  async updateProfile(data) {
    return request('/profile', { method: 'PUT', body: data });
  },

  async updateStatus(presence_status) {
    return request('/profile/status', { method: 'PATCH', body: { presence_status } });
  },
};

// ── Settings ──────────────────────────────────────────────

export const settings = {
  async get() {
    return request('/settings');
  },

  async update(data) {
    return request('/settings', { method: 'PUT', body: data });
  },
};

// ── Projects ──────────────────────────────────────────────

export const projects = {
  async list(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return request(`/projects${qs ? `?${qs}` : ''}`);
  },

  async show(id) {
    return request(`/projects/${id}`);
  },

  async create(data) {
    return request('/projects', { method: 'POST', body: data });
  },

  async update(id, data) {
    return request(`/projects/${id}`, { method: 'PUT', body: data });
  },

  async destroy(id) {
    return request(`/projects/${id}`, { method: 'DELETE' });
  },

  async restore(id) {
    return request(`/projects/${id}/restore`, { method: 'POST' });
  },
};

// ── Tasks ─────────────────────────────────────────────────

export const tasks = {
  async list(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return request(`/tasks${qs ? `?${qs}` : ''}`);
  },

  async show(id) {
    return request(`/tasks/${id}`);
  },

  async create(data) {
    return request('/tasks', { method: 'POST', body: data });
  },

  async update(id, data) {
    return request(`/tasks/${id}`, { method: 'PUT', body: data });
  },

  async destroy(id) {
    return request(`/tasks/${id}`, { method: 'DELETE' });
  },

  async bulkUpdateStatus(tasksData) {
    return request('/tasks/bulk-status', { method: 'POST', body: { tasks: tasksData } });
  },
};

// ── Checklists ────────────────────────────────────────────

export const checklists = {
  async list(taskId) {
    return request(`/tasks/${taskId}/checklists`);
  },

  async create(taskId, data) {
    return request(`/tasks/${taskId}/checklists`, { method: 'POST', body: data });
  },

  async update(taskId, checklistId, data) {
    return request(`/tasks/${taskId}/checklists/${checklistId}`, { method: 'PUT', body: data });
  },

  async destroy(taskId, checklistId) {
    return request(`/tasks/${taskId}/checklists/${checklistId}`, { method: 'DELETE' });
  },

  async addItem(taskId, checklistId, data) {
    return request(`/tasks/${taskId}/checklists/${checklistId}/items`, { method: 'POST', body: data });
  },

  async updateItem(taskId, checklistId, itemId, data) {
    return request(`/tasks/${taskId}/checklists/${checklistId}/items/${itemId}`, { method: 'PUT', body: data });
  },

  async destroyItem(taskId, checklistId, itemId) {
    return request(`/tasks/${taskId}/checklists/${checklistId}/items/${itemId}`, { method: 'DELETE' });
  },
};

// ── Teams ─────────────────────────────────────────────────

export const teams = {
  async list(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return request(`/teams${qs ? `?${qs}` : ''}`);
  },

  async show(id) {
    return request(`/teams/${id}`);
  },

  async create(data) {
    return request('/teams', { method: 'POST', body: data });
  },

  async update(id, data) {
    return request(`/teams/${id}`, { method: 'PUT', body: data });
  },

  async destroy(id) {
    return request(`/teams/${id}`, { method: 'DELETE' });
  },

  async join(id, password = null) {
    return request(`/teams/${id}/join`, { method: 'POST', body: password ? { password } : {} });
  },

  async leave(id) {
    return request(`/teams/${id}/leave`, { method: 'POST' });
  },
};

// ── Chat ──────────────────────────────────────────────────

export const chat = {
  async conversations() {
    return request('/chat/conversations');
  },

  async messages(roomId, params = {}) {
    const qs = new URLSearchParams(params).toString();
    return request(`/chat/rooms/${roomId}/messages${qs ? `?${qs}` : ''}`);
  },

  async poll(roomId, sinceId) {
    return request(`/chat/rooms/${roomId}/poll?since_id=${sinceId}`);
  },

  async send(receiverId, message) {
    return request('/chat/send', { method: 'POST', body: { receiver_id: receiverId, message } });
  },

  async sendTeam(teamId, message) {
    return request('/chat/send', { method: 'POST', body: { team_id: teamId, message } });
  },

  async markAsRead(roomId) {
    return request(`/chat/rooms/${roomId}/read`, { method: 'PATCH' });
  },

  async togglePin(messageId) {
    return request(`/chat/messages/${messageId}/pin`, { method: 'PATCH' });
  },

  async deleteMessage(messageId) {
    return request(`/chat/messages/${messageId}`, { method: 'DELETE' });
  },

  async toggleReaction(messageId, emoji) {
    return request(`/chat/messages/${messageId}/reactions`, { method: 'POST', body: { emoji } });
  },

  async sendWithAttachments({ receiverId, teamId, message, attachments }) {
    const body = { message: message || '' };
    if (teamId) body.team_id = teamId;
    if (receiverId) body.receiver_id = receiverId;
    if (attachments && attachments.length) body.attachments = attachments;
    return request('/chat/send', { method: 'POST', body });
  },
};

// ── Files ─────────────────────────────────────────────────

export const files = {
  async upload(file) {
    const formData = new FormData();
    formData.append('file', file);
    return uploadRequest('/files/upload', formData);
  },
};

// ── Friends ───────────────────────────────────────────────

export const friends = {
  async list() {
    return request('/friends');
  },

  async pending() {
    return request('/friends/pending');
  },

  async sent() {
    return request('/friends/sent');
  },

  async sendRequest(userId) {
    return request('/friends/request', { method: 'POST', body: { user_id: userId } });
  },

  async accept(id) {
    return request(`/friends/${id}/accept`, { method: 'PATCH' });
  },

  async decline(id) {
    return request(`/friends/${id}/decline`, { method: 'PATCH' });
  },

  async remove(id) {
    return request(`/friends/${id}`, { method: 'DELETE' });
  },
};

// ── Time Entries ──────────────────────────────────────────

export const timeEntries = {
  async list(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return request(`/time-entries${qs ? `?${qs}` : ''}`);
  },

  async create(data) {
    return request('/time-entries', { method: 'POST', body: data });
  },

  async update(id, data) {
    return request(`/time-entries/${id}`, { method: 'PUT', body: data });
  },

  async destroy(id) {
    return request(`/time-entries/${id}`, { method: 'DELETE' });
  },

  async summary(params) {
    const qs = new URLSearchParams(params).toString();
    return request(`/time-entries/summary${qs ? `?${qs}` : ''}`);
  },
};

// ── Activity Logs ─────────────────────────────────────────

export const activityLogs = {
  async list(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return request(`/activity-logs${qs ? `?${qs}` : ''}`);
  },

  async feed(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return request(`/activity-logs/feed${qs ? `?${qs}` : ''}`);
  },

  async forProject(projectId) {
    return request(`/activity-logs/project/${projectId}`);
  },
};

// ── Participants ──────────────────────────────────────────

export const participants = {
  async list(entityType, entityId) {
    const qs = new URLSearchParams({ entity_type: entityType, entity_id: entityId }).toString();
    return request(`/participants?${qs}`);
  },

  async add(entityType, entityId, userId, role = 'member') {
    return request('/participants', { method: 'POST', body: { entity_type: entityType, entity_id: entityId, user_id: userId, role } });
  },

  async updateRole(entityType, entityId, userId, role) {
    return request('/participants/role', { method: 'PATCH', body: { entity_type: entityType, entity_id: entityId, user_id: userId, role } });
  },

  async remove(entityType, entityId, userId) {
    return request('/participants', { method: 'DELETE', body: { entity_type: entityType, entity_id: entityId, user_id: userId } });
  },
};

// ── Calendar Events ──────────────────────────────────────
export const calendarEvents = {
  async list(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return request(`/calendar-events${qs ? `?${qs}` : ''}`);
  },
  async show(id) {
    return request(`/calendar-events/${id}`);
  },
  async create(data) {
    return request('/calendar-events', { method: 'POST', body: data });
  },
  async update(id, data) {
    return request(`/calendar-events/${id}`, { method: 'PUT', body: data });
  },
  async destroy(id) {
    return request(`/calendar-events/${id}`, { method: 'DELETE' });
  },
  async rsvp(id, responseStatus) {
    return request(`/calendar-events/${id}/rsvp`, { method: 'POST', body: { response_status: responseStatus } });
  },
};

// ── Notifications ────────────────────────────────────────
export const notifications = {
  async list(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return request(`/notifications${qs ? `?${qs}` : ''}`);
  },
  async markAsRead(id) {
    return request(`/notifications/${id}/read`, { method: 'PATCH' });
  },
  async markAllRead() {
    return request('/notifications/read-all', { method: 'POST' });
  },
  async destroy(id) {
    return request(`/notifications/${id}`, { method: 'DELETE' });
  },
};

// ── Channels (team sub-rooms) ────────────────────────────

export const channels = {
  async list(teamId) {
    return request(`/channels?team_id=${teamId}`);
  },

  async show(id) {
    return request(`/channels/${id}`);
  },

  async create({ team_id, name, description, channel_type }) {
    return request('/channels', { method: 'POST', body: { team_id, name, description, channel_type } });
  },

  async update(id, data) {
    return request(`/channels/${id}`, { method: 'PUT', body: data });
  },

  async destroy(id) {
    return request(`/channels/${id}`, { method: 'DELETE' });
  },

  async messages(id, params = {}) {
    const qs = new URLSearchParams(params).toString();
    return request(`/channels/${id}/messages${qs ? `?${qs}` : ''}`);
  },

  async sendMessage(id, { content, content_type, parent_message_id }) {
    return request(`/channels/${id}/messages`, {
      method: 'POST',
      body: { content, content_type, parent_message_id },
    });
  },
};

// ── Conversations (group chats) ──────────────────────────

export const conversations = {
  async list() {
    return request('/conversations');
  },

  async show(id) {
    return request(`/conversations/${id}`);
  },

  async create({ name, user_ids }) {
    return request('/conversations', { method: 'POST', body: { name, user_ids } });
  },

  async messages(id, params = {}) {
    const qs = new URLSearchParams(params).toString();
    return request(`/conversations/${id}/messages${qs ? `?${qs}` : ''}`);
  },

  async sendMessage(id, content) {
    return request(`/conversations/${id}/messages`, { method: 'POST', body: { content } });
  },

  async addParticipants(id, user_ids) {
    return request(`/conversations/${id}/participants`, { method: 'POST', body: { user_ids } });
  },

  async leave(id) {
    return request(`/conversations/${id}/leave`, { method: 'POST' });
  },
};

// ── Organizations ────────────────────────────────────────

export const organizations = {
  async list() {
    return request('/organizations');
  },

  async show(id) {
    return request(`/organizations/${id}`);
  },

  async create(data) {
    return request('/organizations', { method: 'POST', body: data });
  },

  async update(id, data) {
    return request(`/organizations/${id}`, { method: 'PUT', body: data });
  },

  async destroy(id) {
    return request(`/organizations/${id}`, { method: 'DELETE' });
  },
};

// ── Verification (2FA) ───────────────────────────────────

export const verification = {
  async sendCode(userId) {
    return request('/verification/send', { method: 'POST', body: { user_id: userId } });
  },

  async verifyCode(userId, code, rememberDevice = false) {
    return request('/verification/verify', { method: 'POST', body: { user_id: userId, code, remember_device: rememberDevice } });
  },

  async checkDevice(userId, deviceToken) {
    return request('/verification/check-device', { method: 'POST', body: { user_id: userId, device_token: deviceToken } });
  },
};

// ── Health Check ──────────────────────────────────────────

export async function healthCheck() {
  try {
    const data = await request('/health');
    return data?.status === 'ok';
  } catch {
    return false;
  }
}

export { setToken, getToken };
