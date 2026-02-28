import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ScheduleVideoPage from './pages/ScheduleVideoPage';
import SchedulePostPage from './pages/SchedulePostPage';
import Settings from './pages/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/schedule-video" element={<ScheduleVideoPage />} />
          <Route path="/schedule-post" element={<SchedulePostPage />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
