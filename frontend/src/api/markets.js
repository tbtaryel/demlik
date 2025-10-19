import api from './client.js';

export const MarketsAPI = {
  // BIST
  getBistIndexList() {
    return api.get('/markets/bist/indexes').then((r) => r.data);
  },
  getBistAlphabetic(key = 'A') {
    return api.get('/markets/bist/alphabetic', { params: { key } }).then((r) => r.data);
  },
  getBistIndexDetail(name) {
    return api.get(`/markets/bist/indexes/${encodeURIComponent(name)}`).then((r) => r.data);
  },

  // Bigpara
  getBigparaList() {
    return api.get('/markets/bigpara/stocks').then((r) => r.data);
  },
  getBigparaDetail(code) {
    return api.get(`/markets/bigpara/stocks/${encodeURIComponent(code)}`).then((r) => r.data);
  },

  // Midas
  getMidasTableData() {
    return api.get('/markets/midas/table').then((r) => r.data);
  },

  // Admin-managed Market Config
  getMarketIndexConfig(code = 'XU100') {
    return api.get('/markets/index-config', { params: { code } }).then((r) => r.data);
  },
  upsertMarketIndexConfig(payload) {
    return api.put('/markets/admin/index-config', payload).then((r) => r.data);
  },

  // Recommended Stocks (admin + public)
  getRecommendedPublic() {
    return api.get('/markets/recommended').then((r) => r.data);
  },
  getRecommendedAdminList() {
    return api.get('/markets/admin/recommended-stocks').then((r) => r.data);
  },
  createRecommended(payload) {
    return api.post('/markets/admin/recommended-stocks', payload).then((r) => r.data);
  },
  updateRecommended(id, payload) {
    return api.put(`/markets/admin/recommended-stocks/${encodeURIComponent(id)}`, payload).then((r) => r.data);
  },
  deleteRecommended(id) {
    return api.delete(`/markets/admin/recommended-stocks/${encodeURIComponent(id)}`).then((r) => r.data);
  },
};