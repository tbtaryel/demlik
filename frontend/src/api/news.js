import api from './client.js';

export const NewsAPI = {
  getContentList() {
    return api.get('/content').then((r) => r.data);
  },
  getTrtSonDakika() {
    return api.get('/news/trt-sondakika.json').then((r) => r.data);
  },
};