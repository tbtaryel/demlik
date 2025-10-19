import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { db } from './config/db.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import contentRoutes from './routes/content.js';
import notificationRoutes from './routes/notifications.js';
import settingsRoutes from './routes/settings.js';
import feedbackRoutes from './routes/feedback.js';
import pagesRoutes from './routes/pages.js';
import menusRoutes from './routes/menus.js';
import invitesRoutes from './routes/invites.js';
import marketsRoutes from './routes/markets.js';
import newsRoutes from './routes/news.js';
import chatRoutes from './routes/chat.js';
import adminRoutes from './routes/admin.js';
import intradayRoutes from './routes/intraday.js';
import financeRoutes from './routes/finance.js';
import blockTradesRoutes from './routes/block_trades.js';
import bistGraphRoutes from './routes/bist_graph.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(helmet());
app.use(express.json());

// ensure uploads directory exists and serve static files
try {
  const uploadsDir = path.resolve('uploads');
  fs.mkdirSync(uploadsDir, { recursive: true });
  app.use('/uploads', express.static(uploadsDir));
} catch (e) {
  console.warn('Uploads directory init failed:', e.message);
}

app.get('/', (req, res) => res.json({ status: 'ok', app: 'dia', version: '0.1.0' }));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/pages', pagesRoutes);
app.use('/api/menus', menusRoutes);
app.use('/api/invites', invitesRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/markets', marketsRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/intraday', intradayRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/block-trades', blockTradesRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/bist-graph', bistGraphRoutes);

app.use((req, res) => res.status(404).json({ error: 'Not found' }));

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`);
  db.getConnection()
    .then((conn) => {
      conn.release();
      console.log('DB connected');
    })
    .catch((err) => {
      console.warn('DB connection failed:', err.message);
    });
});