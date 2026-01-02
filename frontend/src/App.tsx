/**
 * Main application component with routing
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import LandingPage from './pages/LandingPage';
import Workspace from './pages/Workspace';
import PublicNoteViewer from './pages/PublicNoteViewer';
import UserProfile from './pages/UserProfile';

// Protected route component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated()) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing page - public */}
        <Route path="/" element={<LandingPage />} />

        {/* Workspace - protected */}
        <Route
          path="/workspace"
          element={
            <ProtectedRoute>
              <Workspace />
            </ProtectedRoute>
          }
        />

        {/* Public note viewer - public */}
        <Route path="/note/:fileId" element={<PublicNoteViewer />} />

        {/* User profile - public */}
        <Route path="/profile/:userId" element={<UserProfile />} />

        {/* Catch all - redirect to landing */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
