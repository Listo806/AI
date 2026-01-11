import { Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Subscriptions from './pages/Subscriptions';
import SubscriptionSuccess from './pages/SubscriptionSuccess';
import Checkout from './pages/Checkout';
import Teams from './pages/Teams';
import Leads from './pages/Leads';
import Properties from './pages/Properties';
import Map from './pages/Map';
import MapTest from './pages/MapTest';
import FileUpload from './pages/FileUpload';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const ProtectedRoute = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [checking, setChecking] = useState(true);

    useEffect(() => {
      const token = localStorage.getItem('access_token');
      if (token) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
      setChecking(false);
    }, []);

    if (checking) {
      return <div className="container">Loading...</div>;
    }

    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }

    return children;
  };

  return (
    <Routes>
      <Route path="/login" element={<Login setUser={setUser} />} />
      <Route path="/signup" element={<Signup setUser={setUser} />} />
      <Route path="/map-test" element={<MapTest />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout user={user} setUser={setUser} />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="subscriptions" element={<Subscriptions />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="subscription/success" element={<SubscriptionSuccess />} />
        <Route path="teams" element={<Teams />} />
        <Route path="leads" element={<Leads />} />
        <Route path="properties" element={<Properties />} />
        <Route path="map" element={<Map />} />
        <Route path="file-upload" element={<FileUpload />} />
      </Route>
    </Routes>
  );
}

export default App;

