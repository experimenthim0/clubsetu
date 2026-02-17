import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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

import { NotificationProvider } from './context/NotificationContext';

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
