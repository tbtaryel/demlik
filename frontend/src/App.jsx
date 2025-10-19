import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './layouts/AppLayout.jsx';
import AdminLayout from './layouts/AdminLayout.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import AdminLogin from './pages/AdminLogin.jsx';
import ContentList from './pages/ContentList.jsx';
import ContentView from './pages/ContentView.jsx';
import Chat from './pages/Chat.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import Profile from './pages/Profile.jsx';
import Feedback from './pages/Feedback.jsx';
import Market from './pages/Market.jsx';
import Intraday from './pages/Intraday.jsx';
import News from './pages/News.jsx';
import NewsDetail from './pages/NewsDetail.jsx';
import More from './pages/More.jsx';
import KYC from './pages/KYC.jsx';
import BankAccounts from './pages/BankAccounts.jsx';
import BankAccountAdd from './pages/BankAccountAdd.jsx';
import Statements from './pages/Statements.jsx';
import Deposit from './pages/Deposit.jsx';
import Withdraw from './pages/Withdraw.jsx';
import Credit from './pages/Credit.jsx';
import IPO from './pages/IPO.jsx';
import BlockTrade from './pages/BlockTrade.jsx';
import GrowthStocks from './pages/GrowthStocks.jsx';
import Quantitative from './pages/Quantitative.jsx';
import ChangeLoginPassword from './pages/ChangeLoginPassword.jsx';
import ChangePaymentPassword from './pages/ChangePaymentPassword.jsx';
import About from './pages/About.jsx';
import Dashboard from './pages/admin/Dashboard.jsx';
import Users from './pages/admin/Users.jsx';
import AdminChat from './pages/admin/Chat.jsx';
import AdminSettings from './pages/admin/Settings.jsx';
// import AdminMarketConfig from './pages/admin/Market.jsx';
import AdminRecommendedStocks from './pages/admin/RecommendedStocks.jsx';
import AdminIntraday from './pages/admin/Intraday.jsx';
import AdminBlockTrades from './pages/admin/BlockTrades.jsx';
import AdminStatements from './pages/admin/Statements.jsx';
import AdminBistGraph from './pages/admin/BistGraph.jsx';

function RequireAuth({ children }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function RequireAdmin({ children }) {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  if (!token || role !== 'admin') return <Navigate to="/admin-login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/admin-login" element={<AdminLogin />} />
      <Route path="/register" element={<Register />} />
      {/* Public news routes */}
      <Route element={<AppLayout />}>        
        <Route path="news" element={<News />} />
        <Route path="news/:id" element={<NewsDetail />} />
      </Route>
      <Route element={<RequireAuth><AppLayout /></RequireAuth>}>        
        <Route index element={<Market />} />
        <Route path="market" element={<Market />} />
        <Route path="intraday" element={<Intraday />} />
        <Route path="ipo" element={<IPO />} />
        <Route path="block-trade" element={<BlockTrade />} />
        <Route path="growth-stocks" element={<GrowthStocks />} />
        <Route path="quantitative" element={<Quantitative />} />
        <Route path="more" element={<More />} />
        <Route path="deposit" element={<Deposit />} />
        <Route path="withdraw" element={<Withdraw />} />
        <Route path="credit" element={<Credit />} />
        <Route path="kyc" element={<KYC />} />
        <Route path="bank-accounts" element={<BankAccounts />} />
        <Route path="bank-accounts/add" element={<BankAccountAdd />} />
        <Route path="statements" element={<Statements />} />
        <Route path="change-login-password" element={<ChangeLoginPassword />} />
        <Route path="change-payment-password" element={<ChangePaymentPassword />} />
        <Route path="about" element={<About />} />
        <Route path="c/:slug" element={<ContentView />} />
        <Route path="chat" element={<Chat />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="profile" element={<Profile />} />
        <Route path="feedback" element={<Feedback />} />
      </Route>
      <Route path="/admin" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
        <Route index element={<Dashboard />} />
        <Route path="users" element={<Users />} />
        {/* <Route path="menus" element={<AdminMenus />} /> */}
        <Route path="chat" element={<AdminChat />} />
        {/* <Route path="market" element={<AdminMarketConfig />} /> */}
        <Route path="recommended-stocks" element={<AdminRecommendedStocks />} />
        <Route path="intraday" element={<AdminIntraday />} />
        <Route path="block-trades" element={<AdminBlockTrades />} />
        <Route path="statements" element={<AdminStatements />} />
        {/* Removed /admin/dynamic route */}
        <Route path="settings" element={<AdminSettings />} />
        <Route path="bist-graph" element={<AdminBistGraph />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}