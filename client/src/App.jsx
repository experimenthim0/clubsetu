import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import EventFeed from './pages/EventFeed';
import RegisterStudent from './pages/RegisterStudent';

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
import ClubDetails from './pages/ClubDetails';
import EditClub from './pages/EditClub';
import Maintainance from './pages/Maintainance';


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
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import Changelog from './pages/Changelog';
// import ProtectedRoute from './components/ProtectedRoute';
import FAQ from './pages/FAQ';
import Aboutfeatures from './pages/Aboutfeatures';
import CertificateDesigner from './pages/CertificateDesigner';

import { NotificationProvider } from './context/NotificationContext';
import { SocketProvider } from './context/SocketContext';
import Team from './pages/Team';
import SendNotification from './pages/SendNotification';

// Global axios config - enable cookies
axios.defaults.withCredentials = true;

// Global axios interceptor — attach JWT token to every request
axios.interceptors.request.use(
  (config) => {
    // We still keep the Authorization header fallback just in case,
    // though the server now primarily reads from cookies.
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
      const path = window.location.pathname;
      
      // Don't redirect if already on any login/register pages
      if (path.includes('/login') || path.includes('/register') || path.includes('/admin-secret-login')) {
        return Promise.reject(error);
      }

      // Handle Admin routes
      if (path.includes('/admin')) {
        localStorage.removeItem('token');
        localStorage.removeItem('admin');
        window.location.href = '/admin-secret-login';
        return Promise.reject(error);
      }

      // Handle regular User routes
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('role');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);




function App() {

   const isMaintenance = import.meta.env.VITE_MAINTENANCE_MODE === 'true';
  if (isMaintenance) {
    return <Maintainance />;
  }
  return (
    <NotificationProvider>
      <SocketProvider>
        <Router>
        <div className="min-h-screen flex flex-col bg-gray-50">
          <Navbar />
          <div className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/clubs" element={<ClubsPage />} />
            <Route path="/club/:slug" element={<ClubDetails />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            
            {/* Protected Routes */}
            <Route path="/club/edit/:id" element={<EditClub />} />

            <Route path="/events" element={<EventFeed />} />
            <Route path="/event/:slug" element={<EventDetails />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<RegisterLanding />} />
            <Route path="/register/student" element={<RegisterStudent />} />
            <Route path="/create" element={<CreateEvent />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/my-events" element={<MyEvents />} />
            <Route path="/profile/edit" element={<EditProfile />} />
            <Route path="/events/edit/:id" element={<EditEvent />} />
            <Route path="/send-notification" element={<SendNotification />} />
            <Route path="/event/:id/registrations" element={<EventRegistrations />} />
            <Route path="/event/:id/design-certificate" element={<CertificateDesigner />} />
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
            <Route path="/changelog" element={<Changelog />} />
            <Route path="*" element={<NotFound />} />
            <Route path="/about-features" element={<Aboutfeatures />} />
            <Route path="/team" element={<Team />} />
          </Routes>
          </div>
          <Footer />
        </div>
      </Router>
      </SocketProvider>
    </NotificationProvider>
  );
}

export default App;
