import api from './client.js';

export const IntradayAPI = {
  // Settings
  getSettings() {
    return api.get('/intraday/settings').then((r) => r.data);
  },
  saveSettings(payload) {
    return api.put('/intraday/admin/settings', payload).then((r) => r.data);
  },

  // Orders
  listOrders(params = {}) {
    return api.get('/intraday/orders', { params }).then((r) => r.data);
  },
  createOrder(amount) {
    return api.post('/intraday/orders', { amount }).then((r) => r.data);
  },
  adminUpdateOrder(id, payload) {
    return api.put(`/intraday/admin/orders/${encodeURIComponent(id)}`, payload).then((r) => r.data);
  },
  adminDeleteOrder(id) {
    return api.delete(`/intraday/admin/orders/${encodeURIComponent(id)}`).then((r) => r.data);
  },

  // Operations
  listOperations(params = {}) {
    return api.get('/intraday/operations', { params }).then((r) => r.data);
  },
  getOperation(id) {
    return api.get(`/intraday/operations/${encodeURIComponent(id)}`).then((r) => r.data);
  },
  adminCreateOperation(payload) {
    return api.post('/intraday/admin/operations', payload).then((r) => r.data);
  },
  adminUpdateOperation(id, payload) {
    return api.put(`/intraday/admin/operations/${encodeURIComponent(id)}`, payload).then((r) => r.data);
  },
  adminDeleteOperation(id) {
    return api.delete(`/intraday/admin/operations/${encodeURIComponent(id)}`).then((r) => r.data);
  },
};