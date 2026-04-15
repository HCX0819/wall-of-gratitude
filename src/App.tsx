/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './components/HomePage';
import WallPage from './components/WallPage';
import LeaderboardPage from './components/LeaderboardPage';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/admin" element={<HomePage />} />
        <Route path="/admin/wall/:slug" element={<WallPage isAdmin={true} />} />
        <Route path="/wall/:slug" element={<WallPage isAdmin={false} />} />
        <Route path="/demo" element={<WallPage isDemo={true} />} />
        <Route path="/leaderboard/:slug" element={<LeaderboardPage />} />
        {/* Redirect root to admin for now so you can access your dashboard */}
        <Route path="/" element={<Navigate to="/admin" replace />} />
      </Routes>
    </Router>
  );
}
