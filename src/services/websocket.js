/**
 * WebSocket client for real-time messaging.
 *
 * Connects to a WS endpoint derived from the API URL.
 * Falls back gracefully — if WS is unavailable, the caller
 * continues using HTTP polling.
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

function deriveWsUrl() {
  const wsEnv = import.meta.env.VITE_WS_URL;
  if (wsEnv) return wsEnv;
  // Derive from API URL: http(s)://host/api → ws(s)://host/ws
  try {
    const url = new URL(API_BASE);
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    url.pathname = '/ws';
    return url.toString();
  } catch {
    return null;
  }
}

const RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 15000, 30000];

export default class WebSocketClient {
  constructor({ token, onMessage, onStatusChange }) {
    this._token = token;
    this._onMessage = onMessage;
    this._onStatusChange = onStatusChange || (() => {});
    this._ws = null;
    this._reconnectAttempt = 0;
    this._reconnectTimer = null;
    this._intentionalClose = false;
    this._status = 'disconnected'; // disconnected | connecting | connected | failed
  }

  get status() { return this._status; }
  get isConnected() { return this._status === 'connected'; }

  connect() {
    const url = deriveWsUrl();
    if (!url) {
      this._setStatus('failed');
      return;
    }

    this._intentionalClose = false;
    this._setStatus('connecting');

    try {
      this._ws = new WebSocket(`${url}?token=${encodeURIComponent(this._token)}`);
    } catch {
      this._setStatus('failed');
      return;
    }

    this._ws.onopen = () => {
      this._reconnectAttempt = 0;
      this._setStatus('connected');
    };

    this._ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this._onMessage(data);
      } catch { /* ignore malformed frames */ }
    };

    this._ws.onclose = () => {
      if (this._intentionalClose) {
        this._setStatus('disconnected');
        return;
      }
      this._scheduleReconnect();
    };

    this._ws.onerror = () => {
      // onerror is always followed by onclose — do nothing here
    };
  }

  disconnect() {
    this._intentionalClose = true;
    clearTimeout(this._reconnectTimer);
    if (this._ws) {
      this._ws.close();
      this._ws = null;
    }
    this._setStatus('disconnected');
  }

  send(type, payload) {
    if (this._ws?.readyState === WebSocket.OPEN) {
      this._ws.send(JSON.stringify({ type, ...payload }));
      return true;
    }
    return false;
  }

  /** Subscribe to a specific room for real-time updates */
  joinRoom(roomId) {
    return this.send('join_room', { room_id: roomId });
  }

  /** Leave a room */
  leaveRoom(roomId) {
    return this.send('leave_room', { room_id: roomId });
  }

  _setStatus(status) {
    this._status = status;
    this._onStatusChange(status);
  }

  _scheduleReconnect() {
    const delay = RECONNECT_DELAYS[Math.min(this._reconnectAttempt, RECONNECT_DELAYS.length - 1)];
    this._reconnectAttempt++;

    // After 6 failed attempts, give up (caller keeps polling)
    if (this._reconnectAttempt > RECONNECT_DELAYS.length) {
      this._setStatus('failed');
      return;
    }

    this._setStatus('connecting');
    this._reconnectTimer = setTimeout(() => this.connect(), delay);
  }
}
