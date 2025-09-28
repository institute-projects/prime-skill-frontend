import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import AddStudent from './components/AddStudent';
import OnlineAdmissions from './components/OnlineAdmissions';
import StudentDetailPage from './components/StudentDetail';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public route */}
          <Route path="/login" element={<Login />} />
          
          {/* Protected routes */}
          <Route path="/" element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } />
          
          <Route path="/add-student" element={
            <PrivateRoute>
              <AddStudent />
            </PrivateRoute>
          } />
          
          <Route path="/online-admissions" element={
            <PrivateRoute>
              <OnlineAdmissions />
            </PrivateRoute>
          } />
          
          <Route path="/student/:studentId/:fullName/:passYear" element={
            <PrivateRoute>
              <StudentDetailPage />
            </PrivateRoute>
          } />
          
          {/* Redirect to dashboard for any unknown routes */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;