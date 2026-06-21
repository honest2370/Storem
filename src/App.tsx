import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './store/AppContext';
import { LoadingScreen } from './components/Layout';

// Lazy load pages for better performance
const Landing = lazy(() => import('./pages/Landing').then(m => ({ default: m.Landing })));
const Login = lazy(() => import('./pages/Auth').then(m => ({ default: m.Login })));
const Register = lazy(() => import('./pages/Auth').then(m => ({ default: m.Register })));
const Payment = lazy(() => import('./pages/Payment').then(m => ({ default: m.Payment })));
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Courses = lazy(() => import('./pages/Courses').then(m => ({ default: m.Courses })));
const CourseDetail = lazy(() => import('./pages/Courses').then(m => ({ default: m.CourseDetail })));
const Products = lazy(() => import('./pages/Products').then(m => ({ default: m.Products })));
const ProductDetail = lazy(() => import('./pages/Products').then(m => ({ default: m.ProductDetail })));
const Accounts = lazy(() => import('./pages/Accounts').then(m => ({ default: m.Accounts })));
const Proxies = lazy(() => import('./pages/Proxies').then(m => ({ default: m.Proxies })));
const Tutorials = lazy(() => import('./pages/Tutorials').then(m => ({ default: m.Tutorials })));
const TutorialDetail = lazy(() => import('./pages/Tutorials').then(m => ({ default: m.TutorialDetail })));
const Support = lazy(() => import('./pages/Support').then(m => ({ default: m.Support })));
const TicketDetail = lazy(() => import('./pages/Support').then(m => ({ default: m.TicketDetail })));

// Admin pages
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers').then(m => ({ default: m.AdminUsers })));
const AdminCourses = lazy(() => import('./pages/admin/AdminCourses').then(m => ({ default: m.AdminCourses })));
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts').then(m => ({ default: m.AdminProducts })));
const AdminAccounts = lazy(() => import('./pages/admin/AdminAccounts').then(m => ({ default: m.AdminAccounts })));
const AdminProxies = lazy(() => import('./pages/admin/AdminProxies').then(m => ({ default: m.AdminProxies })));
const AdminNotifications = lazy(() => import('./pages/admin/AdminNotifications').then(m => ({ default: m.AdminNotifications })));
const AdminTickets = lazy(() => import('./pages/admin/AdminTickets').then(m => ({ default: m.AdminTickets })));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings').then(m => ({ default: m.AdminSettings })));

function AppRoutes() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        {/* Public Routes - Full screen */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/payment" element={<Payment />} />

        {/* User Routes - With bottom nav */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/courses/:id" element={<CourseDetail />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/accounts" element={<Accounts />} />
        <Route path="/proxies" element={<Proxies />} />
        <Route path="/tutorials" element={<Tutorials />} />
        <Route path="/tutorials/:id" element={<TutorialDetail />} />
        <Route path="/support" element={<Support />} />
        <Route path="/support/:id" element={<TicketDetail />} />
        <Route path="/wallet" element={<Dashboard />} />
        <Route path="/more" element={<Dashboard />} />

        {/* Admin Routes - Sidebar nav */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/courses" element={<AdminCourses />} />
        <Route path="/admin/products" element={<AdminProducts />} />
        <Route path="/admin/accounts" element={<AdminAccounts />} />
        <Route path="/admin/proxies" element={<AdminProxies />} />
        <Route path="/admin/payments" element={<AdminDashboard />} />
        <Route path="/admin/tickets" element={<AdminTickets />} />
        <Route path="/admin/notifications" element={<AdminNotifications />} />
        <Route path="/admin/podcasts" element={<AdminNotifications />} />
        <Route path="/admin/socials" element={<AdminSettings />} />
        <Route path="/admin/settings" element={<AdminSettings />} />
      </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </BrowserRouter>
  );
}

export default App;
