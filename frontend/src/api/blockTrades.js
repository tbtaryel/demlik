import api from './client.js';

export const BlockTradesAPI = {
  async getSecurities() {
    const r = await api.get('/block-trades/securities');
    // Normalize
    const arr = Array.isArray(r.data) ? r.data : [];
    return arr.map((x) => ({
      id: x.id,
      symbol: x.symbol,
      name: x.name || x.symbol,
      buy_price: Number(x.buy_price || x.price || 0),
      min_qty: Number(x.min_qty || x.minimum_qty || 0),
    }));
  },
  async getList() {
    const r = await api.get('/block-trades/list');
    const arr = Array.isArray(r.data) ? r.data : [];
    return arr.map((x) => ({
      id: x.id,
      symbol: x.symbol,
      price: Number(x.price || 0),
      qty: Number(x.qty || x.quantity || 0),
      turnover: typeof x.turnover === 'number' ? x.turnover : Number(x.price || 0) * Number(x.qty || 0),
      status: x.status || 'beklemede',
    }));
  },
  // Admin
  async createSecurity(payload) {
    const r = await api.post('/block-trades/admin/securities', payload);
    return r.data;
  },
  async updateSecurity(id, payload) {
    const r = await api.put(`/block-trades/admin/securities/${id}`, payload);
    return r.data;
  },
  async deleteSecurity(id) {
    const r = await api.delete(`/block-trades/admin/securities/${id}`);
    return r.data;
  },
  async createTrade(payload) {
    const r = await api.post('/block-trades/admin/list', payload);
    return r.data;
  },
  async updateTrade(id, payload) {
    const r = await api.put(`/block-trades/admin/list/${id}`, payload);
    return r.data;
  },
  async deleteTrade(id) {
    const r = await api.delete(`/block-trades/admin/list/${id}`);
    return r.data;
  },
};