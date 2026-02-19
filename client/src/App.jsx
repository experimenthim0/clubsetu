import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import EventFeed from './pages/EventFeed';
import RegisterStudent from './pages/RegisterStudent';
import RegisterClubHead from './pages/RegisterClubHead';
import Login from './pages/Login';
import EventDetails from './pages/EventDetails';
import CreateEvent from './pages/CreateEvent';
import Profile from './pages/Profile';
import MyEvents from './pages/MyEvents';
import EditProfile from './pages/EditProfile';
import EditEvent from './pages/EditEvent';
import EventRegistrations from './pages/EventRegistrations';
import RegisterLanding from './pages/RegisterLanding';
import ClubsPage from './pages/Clubspage';
import Home from './pages/Home';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import NotFound from './pages/NotFound';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsAndConditions from './pages/TermsAndConditions';
import PaymentPolicy from './pages/PaymentPolicy';
import DataPrivacy from './pages/DataPrivacy';
import PaymentTracking from './pages/PaymentTracking';
import EventGuide from './pages/EventGuide';
import Contribute from './pages/Contribute';
import VerifyEmail from './pages/VerifyEmail';
import FAQ from './pages/FAQ';

import { NotificationProvider } from './context/NotificationContext';

// Global axios interceptor — attach JWT token to every request
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Global axios interceptor — handle 401 responses (expired token)
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Only redirect if not already on login/register pages
      const path = window.location.pathname;
      if (!path.includes('/login') && !path.includes('/register') && !path.includes('/admin')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('role');
        localStorage.removeItem('admin');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

function App() {
  return (
    <NotificationProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-gray-50">
          <Navbar />
          <div className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/clubs" element={<ClubsPage />} />
            <Route path="/events" element={<EventFeed />} />
            <Route path="/events/:id" element={<EventDetails />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<RegisterLanding />} />
            <Route path="/register/student" element={<RegisterStudent />} />
            <Route path="/register/club-head" element={<RegisterClubHead />} />
            <Route path="/create" element={<CreateEvent />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/my-events" element={<MyEvents />} />
            <Route path="/profile/edit" element={<EditProfile />} />
            <Route path="/events/edit/:id" element={<EditEvent />} />
            <Route path="/events/:id/registrations" element={<EventRegistrations />} />
            <Route path="/admin-secret-login" element={<AdminLogin />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsAndConditions />} />
            <Route path="/payment-policy" element={<PaymentPolicy />} />
            <Route path="/data-privacy" element={<DataPrivacy />} />
            <Route path="/payments" element={<PaymentTracking />} />
            <Route path="/event-guide" element={<EventGuide />} />
            <Route path="/contribute" element={<Contribute />} />
            <Route path="/verify-email/:token" element={<VerifyEmail />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </div>
          <Footer />
        </div>
      </Router>
    </NotificationProvider>
  );
}

export default App;
