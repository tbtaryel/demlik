import api from './client.js';

export const FinanceAPI = {
  // Accounts
  listAccounts: () => api.get('/finance/accounts').then((r) => r.data),
  addAccount: (payload) => api.post('/finance/accounts', payload).then((r) => r.data),
  deleteAccount: (id) => api.delete(`/finance/accounts/${id}`).then((r) => r.data),

  // Transactions
  listTransactions: (type) => {
    const params = type ? { params: { type } } : undefined;
    return api.get('/finance/transactions', params).then((r) => r.data);
  },
  createTransaction: (payload) => api.post('/finance/transactions', payload).then((r) => r.data),

  // Admin update (optional)
  adminUpdateTransaction: (id, status) => api.put(`/finance/admin/transactions/${id}`, { status }).then((r) => r.data),

  // Admin list (new)
  adminListTransactions: (params = {}) => api.get('/finance/admin/transactions', { params }).then((r) => r.data),
};

export default FinanceAPI;