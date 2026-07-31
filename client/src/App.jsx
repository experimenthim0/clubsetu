import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import AppLayout from './components/AppLayout';
import AdminLayout from './components/AdminLayout';
import RouteLoader from './components/RouteLoader';
import PageLoader from './components/PageLoader';

// Lazy loaded page components
const EventFeed = lazy(() => import('./pages/EventFeed'));
const RegisterStudent = lazy(() => import('./pages/RegisterStudent'));
const Team = lazy(() => import('./pages/Team'));
const Login = lazy(() => import('./pages/Login'));
const EventDetails = lazy(() => import('./pages/EventDetails'));
const CreateEvent = lazy(() => import('./pages/CreateEvent'));
const Profile = lazy(() => import('./pages/Profile'));
const MyEvents = lazy(() => import('./pages/MyEvents'));
const EditProfile = lazy(() => import('./pages/EditProfile'));
const EditEvent = lazy(() => import('./pages/EditEvent'));
const EventRegistrations = lazy(() => import('./pages/EventRegistrations'));
const CheckIn = lazy(() => import('./pages/CheckIn'));
const RegisterLanding = lazy(() => import('./pages/RegisterLanding'));
const ClubsPage = lazy(() => import('./pages/Clubspage'));
const ClubDetails = lazy(() => import('./pages/ClubDetails'));
const EditClub = lazy(() => import('./pages/EditClub'));
const ClubMembers = lazy(() => import('./pages/ClubMembers'));
const ClubEvents = lazy(() => import('./pages/ClubEvents'));
const Maintainance = lazy(() => import('./pages/Maintainance'));
const Maintenance = Maintainance;
const Home = lazy(() => import('./pages/Home'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const NotFound = lazy(() => import('./pages/NotFound'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsAndConditions = lazy(() => import('./pages/TermsAndConditions'));
const PaymentPolicy = lazy(() => import('./pages/PaymentPolicy'));
const DataPrivacy = lazy(() => import('./pages/DataPrivacy'));
const PaymentTracking = lazy(() => import('./pages/PaymentTracking'));
const EventGuide = lazy(() => import('./pages/EventGuide'));
const Contribute = lazy(() => import('./pages/Contribute'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const FAQ = lazy(() => import('./pages/FAQ'));
const Aboutfeatures = lazy(() => import('./pages/Aboutfeatures'));
const CertificateDesigner = lazy(() => import('./pages/CertificateDesigner'));
const LostAndFound = lazy(() => import('./pages/LostAndFound'));
const LostFoundAdminDashboard = lazy(() => import('./pages/LostFoundAdminDashboard'));
const LostFoundGuide = lazy(() => import('./pages/LostFoundGuide'));
// const ColorExtractorDemo = lazy(() => import('./pages/ColorExtractorDemo'));
const SendNotification = lazy(() => import('./pages/SendNotification'));
const Notifications = lazy(() => import('./pages/Notifications'));
// const BusTracker = lazy(() => import('./pages/BusTracker'));
// const EventTimerBuilder = lazy(() => import('./pages/EventTimerBuilder'));
// const EventTimerLive = lazy(() => import('./pages/EventTimerLive'));

import { NotificationProvider } from './context/NotificationContext';
import { SocketProvider } from './context/SocketContext';
// import { EventTimerProvider } from './context/EventTimerContext';

// Global axios config - enable cookies
axios.defaults.withCredentials = true;

// Global axios interceptor — attach Bearer token if present in localStorage, alongside httpOnly cookies
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
    if (error.response?.status === 503 && error.response?.data?.code === 'MAINTENANCE_OVERLOAD') {
      window.location.href = '/maintenance';
      return Promise.reject(error);
    }

    if (error.response?.status === 401) {
      const path = window.location.pathname;
      
      // Don't redirect if already on any login/register pages
      if (path.includes('/login') || path.includes('/register') || path.includes('/admin-secret-login')) {
        return Promise.reject(error);
      }

      // Clear all auth data
      localStorage.removeItem('user');
      localStorage.removeItem('admin');
      localStorage.removeItem('role');
      localStorage.removeItem('token');
      // Clear cookie client-side
      document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

      // Handle Admin routes
      if (path.includes('/admin')) {
        window.location.href = '/admin-secret-login';
        return Promise.reject(error);
      }

      // Handle regular User routes
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
        <RouteLoader>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* ── Admin Layout — separate window, custom navbar/sidebar ── */}
              <Route element={<AdminLayout />}>
                <Route path="/admin-dashboard" element={<AdminDashboard />} />
                <Route path="/admin/lost-found" element={<LostFoundAdminDashboard />} />
              </Route>

              {/* Standalone Full-Screen Stage Display (No Site Navbar/Footer) */}
              {/* <Route path="/event-timer/live" element={<EventTimerProvider><EventTimerLive /></EventTimerProvider>} /> */}

              {/* ── Public Layout — standard navbar/footer ── */}
              <Route element={<AppLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/clubs" element={<ClubsPage />} />
                {/* <Route path="/event-timer" element={<EventTimerProvider><EventTimerBuilder /></EventTimerProvider>} /> */}
                {/* <Route path="/event-timer/builder" element={<EventTimerProvider><EventTimerBuilder /></EventTimerProvider>} /> */}
                <Route path="/club/:slug" element={<ClubDetails />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password/:token" element={<ResetPassword />} />
              
                {/* Protected Routes */}
                <Route path="/club/edit/:id" element={<EditClub />} />
                <Route path="/club/:clubId/team" element={<ClubMembers />} />

                <Route path="/events" element={<EventFeed />} />
                <Route path="/event/:slug" element={<EventDetails />} />
                <Route path="/login" element={<Login />} />
               
                <Route path="/register" element={<RegisterStudent />} />
                <Route path="/create" element={<CreateEvent />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/my-events" element={<MyEvents />} />
                <Route path="/club-events/:clubId" element={<ClubEvents />} />
                <Route path="/profile/edit" element={<EditProfile />} />
                <Route path="/events/edit/:id" element={<EditEvent />} />
                <Route path="/send-notification" element={<SendNotification />} />
                <Route path="/event/:id/registrations" element={<EventRegistrations />} />
                <Route path="/event/:id/check-in" element={<CheckIn />} />
                <Route path="/event/:id/design-certificate" element={<CertificateDesigner />} />
                <Route path="/admin-secret-login" element={<AdminLogin />} />
                <Route path="/maintenance" element={<Maintenance />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsAndConditions />} />
                <Route path="/payment-policy" element={<PaymentPolicy />} />
                <Route path="/data-privacy" element={<DataPrivacy />} />
                <Route path="/payments" element={<PaymentTracking />} />
                <Route path="/event-guide" element={<EventGuide />} />
                <Route path="/contribute" element={<Contribute />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/verify-email/:token" element={<VerifyEmail />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/team" element={<Team />} />
                <Route path="/about-features" element={<Aboutfeatures />} />
                <Route path="/lost-found" element={<LostAndFound />} />
                <Route path="/lost-found/guide" element={<LostFoundGuide />} />
                {/* <Route path="/bus-tracker" element={<BusTracker />} /> */}
                {/* <Route path="/color-extractor-demo" element={<ColorExtractorDemo />} /> */}

                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </Suspense>
        </RouteLoader>
      </Router>
      </SocketProvider>
    </NotificationProvider>
  );
}

export default App;

