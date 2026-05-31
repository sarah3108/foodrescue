import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import './App.css';
import Co2EmissionPage from './pages/Co2EmissionPage';
import CustomerCarePage from './pages/CustomerCarePage';
import ComposterHubPage from './pages/ComposterHubPage';
import NgoRequestsPage from './pages/NgoRequestsPage';
import ReviewsPage from './pages/ReviewsPage';
import InsightsPage from './pages/InsightsPage';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const pageRoutes = {
  home: '/',
  dashboard: '/dashboard',
  login: '/login',
  register: '/register',
  donations: '/donations',
  'my-donations': '/my-donations',
  'my-pickups': '/my-pickups',
  profile: '/profile',
  co2: '/co2',
  'customer-care': '/customer-care',
  composterhub: '/composterhub',
  'ngo-requests': '/ngo-requests',
  reviews: '/reviews',
  insights: '/insights'
};

const routePages = Object.entries(pageRoutes).reduce((routes, [page, path]) => {
  routes[path] = page;
  return routes;
}, {});

const initialDonationForm = {
  name: '',
  foodType: '',
  quantity: '',
  location: '',
  contact: ''
};

const initialAuthForm = {
  name: '',
  email: '',
  password: '',
  role: 'volunteer'
};

const makeDonationForm = (user) => ({
  ...initialDonationForm,
  name: user?.name || '',
  contact: user?.email || ''
});

function App() {
  const routerNavigate = useNavigate();
  const location = useLocation();
  const page = routePages[location.pathname] || 'home';
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = window.localStorage.getItem('foodRescueUser');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [donations, setDonations] = useState([]);
  const [donationForm, setDonationForm] = useState(initialDonationForm);
  const [authForm, setAuthForm] = useState(initialAuthForm);
  const [profileForm, setProfileForm] = useState(initialAuthForm);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const navigate = (nextPage) => {
    routerNavigate(pageRoutes[nextPage] || '/');
    setError('');
    setSuccess('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const fetchDonations = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/donations`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to load donations');
      }

      setDonations(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonations();
  }, []);

  useEffect(() => {
    if (currentUser) {
      window.localStorage.setItem('foodRescueUser', JSON.stringify(currentUser));
    } else {
      window.localStorage.removeItem('foodRescueUser');
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      setProfileForm({
        name: currentUser.name,
        email: currentUser.email,
        password: '',
        role: currentUser.role
      });
      setDonationForm((current) => ({
        ...current,
        name: current.name || currentUser.name,
        contact: current.contact || currentUser.email
      }));
    }
  }, [currentUser]);

  useEffect(() => {
    if (['dashboard', 'donations', 'my-donations', 'my-pickups'].includes(page)) {
      fetchDonations();
    }
  }, [page]);

  const stats = useMemo(() => {
    const available = donations.filter((donation) => donation.status === 'available').length;
    const accepted = donations.filter((donation) => donation.status === 'accepted').length;
    const delivered = donations.filter((donation) => donation.status === 'delivered').length;

    return {
      total: donations.length,
      available,
      accepted,
      delivered
    };
  }, [donations]);

  const filteredDonations = useMemo(() => {
    return donations.filter((donation) => {
      const searchText = `${donation.foodType} ${donation.location} ${donation.name}`.toLowerCase();
      const matchesSearch = searchText.includes(searchTerm.toLowerCase());
      const pickupRole = currentUser?.role === 'ngo' || currentUser?.role === 'volunteer';
      const visibleStatus = pickupRole
        ? donation.status === 'available'
        : donation.status !== 'delivered';
      const matchesStatus = pickupRole || statusFilter === 'all' || donation.status === statusFilter;

      return matchesSearch && visibleStatus && matchesStatus;
    });
  }, [currentUser, donations, searchTerm, statusFilter]);

  const myDonations = useMemo(() => {
    if (!currentUser) {
      return [];
    }

    return donations.filter((donation) => {
      const contact = donation.contact?.trim().toLowerCase() || '';
      const donorName = donation.name?.trim().toLowerCase() || '';
      const donorEmail = donation.donorEmail?.trim().toLowerCase() || '';
      const donorId = donation.donorId?.trim() || '';
      const userEmail = currentUser.email.trim().toLowerCase();
      const userName = currentUser.name.trim().toLowerCase();

      return (
        donorId === currentUser.id ||
        donorEmail === userEmail ||
        contact.includes(userEmail) ||
        donorName === userName ||
        donorName.includes(userName)
      );
    });
  }, [currentUser, donations]);

  const myPickups = useMemo(() => {
    if (!currentUser) {
      return [];
    }

    const userEmail = currentUser.email.trim().toLowerCase();

    return donations.filter((donation) => {
      const reservedById = donation.reservedById?.trim() || '';
      const reservedByEmail = donation.reservedByEmail?.trim().toLowerCase() || '';

      return reservedById === currentUser.id || reservedByEmail === userEmail;
    });
  }, [currentUser, donations]);

  const handleDonationInput = (event) => {
    const { name, value } = event.target;
    setDonationForm((current) => ({ ...current, [name]: value }));
  };

  const handleAuthInput = (event) => {
    const { name, value } = event.target;
    setAuthForm((current) => ({ ...current, [name]: value }));
  };

  const handleProfileInput = (event) => {
    const { name, value } = event.target;
    setProfileForm((current) => ({ ...current, [name]: value }));
  };

  const handleDonationSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_URL}/donations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...donationForm,
          donorId: currentUser?.id,
          donorEmail: currentUser?.email
        })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to add donation');
      }

      setDonations((current) => [data, ...current]);
      setDonationForm(makeDonationForm(currentUser));
      setSuccess('Donation posted and ready for pickup coordination.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAuthSubmit = async (event, mode) => {
    event.preventDefault();
    setAuthLoading(true);
    setError('');
    setSuccess('');

    const payload =
      mode === 'register'
        ? authForm
        : {
            email: authForm.email,
            password: authForm.password
          };

    try {
      const response = await fetch(`${API_URL}/users/${mode}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to continue');
      }

      setCurrentUser(data.user);
      setProfileForm({
        name: data.user.name,
        email: data.user.email,
        password: '',
        role: data.user.role
      });
      setDonationForm(makeDonationForm(data.user));
      setAuthForm(initialAuthForm);
      setSuccess(mode === 'register' ? 'Account created. Welcome in.' : 'Welcome back.');
      navigate('dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAccept = async (id) => {
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_URL}/donations/accept/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reservedBy: currentUser
            ? {
                id: currentUser.id,
                name: currentUser.name,
                email: currentUser.email
              }
            : null
        })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to reserve donation');
      }

      setDonations((current) =>
        current.map((donation) => (donation._id === id ? data : donation))
      );
      setSuccess('Donation reserved for pickup.');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleComplete = async (id) => {
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_URL}/donations/complete/${id}`, {
        method: 'DELETE'
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to complete donation');
      }

      setDonations((current) =>
        current.map((donation) => (donation._id === id ? data : donation))
      );
      setSuccess('Pickup completed and marked as delivered.');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setProfileForm(initialAuthForm);
    setDonationForm(initialDonationForm);
    setSuccess('');
    navigate('home');
  };

  const handleProfileSave = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_URL}/users/${currentUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: profileForm.name,
          email: profileForm.email,
          role: profileForm.role
        })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to update profile');
      }

      setCurrentUser(data.user);
      setProfileForm({
        name: data.user.name,
        email: data.user.email,
        password: '',
        role: data.user.role
      });
      setDonationForm((current) => ({
        ...current,
        name: data.user.name,
        contact: data.user.email
      }));
      setSuccess('Profile updated.');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="app-shell">
      <AppNav
        currentUser={currentUser}
        onNavigate={navigate}
        onLogout={handleLogout}
        page={page}
      />

      <Routes>
        <Route path="/" element={<HomePage onNavigate={navigate} stats={stats} />} />
        <Route
          path="/dashboard"
          element={(
            <DashboardPage
              currentUser={currentUser}
              myDonations={myDonations}
              myPickups={myPickups}
              onNavigate={navigate}
              stats={stats}
            />
          )}
        />
        <Route
          path="/login"
          element={(
            <AuthPage
              authForm={authForm}
              authLoading={authLoading}
              error={error}
              mode="login"
              onChange={handleAuthInput}
              onNavigate={navigate}
              onSubmit={handleAuthSubmit}
            />
          )}
        />
        <Route
          path="/register"
          element={(
            <AuthPage
              authForm={authForm}
              authLoading={authLoading}
              error={error}
              mode="register"
              onChange={handleAuthInput}
              onNavigate={navigate}
              onSubmit={handleAuthSubmit}
            />
          )}
        />
        <Route
          path="/donations"
          element={(
            <DonationsPage
              donationForm={donationForm}
              donations={filteredDonations}
              error={error}
              loading={loading}
              saving={saving}
              searchTerm={searchTerm}
              stats={stats}
              statusFilter={statusFilter}
              currentUser={currentUser}
              success={success}
              onAccept={handleAccept}
              onChange={handleDonationInput}
              onComplete={handleComplete}
              onRefresh={fetchDonations}
              onSearchChange={setSearchTerm}
              onStatusChange={setStatusFilter}
              onSubmit={handleDonationSubmit}
            />
          )}
        />
        <Route
          path="/my-donations"
          element={(
            <MyDonationsPage
              currentUser={currentUser}
              donations={myDonations}
              error={error}
              loading={loading}
              onComplete={handleComplete}
              onNavigate={navigate}
              onRefresh={fetchDonations}
            />
          )}
        />
        <Route
          path="/my-pickups"
          element={(
            <MyPickupsPage
              currentUser={currentUser}
              donations={myPickups}
              error={error}
              loading={loading}
              onComplete={handleComplete}
              onNavigate={navigate}
              onRefresh={fetchDonations}
            />
          )}
        />
        <Route
          path="/profile"
          element={(
            <ProfilePage
              currentUser={currentUser}
              form={profileForm}
              onChange={handleProfileInput}
              onNavigate={navigate}
              onSubmit={handleProfileSave}
              error={error}
              success={success}
            />
          )}
        />
        <Route path="/co2" element={<Co2EmissionPage donations={donations} />} />
        <Route path="/customer-care" element={<CustomerCarePage apiUrl={API_URL} currentUser={currentUser} />} />
        <Route path="/composterhub" element={<ComposterHubPage apiUrl={API_URL} currentUser={currentUser} />} />
        <Route path="/ngo-requests" element={<NgoRequestsPage apiUrl={API_URL} currentUser={currentUser} />} />
        <Route path="/reviews" element={<ReviewsPage apiUrl={API_URL} currentUser={currentUser} />} />
        <Route path="/insights" element={<InsightsPage apiUrl={API_URL} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <SiteFooter onNavigate={navigate} />
    </div>
  );
}

function AppNav({ currentUser, onLogout, onNavigate, page }) {
  const pickupRole = currentUser?.role === 'ngo' || currentUser?.role === 'volunteer';

  return (
    <header className="site-header">
      <nav className="topbar" aria-label="Primary navigation">
        <button className="brand nav-button" type="button" onClick={() => onNavigate('home')}>
          <span className="brand-mark">FR</span>
          <span>Food Rescue</span>
        </button>

        <div className="nav-links">
          <button
            className={page === 'home' ? 'nav-link active' : 'nav-link'}
            type="button"
            onClick={() => onNavigate('home')}
          >
            Home
          </button>
          <button
            className={page === 'donations' ? 'nav-link active' : 'nav-link'}
            type="button"
            onClick={() => onNavigate('donations')}
          >
            Donations
          </button>
          <button
            className={page === 'co2' ? 'nav-link active' : 'nav-link'}
            type="button"
            onClick={() => onNavigate('co2')}
          >
            CO2
          </button>
          <button
            className={page === 'insights' ? 'nav-link active' : 'nav-link'}
            type="button"
            onClick={() => onNavigate('insights')}
          >
            AI Map
          </button>
          <button
            className={page === 'composterhub' ? 'nav-link active' : 'nav-link'}
            type="button"
            onClick={() => onNavigate('composterhub')}
          >
            ComposterHub
          </button>
          <button
            className={page === 'ngo-requests' ? 'nav-link active' : 'nav-link'}
            type="button"
            onClick={() => onNavigate('ngo-requests')}
          >
            NGO Requests
          </button>
          <button
            className={page === 'reviews' ? 'nav-link active' : 'nav-link'}
            type="button"
            onClick={() => onNavigate('reviews')}
          >
            Reviews
          </button>
          <button
            className={page === 'customer-care' ? 'nav-link active' : 'nav-link'}
            type="button"
            onClick={() => onNavigate('customer-care')}
          >
            Care
          </button>
          {currentUser ? (
            <>
              <button
                className={page === 'dashboard' ? 'nav-link active' : 'nav-link'}
                type="button"
                onClick={() => onNavigate('dashboard')}
              >
                Dashboard
              </button>
              <button
                className={page === 'my-donations' ? 'nav-link active' : 'nav-link'}
                type="button"
                onClick={() => onNavigate('my-donations')}
              >
                My Donations
              </button>
              {pickupRole && (
                <button
                  className={page === 'my-pickups' ? 'nav-link active' : 'nav-link'}
                  type="button"
                  onClick={() => onNavigate('my-pickups')}
                >
                  My Pickups
                </button>
              )}
              <button
                className={page === 'profile' ? 'nav-link active' : 'nav-link'}
                type="button"
                onClick={() => onNavigate('profile')}
              >
                Profile
              </button>
              <span className="user-chip">{currentUser.name}</span>
              <button className="nav-action" type="button" onClick={onLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <button
                className={page === 'login' ? 'nav-link active' : 'nav-link'}
                type="button"
                onClick={() => onNavigate('login')}
              >
                Login
              </button>
              <button className="nav-action" type="button" onClick={() => onNavigate('register')}>
                Register
              </button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}

function SiteFooter({ onNavigate }) {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div>
          <button className="brand footer-brand" type="button" onClick={() => onNavigate('home')}>
            <span className="brand-mark">FR</span>
            <span>Food Rescue</span>
          </button>
          <p>Rescue surplus food, support NGOs, reduce waste, and track community impact.</p>
        </div>
        <div className="footer-links" aria-label="Footer navigation">
          <button type="button" onClick={() => onNavigate('donations')}>Donations</button>
          <button type="button" onClick={() => onNavigate('co2')}>CO2 Impact</button>
          <button type="button" onClick={() => onNavigate('insights')}>AI Map</button>
          <button type="button" onClick={() => onNavigate('customer-care')}>Customer Care</button>
        </div>
      </div>
    </footer>
  );
}

function HomePage({ onNavigate, stats }) {
  return (
    <main className="home-page">
      <section className="hero hero-home">
        <div className="hero-content">
          <div>
            <p className="eyebrow">Surplus food coordination</p>
            <h1>Move good food from extra to needed, faster.</h1>
            <p className="hero-copy">
              Food Rescue helps donors post surplus meals and lets volunteers coordinate pickups
              from a dedicated donation board.
            </p>
            <div className="hero-actions">
              <button className="primary-button" type="button" onClick={() => onNavigate('donations')}>
                View donations
              </button>
              <button className="light-button" type="button" onClick={() => onNavigate('register')}>
                Create account
              </button>
            </div>
          </div>

          <div className="hero-panel" aria-label="Donation summary">
            <div>
              <span className="metric-value">{stats.available}</span>
              <span className="metric-label">available now</span>
            </div>
            <div>
              <span className="metric-value">{stats.accepted}</span>
              <span className="metric-label">reserved</span>
            </div>
            <div>
              <span className="metric-value">{stats.delivered}</span>
              <span className="metric-label">delivered</span>
            </div>
            <div>
              <span className="metric-value">{stats.total}</span>
              <span className="metric-label">total posts</span>
            </div>
          </div>
        </div>
      </section>

      <section className="info-band" aria-label="How Food Rescue works">
        <article>
          <span>1</span>
          <h2>Donors post surplus</h2>
          <p>Restaurants and event teams list food, quantity, contact, and pickup location.</p>
        </article>
        <article>
          <span>2</span>
          <h2>Teams reserve pickup</h2>
          <p>Volunteers or NGOs mark donations as reserved so everyone sees the current status.</p>
        </article>
        <article>
          <span>3</span>
          <h2>Completed pickups stay tracked</h2>
          <p>Finished rescues stay visible with a delivered tag for donor history.</p>
        </article>
      </section>
    </main>
  );
}

function AuthPage({ authForm, authLoading, error, mode, onChange, onNavigate, onSubmit }) {
  const isRegister = mode === 'register';

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <div className="section-heading">
          <p className="eyebrow">{isRegister ? 'Join the network' : 'Welcome back'}</p>
          <h1>{isRegister ? 'Create your account' : 'Login to Food Rescue'}</h1>
          <p>
            {isRegister
              ? 'Register as a donor, volunteer, or NGO to coordinate food rescue work.'
              : 'Access the donation board and manage food pickup activity.'}
          </p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form className="auth-form" onSubmit={(event) => onSubmit(event, mode)}>
          {isRegister && (
            <label>
              Full name
              <input
                type="text"
                name="name"
                placeholder="Your full name"
                value={authForm.name}
                onChange={onChange}
                required
              />
            </label>
          )}

          <label>
            Email
            <input
              type="email"
              name="email"
              placeholder="you@example.com"
              value={authForm.email}
              onChange={onChange}
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              name="password"
              placeholder="At least 6 characters"
              value={authForm.password}
              onChange={onChange}
              required
            />
          </label>

          {isRegister && (
            <label>
              Role
              <select name="role" value={authForm.role} onChange={onChange}>
                <option value="volunteer">Volunteer</option>
                <option value="donor">Food donor</option>
                <option value="ngo">NGO</option>
              </select>
            </label>
          )}

          <button className="primary-button" type="submit" disabled={authLoading}>
            {authLoading ? 'Please wait...' : isRegister ? 'Create account' : 'Login'}
          </button>
        </form>

        <p className="auth-switch">
          {isRegister ? 'Already have an account?' : 'New to Food Rescue?'}
          <button type="button" onClick={() => onNavigate(isRegister ? 'login' : 'register')}>
            {isRegister ? 'Login' : 'Register'}
          </button>
        </p>
      </section>
    </main>
  );
}

function DashboardPage({ currentUser, myDonations, myPickups, onNavigate, stats }) {
  if (!currentUser) {
    return (
      <AuthRequiredPage
        onNavigate={onNavigate}
        title="Login to view your dashboard"
      />
    );
  }

  const pickupRole = currentUser.role === 'ngo' || currentUser.role === 'volunteer';
  const deliveredMine = myDonations.filter((donation) => donation.status === 'delivered').length;
  const deliveredPickups = myPickups.filter((donation) => donation.status === 'delivered').length;

  return (
    <main className="dashboard-page">
      <section className="page-title">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1>Welcome back, {currentUser.name}</h1>
        </div>
        <button className="primary-button" type="button" onClick={() => onNavigate('donations')}>
          Post or view donations
        </button>
      </section>

      <section className="dashboard-grid" aria-label="Dashboard summary">
        <article className="stat-card">
          <span>{stats.available}</span>
          <h2>Available donations</h2>
          <p>Open food posts that can still be reserved.</p>
        </article>
        <article className="stat-card">
          <span>{stats.accepted}</span>
          <h2>Reserved pickups</h2>
          <p>Food already claimed by a pickup team.</p>
        </article>
        <article className="stat-card">
          <span>{pickupRole ? myPickups.length : myDonations.length}</span>
          <h2>{pickupRole ? 'My pickups' : 'My posts'}</h2>
          <p>
            {pickupRole
              ? 'Food reservations claimed by your pickup team.'
              : 'Donations connected to your account email or name.'}
          </p>
        </article>
        <article className="stat-card">
          <span>{pickupRole ? deliveredPickups : deliveredMine}</span>
          <h2>{pickupRole ? 'Delivered to us' : 'My delivered posts'}</h2>
          <p>
            {pickupRole
              ? 'Reserved food marked as successfully delivered.'
              : 'Your donations already picked up and completed.'}
          </p>
        </article>
      </section>

      <section className="quick-actions">
        <div>
          <p className="eyebrow">Next steps</p>
          <h2>Keep the rescue board moving</h2>
        </div>
        <div className="action-row">
          <button className="secondary-button" type="button" onClick={() => onNavigate('donations')}>
            {pickupRole ? 'Find food' : 'Add donation'}
          </button>
          <button className="ghost-button" type="button" onClick={() => onNavigate('my-donations')}>
            Review my donations
          </button>
          {pickupRole && (
            <button className="ghost-button" type="button" onClick={() => onNavigate('my-pickups')}>
              Track my pickups
            </button>
          )}
          <button className="ghost-button" type="button" onClick={() => onNavigate('profile')}>
            Update profile
          </button>
        </div>
      </section>
    </main>
  );
}

function MyDonationsPage({ currentUser, donations, error, loading, onComplete, onNavigate, onRefresh }) {
  if (!currentUser) {
    return (
      <AuthRequiredPage
        onNavigate={onNavigate}
        title="Login to see your donations"
      />
    );
  }

  return (
    <main className="donations-page">
      <section className="page-title">
        <div>
          <p className="eyebrow">My donations</p>
          <h1>Food posts linked to your account</h1>
        </div>
        <div className="action-row">
          <button className="ghost-button" type="button" onClick={onRefresh}>
            Refresh
          </button>
          <button className="primary-button" type="button" onClick={() => onNavigate('donations')}>
            Post donation
          </button>
        </div>
      </section>

      <section className="board-panel solo-panel">
        {error && <div className="alert alert-error">{error}</div>}

        {loading ? (
          <div className="empty-state">Loading your donations...</div>
        ) : donations.length === 0 ? (
          <div className="empty-state">
            <h3>No donations linked to you yet</h3>
            <p>Post a donation while logged in and it will appear here automatically.</p>
            <button className="primary-button" type="button" onClick={() => onNavigate('donations')}>
              Post your first donation
            </button>
          </div>
        ) : (
          <div className="donation-list">
            {donations.map((donation) => (
              <DonationCard
                donation={donation}
                key={donation._id}
                onComplete={onComplete}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function MyPickupsPage({ currentUser, donations, error, loading, onComplete, onNavigate, onRefresh }) {
  if (!currentUser) {
    return (
      <AuthRequiredPage
        onNavigate={onNavigate}
        title="Login to track your pickups"
      />
    );
  }

  const pickupRole = currentUser.role === 'ngo' || currentUser.role === 'volunteer';

  if (!pickupRole) {
    return (
      <AuthRequiredPage
        onNavigate={onNavigate}
        title="Pickup tracking is for NGOs and volunteers"
      />
    );
  }

  const reserved = donations.filter((donation) => donation.status === 'accepted').length;
  const delivered = donations.filter((donation) => donation.status === 'delivered').length;

  return (
    <main className="donations-page">
      <section className="page-title">
        <div>
          <p className="eyebrow">My pickups</p>
          <h1>Food reserved for your team</h1>
        </div>
        <div className="compact-stats" aria-label="Pickup summary">
          <span>{reserved} reserved</span>
          <span>{delivered} delivered</span>
          <span>{donations.length} total</span>
        </div>
      </section>

      <section className="board-panel solo-panel">
        <div className="section-heading board-heading">
          <div>
            <p className="eyebrow">Pickup history</p>
            <h2>Reserved and delivered food</h2>
          </div>
          <div className="action-row">
            <button className="ghost-button" type="button" onClick={onRefresh}>
              Refresh
            </button>
            <button className="primary-button" type="button" onClick={() => onNavigate('donations')}>
              Find food
            </button>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {loading ? (
          <div className="empty-state">Loading your pickups...</div>
        ) : donations.length === 0 ? (
          <div className="empty-state">
            <h3>No pickups tracked yet</h3>
            <p>Reserve available food and it will appear here for follow-up.</p>
            <button className="primary-button" type="button" onClick={() => onNavigate('donations')}>
              Find available food
            </button>
          </div>
        ) : (
          <div className="donation-list">
            {donations.map((donation) => (
              <DonationCard
                donation={donation}
                key={donation._id}
                onComplete={onComplete}
                showPickupDetails
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function ProfilePage({ currentUser, error, form, onChange, onNavigate, onSubmit, success }) {
  if (!currentUser) {
    return (
      <AuthRequiredPage
        onNavigate={onNavigate}
        title="Login to manage your profile"
      />
    );
  }

  return (
    <main className="profile-page">
      <section className="auth-panel profile-panel">
        <div className="section-heading">
          <p className="eyebrow">Profile</p>
          <h1>Account settings</h1>
          <p>Keep your visible account details aligned with your food rescue role.</p>
        </div>

        {success && <div className="alert alert-success">{success}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        <form className="auth-form" onSubmit={onSubmit}>
          <label>
            Full name
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={onChange}
              required
            />
          </label>

          <label>
            Email
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={onChange}
              required
            />
          </label>

          <label>
            Role
            <select name="role" value={form.role} onChange={onChange}>
              <option value="volunteer">Volunteer</option>
              <option value="donor">Food donor</option>
              <option value="ngo">NGO</option>
            </select>
          </label>

          <button className="primary-button" type="submit">
            Save profile
          </button>
        </form>
      </section>
    </main>
  );
}

function AuthRequiredPage({ onNavigate, title }) {
  return (
    <main className="auth-page">
      <section className="auth-panel">
        <div className="section-heading">
          <p className="eyebrow">Account required</p>
          <h1>{title}</h1>
          <p>Create an account or login to access this part of Food Rescue.</p>
        </div>
        <div className="action-row">
          <button className="primary-button" type="button" onClick={() => onNavigate('login')}>
            Login
          </button>
          <button className="ghost-button" type="button" onClick={() => onNavigate('register')}>
            Register
          </button>
        </div>
      </section>
    </main>
  );
}

function DonationsPage({
  currentUser,
  donationForm,
  donations,
  error,
  loading,
  onAccept,
  onChange,
  onComplete,
  onRefresh,
  onSearchChange,
  onStatusChange,
  onSubmit,
  saving,
  searchTerm,
  stats,
  statusFilter,
  success
}) {
  const pickupRole = currentUser?.role === 'ngo' || currentUser?.role === 'volunteer';

  return (
    <main className="donations-page">
      <section className="page-title">
        <div>
          <p className="eyebrow">Donation workspace</p>
          <h1>Post and manage available food</h1>
        </div>
        <div className="compact-stats" aria-label="Donation summary">
          <span>{stats.available} available</span>
          <span>{stats.accepted} reserved</span>
          <span>{stats.delivered} delivered</span>
          <span>{stats.total} total</span>
        </div>
      </section>

      <section className="main-grid">
        <section className="form-panel">
          <div className="section-heading">
            <p className="eyebrow">New rescue</p>
            <h2>Post a donation</h2>
          </div>

          <form className="donation-form" onSubmit={onSubmit}>
            <label>
              Donor name
              <input
                type="text"
                name="name"
                placeholder="Green Garden Cafe"
                value={donationForm.name}
                onChange={onChange}
                required
              />
            </label>

            <label>
              Food type
              <input
                type="text"
                name="foodType"
                placeholder="Fresh sandwiches"
                value={donationForm.foodType}
                onChange={onChange}
                required
              />
            </label>

            <label>
              Quantity
              <input
                type="text"
                name="quantity"
                placeholder="24 meal boxes"
                value={donationForm.quantity}
                onChange={onChange}
                required
              />
            </label>

            <label>
              Pickup location
              <input
                type="text"
                name="location"
                placeholder="Downtown, Gate 2"
                value={donationForm.location}
                onChange={onChange}
                required
              />
            </label>

            <label className="full-span">
              Contact email or phone
              <input
                type="text"
                name="contact"
                placeholder="pickup@example.com"
                value={donationForm.contact}
                onChange={onChange}
                required
              />
            </label>

            <button className="primary-button full-span" type="submit" disabled={saving}>
              {saving ? 'Posting donation...' : 'Post donation'}
            </button>
          </form>
        </section>

        <section className="board-panel">
          <div className="section-heading board-heading">
            <div>
              <p className="eyebrow">Live board</p>
              <h2>Available donations</h2>
            </div>

            <button className="ghost-button" type="button" onClick={onRefresh}>
              Refresh
            </button>
          </div>

          <div className="filters" aria-label="Donation filters">
            <input
              type="search"
              placeholder="Search food, donor, or location"
              value={searchTerm}
              onChange={(event) => onSearchChange(event.target.value)}
            />

            {pickupRole ? (
              <select value="available" aria-label="Filter by status" disabled>
                <option value="available">Available only</option>
              </select>
            ) : (
              <select
                value={statusFilter}
                onChange={(event) => onStatusChange(event.target.value)}
                aria-label="Filter by status"
              >
                <option value="all">All statuses</option>
                <option value="available">Available</option>
                <option value="accepted">Reserved</option>
              </select>
            )}
          </div>

          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          {loading ? (
            <div className="empty-state">Loading donations...</div>
          ) : donations.length === 0 ? (
            <div className="empty-state">
              <h3>No matching donations yet</h3>
              <p>Post the first item or adjust the search filters.</p>
            </div>
          ) : (
            <div className="donation-list">
              {donations.map((donation) => (
                <DonationCard
                  donation={donation}
                  key={donation._id}
                  onAccept={onAccept}
                  onComplete={onComplete}
                />
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

function DonationCard({ donation, onAccept, onComplete, showPickupDetails = false }) {
  return (
    <article className="donation-card">
      <div className="card-topline">
        <span className={`status-pill status-${donation.status}`}>
          {donation.status === 'accepted'
            ? 'Reserved'
            : donation.status === 'delivered'
              ? 'Delivered'
              : 'Available'}
        </span>
        <time dateTime={donation.createdAt}>
          {new Date(donation.createdAt).toLocaleDateString()}
        </time>
      </div>

      <h3>{donation.foodType}</h3>
      <p className="quantity">{donation.quantity}</p>

      <dl className="donation-details">
        <div>
          <dt>Donor</dt>
          <dd>{donation.name}</dd>
        </div>
        <div>
          <dt>Location</dt>
          <dd>{donation.location}</dd>
        </div>
        <div>
          <dt>Contact</dt>
          <dd>{donation.contact}</dd>
        </div>
        {showPickupDetails && (
          <>
            <div>
              <dt>Reserved by</dt>
              <dd>{donation.reservedByName || 'Your team'}</dd>
            </div>
            <div>
              <dt>Reserved on</dt>
              <dd>
                {donation.reservedAt
                  ? new Date(donation.reservedAt).toLocaleDateString()
                  : 'Pending'}
              </dd>
            </div>
            <div>
              <dt>Delivered on</dt>
              <dd>
                {donation.deliveredAt
                  ? new Date(donation.deliveredAt).toLocaleDateString()
                  : 'Not delivered yet'}
              </dd>
            </div>
          </>
        )}
      </dl>

      <div className="card-actions">
        {onAccept && (
          <button
            className="secondary-button"
            type="button"
            onClick={() => onAccept(donation._id)}
            disabled={donation.status !== 'available'}
          >
            Reserve
          </button>
        )}
        <button
          className="text-button"
          type="button"
          onClick={() => onComplete(donation._id)}
          disabled={donation.status === 'delivered'}
        >
          Complete pickup
        </button>
      </div>
    </article>
  );
}

export default App;
import React, { useEffect, useMemo, useState } from 'react';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const initialDonationForm = {
  name: '',
  foodType: '',
  quantity: '',
  location: '',
  contact: ''
};

const initialAuthForm = {
  name: '',
  email: '',
  password: '',
  role: 'volunteer'
};

const makeDonationForm = (user) => ({
  ...initialDonationForm,
  name: user?.name || '',
  contact: user?.email || ''
});

function App() {
  const [page, setPage] = useState('home');
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = window.localStorage.getItem('foodRescueUser');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [donations, setDonations] = useState([]);
  const [donationForm, setDonationForm] = useState(initialDonationForm);
  const [authForm, setAuthForm] = useState(initialAuthForm);
  const [profileForm, setProfileForm] = useState(initialAuthForm);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const navigate = (nextPage) => {
    setPage(nextPage);
    setError('');
    setSuccess('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const fetchDonations = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/donations`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to load donations');
      }

      setDonations(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonations();
  }, []);

  useEffect(() => {
    if (currentUser) {
      window.localStorage.setItem('foodRescueUser', JSON.stringify(currentUser));
    } else {
      window.localStorage.removeItem('foodRescueUser');
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      setProfileForm({
        name: currentUser.name,
        email: currentUser.email,
        password: '',
        role: currentUser.role
      });
      setDonationForm((current) => ({
        ...current,
        name: current.name || currentUser.name,
        contact: current.contact || currentUser.email
      }));
    }
  }, [currentUser]);

  useEffect(() => {
    if (['dashboard', 'donations', 'my-donations', 'my-pickups'].includes(page)) {
      fetchDonations();
    }
  }, [page]);

  const stats = useMemo(() => {
    const available = donations.filter((donation) => donation.status === 'available').length;
    const accepted = donations.filter((donation) => donation.status === 'accepted').length;
    const delivered = donations.filter((donation) => donation.status === 'delivered').length;

    return {
      total: donations.length,
      available,
      accepted,
      delivered
    };
  }, [donations]);

  const filteredDonations = useMemo(() => {
    return donations.filter((donation) => {
      const searchText = `${donation.foodType} ${donation.location} ${donation.name}`.toLowerCase();
      const matchesSearch = searchText.includes(searchTerm.toLowerCase());
      const pickupRole = currentUser?.role === 'ngo' || currentUser?.role === 'volunteer';
      const visibleStatus = pickupRole
        ? donation.status === 'available'
        : donation.status !== 'delivered';
      const matchesStatus = pickupRole || statusFilter === 'all' || donation.status === statusFilter;

      return matchesSearch && visibleStatus && matchesStatus;
    });
  }, [currentUser, donations, searchTerm, statusFilter]);

  const myDonations = useMemo(() => {
    if (!currentUser) {
      return [];
    }

    return donations.filter((donation) => {
      const contact = donation.contact?.trim().toLowerCase() || '';
      const donorName = donation.name?.trim().toLowerCase() || '';
      const donorEmail = donation.donorEmail?.trim().toLowerCase() || '';
      const donorId = donation.donorId?.trim() || '';
      const userEmail = currentUser.email.trim().toLowerCase();
      const userName = currentUser.name.trim().toLowerCase();

      return (
        donorId === currentUser.id ||
        donorEmail === userEmail ||
        contact.includes(userEmail) ||
        donorName === userName ||
        donorName.includes(userName)
      );
    });
  }, [currentUser, donations]);

  const myPickups = useMemo(() => {
    if (!currentUser) {
      return [];
    }

    const userEmail = currentUser.email.trim().toLowerCase();

    return donations.filter((donation) => {
      const reservedById = donation.reservedById?.trim() || '';
      const reservedByEmail = donation.reservedByEmail?.trim().toLowerCase() || '';

      return reservedById === currentUser.id || reservedByEmail === userEmail;
    });
  }, [currentUser, donations]);

  const handleDonationInput = (event) => {
    const { name, value } = event.target;
    setDonationForm((current) => ({ ...current, [name]: value }));
  };

  const handleAuthInput = (event) => {
    const { name, value } = event.target;
    setAuthForm((current) => ({ ...current, [name]: value }));
  };

  const handleProfileInput = (event) => {
    const { name, value } = event.target;
    setProfileForm((current) => ({ ...current, [name]: value }));
  };

  const handleDonationSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_URL}/donations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...donationForm,
          donorId: currentUser?.id,
          donorEmail: currentUser?.email
        })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to add donation');
      }

      setDonations((current) => [data, ...current]);
      setDonationForm(makeDonationForm(currentUser));
      setSuccess('Donation posted and ready for pickup coordination.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAuthSubmit = async (event, mode) => {
    event.preventDefault();
    setAuthLoading(true);
    setError('');
    setSuccess('');

    const payload =
      mode === 'register'
        ? authForm
        : {
            email: authForm.email,
            password: authForm.password
          };

    try {
      const response = await fetch(`${API_URL}/users/${mode}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to continue');
      }

      setCurrentUser(data.user);
      setProfileForm({
        name: data.user.name,
        email: data.user.email,
        password: '',
        role: data.user.role
      });
      setDonationForm(makeDonationForm(data.user));
      setAuthForm(initialAuthForm);
      setSuccess(mode === 'register' ? 'Account created. Welcome in.' : 'Welcome back.');
      navigate('dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAccept = async (id) => {
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_URL}/donations/accept/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reservedBy: currentUser
            ? {
                id: currentUser.id,
                name: currentUser.name,
                email: currentUser.email
              }
            : null
        })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to reserve donation');
      }

      setDonations((current) =>
        current.map((donation) => (donation._id === id ? data : donation))
      );
      setSuccess('Donation reserved for pickup.');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleComplete = async (id) => {
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_URL}/donations/complete/${id}`, {
        method: 'DELETE'
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to complete donation');
      }

      setDonations((current) =>
        current.map((donation) => (donation._id === id ? data : donation))
      );
      setSuccess('Pickup completed and marked as delivered.');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setProfileForm(initialAuthForm);
    setDonationForm(initialDonationForm);
    setSuccess('');
    navigate('home');
  };

  const handleProfileSave = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_URL}/users/${currentUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: profileForm.name,
          email: profileForm.email,
          role: profileForm.role
        })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to update profile');
      }

      setCurrentUser(data.user);
      setProfileForm({
        name: data.user.name,
        email: data.user.email,
        password: '',
        role: data.user.role
      });
      setDonationForm((current) => ({
        ...current,
        name: data.user.name,
        contact: data.user.email
      }));
      setSuccess('Profile updated.');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="app-shell">
      <AppNav
        currentUser={currentUser}
        onNavigate={navigate}
        onLogout={handleLogout}
        page={page}
      />

      {page === 'home' && (
        <HomePage onNavigate={navigate} stats={stats} />
      )}

      {page === 'dashboard' && (
        <DashboardPage
          currentUser={currentUser}
          myDonations={myDonations}
          myPickups={myPickups}
          onNavigate={navigate}
          stats={stats}
        />
      )}

      {page === 'login' && (
        <AuthPage
          authForm={authForm}
          authLoading={authLoading}
          error={error}
          mode="login"
          onChange={handleAuthInput}
          onNavigate={navigate}
          onSubmit={handleAuthSubmit}
        />
      )}

      {page === 'register' && (
        <AuthPage
          authForm={authForm}
          authLoading={authLoading}
          error={error}
          mode="register"
          onChange={handleAuthInput}
          onNavigate={navigate}
          onSubmit={handleAuthSubmit}
        />
      )}

      {page === 'donations' && (
        <DonationsPage
          donationForm={donationForm}
          donations={filteredDonations}
          error={error}
          loading={loading}
          saving={saving}
          searchTerm={searchTerm}
          stats={stats}
          statusFilter={statusFilter}
          currentUser={currentUser}
          success={success}
          onAccept={handleAccept}
          onChange={handleDonationInput}
          onComplete={handleComplete}
          onRefresh={fetchDonations}
          onSearchChange={setSearchTerm}
          onStatusChange={setStatusFilter}
          onSubmit={handleDonationSubmit}
        />
      )}

      {page === 'my-donations' && (
        <MyDonationsPage
          currentUser={currentUser}
          donations={myDonations}
          error={error}
          loading={loading}
          onComplete={handleComplete}
          onNavigate={navigate}
          onRefresh={fetchDonations}
        />
      )}

      {page === 'my-pickups' && (
        <MyPickupsPage
          currentUser={currentUser}
          donations={myPickups}
          error={error}
          loading={loading}
          onComplete={handleComplete}
          onNavigate={navigate}
          onRefresh={fetchDonations}
        />
      )}

      {page === 'profile' && (
        <ProfilePage
          currentUser={currentUser}
          form={profileForm}
          onChange={handleProfileInput}
          onNavigate={navigate}
          onSubmit={handleProfileSave}
          error={error}
          success={success}
        />
      )}
    </div>
  );
}

function AppNav({ currentUser, onLogout, onNavigate, page }) {
  const pickupRole = currentUser?.role === 'ngo' || currentUser?.role === 'volunteer';

  return (
    <header className="site-header">
      <nav className="topbar" aria-label="Primary navigation">
        <button className="brand nav-button" type="button" onClick={() => onNavigate('home')}>
          <span className="brand-mark">FR</span>
          <span>Food Rescue</span>
        </button>

        <div className="nav-links">
          <button
            className={page === 'home' ? 'nav-link active' : 'nav-link'}
            type="button"
            onClick={() => onNavigate('home')}
          >
            Home
          </button>
          <button
            className={page === 'donations' ? 'nav-link active' : 'nav-link'}
            type="button"
            onClick={() => onNavigate('donations')}
          >
            Donations
          </button>
          {currentUser ? (
            <>
              <button
                className={page === 'dashboard' ? 'nav-link active' : 'nav-link'}
                type="button"
                onClick={() => onNavigate('dashboard')}
              >
                Dashboard
              </button>
              <button
                className={page === 'my-donations' ? 'nav-link active' : 'nav-link'}
                type="button"
                onClick={() => onNavigate('my-donations')}
              >
                My Donations
              </button>
              {pickupRole && (
                <button
                  className={page === 'my-pickups' ? 'nav-link active' : 'nav-link'}
                  type="button"
                  onClick={() => onNavigate('my-pickups')}
                >
                  My Pickups
                </button>
              )}
              <button
                className={page === 'profile' ? 'nav-link active' : 'nav-link'}
                type="button"
                onClick={() => onNavigate('profile')}
              >
                Profile
              </button>
              <span className="user-chip">{currentUser.name}</span>
              <button className="nav-action" type="button" onClick={onLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <button
                className={page === 'login' ? 'nav-link active' : 'nav-link'}
                type="button"
                onClick={() => onNavigate('login')}
              >
                Login
              </button>
              <button className="nav-action" type="button" onClick={() => onNavigate('register')}>
                Register
              </button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}

function HomePage({ onNavigate, stats }) {
  return (
    <main className="home-page">
      <section className="hero hero-home">
        <div className="hero-content">
          <div>
            <p className="eyebrow">Surplus food coordination</p>
            <h1>Move good food from extra to needed, faster.</h1>
            <p className="hero-copy">
              Food Rescue helps donors post surplus meals and lets volunteers coordinate pickups
              from a dedicated donation board.
            </p>
            <div className="hero-actions">
              <button className="primary-button" type="button" onClick={() => onNavigate('donations')}>
                View donations
              </button>
              <button className="light-button" type="button" onClick={() => onNavigate('register')}>
                Create account
              </button>
            </div>
          </div>

          <div className="hero-panel" aria-label="Donation summary">
            <div>
              <span className="metric-value">{stats.available}</span>
              <span className="metric-label">available now</span>
            </div>
            <div>
              <span className="metric-value">{stats.accepted}</span>
              <span className="metric-label">reserved</span>
            </div>
            <div>
              <span className="metric-value">{stats.delivered}</span>
              <span className="metric-label">delivered</span>
            </div>
            <div>
              <span className="metric-value">{stats.total}</span>
              <span className="metric-label">total posts</span>
            </div>
          </div>
        </div>
      </section>

      <section className="info-band" aria-label="How Food Rescue works">
        <article>
          <span>1</span>
          <h2>Donors post surplus</h2>
          <p>Restaurants and event teams list food, quantity, contact, and pickup location.</p>
        </article>
        <article>
          <span>2</span>
          <h2>Teams reserve pickup</h2>
          <p>Volunteers or NGOs mark donations as reserved so everyone sees the current status.</p>
        </article>
        <article>
          <span>3</span>
          <h2>Completed pickups stay tracked</h2>
          <p>Finished rescues stay visible with a delivered tag for donor history.</p>
        </article>
      </section>
    </main>
  );
}

function AuthPage({ authForm, authLoading, error, mode, onChange, onNavigate, onSubmit }) {
  const isRegister = mode === 'register';

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <div className="section-heading">
          <p className="eyebrow">{isRegister ? 'Join the network' : 'Welcome back'}</p>
          <h1>{isRegister ? 'Create your account' : 'Login to Food Rescue'}</h1>
          <p>
            {isRegister
              ? 'Register as a donor, volunteer, or NGO to coordinate food rescue work.'
              : 'Access the donation board and manage food pickup activity.'}
          </p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form className="auth-form" onSubmit={(event) => onSubmit(event, mode)}>
          {isRegister && (
            <label>
              Full name
              <input
                type="text"
                name="name"
                placeholder="Your full name"
                value={authForm.name}
                onChange={onChange}
                required
              />
            </label>
          )}

          <label>
            Email
            <input
              type="email"
              name="email"
              placeholder="you@example.com"
              value={authForm.email}
              onChange={onChange}
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              name="password"
              placeholder="At least 6 characters"
              value={authForm.password}
              onChange={onChange}
              required
            />
          </label>

          {isRegister && (
            <label>
              Role
              <select name="role" value={authForm.role} onChange={onChange}>
                <option value="volunteer">Volunteer</option>
                <option value="donor">Food donor</option>
                <option value="ngo">NGO</option>
              </select>
            </label>
          )}

          <button className="primary-button" type="submit" disabled={authLoading}>
            {authLoading ? 'Please wait...' : isRegister ? 'Create account' : 'Login'}
          </button>
        </form>

        <p className="auth-switch">
          {isRegister ? 'Already have an account?' : 'New to Food Rescue?'}
          <button type="button" onClick={() => onNavigate(isRegister ? 'login' : 'register')}>
            {isRegister ? 'Login' : 'Register'}
          </button>
        </p>
      </section>
    </main>
  );
}

function DashboardPage({ currentUser, myDonations, myPickups, onNavigate, stats }) {
  if (!currentUser) {
    return (
      <AuthRequiredPage
        onNavigate={onNavigate}
        title="Login to view your dashboard"
      />
    );
  }

  const pickupRole = currentUser.role === 'ngo' || currentUser.role === 'volunteer';
  const deliveredMine = myDonations.filter((donation) => donation.status === 'delivered').length;
  const deliveredPickups = myPickups.filter((donation) => donation.status === 'delivered').length;

  return (
    <main className="dashboard-page">
      <section className="page-title">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1>Welcome back, {currentUser.name}</h1>
        </div>
        <button className="primary-button" type="button" onClick={() => onNavigate('donations')}>
          Post or view donations
        </button>
      </section>

      <section className="dashboard-grid" aria-label="Dashboard summary">
        <article className="stat-card">
          <span>{stats.available}</span>
          <h2>Available donations</h2>
          <p>Open food posts that can still be reserved.</p>
        </article>
        <article className="stat-card">
          <span>{stats.accepted}</span>
          <h2>Reserved pickups</h2>
          <p>Food already claimed by a pickup team.</p>
        </article>
        <article className="stat-card">
          <span>{pickupRole ? myPickups.length : myDonations.length}</span>
          <h2>{pickupRole ? 'My pickups' : 'My posts'}</h2>
          <p>
            {pickupRole
              ? 'Food reservations claimed by your pickup team.'
              : 'Donations connected to your account email or name.'}
          </p>
        </article>
        <article className="stat-card">
          <span>{pickupRole ? deliveredPickups : deliveredMine}</span>
          <h2>{pickupRole ? 'Delivered to us' : 'My delivered posts'}</h2>
          <p>
            {pickupRole
              ? 'Reserved food marked as successfully delivered.'
              : 'Your donations already picked up and completed.'}
          </p>
        </article>
      </section>

      <section className="quick-actions">
        <div>
          <p className="eyebrow">Next steps</p>
          <h2>Keep the rescue board moving</h2>
        </div>
        <div className="action-row">
          <button className="secondary-button" type="button" onClick={() => onNavigate('donations')}>
            {pickupRole ? 'Find food' : 'Add donation'}
          </button>
          <button className="ghost-button" type="button" onClick={() => onNavigate('my-donations')}>
            Review my donations
          </button>
          {pickupRole && (
            <button className="ghost-button" type="button" onClick={() => onNavigate('my-pickups')}>
              Track my pickups
            </button>
          )}
          <button className="ghost-button" type="button" onClick={() => onNavigate('profile')}>
            Update profile
          </button>
        </div>
      </section>
    </main>
  );
}

function MyDonationsPage({ currentUser, donations, error, loading, onComplete, onNavigate, onRefresh }) {
  if (!currentUser) {
    return (
      <AuthRequiredPage
        onNavigate={onNavigate}
        title="Login to see your donations"
      />
    );
  }

  return (
    <main className="donations-page">
      <section className="page-title">
        <div>
          <p className="eyebrow">My donations</p>
          <h1>Food posts linked to your account</h1>
        </div>
        <div className="action-row">
          <button className="ghost-button" type="button" onClick={onRefresh}>
            Refresh
          </button>
          <button className="primary-button" type="button" onClick={() => onNavigate('donations')}>
            Post donation
          </button>
        </div>
      </section>

      <section className="board-panel solo-panel">
        {error && <div className="alert alert-error">{error}</div>}

        {loading ? (
          <div className="empty-state">Loading your donations...</div>
        ) : donations.length === 0 ? (
          <div className="empty-state">
            <h3>No donations linked to you yet</h3>
            <p>Post a donation while logged in and it will appear here automatically.</p>
            <button className="primary-button" type="button" onClick={() => onNavigate('donations')}>
              Post your first donation
            </button>
          </div>
        ) : (
          <div className="donation-list">
            {donations.map((donation) => (
              <DonationCard
                donation={donation}
                key={donation._id}
                onComplete={onComplete}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function MyPickupsPage({ currentUser, donations, error, loading, onComplete, onNavigate, onRefresh }) {
  if (!currentUser) {
    return (
      <AuthRequiredPage
        onNavigate={onNavigate}
        title="Login to track your pickups"
      />
    );
  }

  const pickupRole = currentUser.role === 'ngo' || currentUser.role === 'volunteer';

  if (!pickupRole) {
    return (
      <AuthRequiredPage
        onNavigate={onNavigate}
        title="Pickup tracking is for NGOs and volunteers"
      />
    );
  }

  const reserved = donations.filter((donation) => donation.status === 'accepted').length;
  const delivered = donations.filter((donation) => donation.status === 'delivered').length;

  return (
    <main className="donations-page">
      <section className="page-title">
        <div>
          <p className="eyebrow">My pickups</p>
          <h1>Food reserved for your team</h1>
        </div>
        <div className="compact-stats" aria-label="Pickup summary">
          <span>{reserved} reserved</span>
          <span>{delivered} delivered</span>
          <span>{donations.length} total</span>
        </div>
      </section>

      <section className="board-panel solo-panel">
        <div className="section-heading board-heading">
          <div>
            <p className="eyebrow">Pickup history</p>
            <h2>Reserved and delivered food</h2>
          </div>
          <div className="action-row">
            <button className="ghost-button" type="button" onClick={onRefresh}>
              Refresh
            </button>
            <button className="primary-button" type="button" onClick={() => onNavigate('donations')}>
              Find food
            </button>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {loading ? (
          <div className="empty-state">Loading your pickups...</div>
        ) : donations.length === 0 ? (
          <div className="empty-state">
            <h3>No pickups tracked yet</h3>
            <p>Reserve available food and it will appear here for follow-up.</p>
            <button className="primary-button" type="button" onClick={() => onNavigate('donations')}>
              Find available food
            </button>
          </div>
        ) : (
          <div className="donation-list">
            {donations.map((donation) => (
              <DonationCard
                donation={donation}
                key={donation._id}
                onComplete={onComplete}
                showPickupDetails
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function ProfilePage({ currentUser, error, form, onChange, onNavigate, onSubmit, success }) {
  if (!currentUser) {
    return (
      <AuthRequiredPage
        onNavigate={onNavigate}
        title="Login to manage your profile"
      />
    );
  }

  return (
    <main className="profile-page">
      <section className="auth-panel profile-panel">
        <div className="section-heading">
          <p className="eyebrow">Profile</p>
          <h1>Account settings</h1>
          <p>Keep your visible account details aligned with your food rescue role.</p>
        </div>

        {success && <div className="alert alert-success">{success}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        <form className="auth-form" onSubmit={onSubmit}>
          <label>
            Full name
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={onChange}
              required
            />
          </label>

          <label>
            Email
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={onChange}
              required
            />
          </label>

          <label>
            Role
            <select name="role" value={form.role} onChange={onChange}>
              <option value="volunteer">Volunteer</option>
              <option value="donor">Food donor</option>
              <option value="ngo">NGO</option>
            </select>
          </label>

          <button className="primary-button" type="submit">
            Save profile
          </button>
        </form>
      </section>
    </main>
  );
}

function AuthRequiredPage({ onNavigate, title }) {
  return (
    <main className="auth-page">
      <section className="auth-panel">
        <div className="section-heading">
          <p className="eyebrow">Account required</p>
          <h1>{title}</h1>
          <p>Create an account or login to access this part of Food Rescue.</p>
        </div>
        <div className="action-row">
          <button className="primary-button" type="button" onClick={() => onNavigate('login')}>
            Login
          </button>
          <button className="ghost-button" type="button" onClick={() => onNavigate('register')}>
            Register
          </button>
        </div>
      </section>
    </main>
  );
}

function DonationsPage({
  currentUser,
  donationForm,
  donations,
  error,
  loading,
  onAccept,
  onChange,
  onComplete,
  onRefresh,
  onSearchChange,
  onStatusChange,
  onSubmit,
  saving,
  searchTerm,
  stats,
  statusFilter,
  success
}) {
  const pickupRole = currentUser?.role === 'ngo' || currentUser?.role === 'volunteer';

  return (
    <main className="donations-page">
      <section className="page-title">
        <div>
          <p className="eyebrow">Donation workspace</p>
          <h1>Post and manage available food</h1>
        </div>
        <div className="compact-stats" aria-label="Donation summary">
          <span>{stats.available} available</span>
          <span>{stats.accepted} reserved</span>
          <span>{stats.delivered} delivered</span>
          <span>{stats.total} total</span>
        </div>
      </section>

      <section className="main-grid">
        <section className="form-panel">
          <div className="section-heading">
            <p className="eyebrow">New rescue</p>
            <h2>Post a donation</h2>
          </div>

          <form className="donation-form" onSubmit={onSubmit}>
            <label>
              Donor name
              <input
                type="text"
                name="name"
                placeholder="Green Garden Cafe"
                value={donationForm.name}
                onChange={onChange}
                required
              />
            </label>

            <label>
              Food type
              <input
                type="text"
                name="foodType"
                placeholder="Fresh sandwiches"
                value={donationForm.foodType}
                onChange={onChange}
                required
              />
            </label>

            <label>
              Quantity
              <input
                type="text"
                name="quantity"
                placeholder="24 meal boxes"
                value={donationForm.quantity}
                onChange={onChange}
                required
              />
            </label>

            <label>
              Pickup location
              <input
                type="text"
                name="location"
                placeholder="Downtown, Gate 2"
                value={donationForm.location}
                onChange={onChange}
                required
              />
            </label>

            <label className="full-span">
              Contact email or phone
              <input
                type="text"
                name="contact"
                placeholder="pickup@example.com"
                value={donationForm.contact}
                onChange={onChange}
                required
              />
            </label>

            <button className="primary-button full-span" type="submit" disabled={saving}>
              {saving ? 'Posting donation...' : 'Post donation'}
            </button>
          </form>
        </section>

        <section className="board-panel">
          <div className="section-heading board-heading">
            <div>
              <p className="eyebrow">Live board</p>
              <h2>Available donations</h2>
            </div>

            <button className="ghost-button" type="button" onClick={onRefresh}>
              Refresh
            </button>
          </div>

          <div className="filters" aria-label="Donation filters">
            <input
              type="search"
              placeholder="Search food, donor, or location"
              value={searchTerm}
              onChange={(event) => onSearchChange(event.target.value)}
            />

            {pickupRole ? (
              <select value="available" aria-label="Filter by status" disabled>
                <option value="available">Available only</option>
              </select>
            ) : (
              <select
                value={statusFilter}
                onChange={(event) => onStatusChange(event.target.value)}
                aria-label="Filter by status"
              >
                <option value="all">All statuses</option>
                <option value="available">Available</option>
                <option value="accepted">Reserved</option>
              </select>
            )}
          </div>

          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          {loading ? (
            <div className="empty-state">Loading donations...</div>
          ) : donations.length === 0 ? (
            <div className="empty-state">
              <h3>No matching donations yet</h3>
              <p>Post the first item or adjust the search filters.</p>
            </div>
          ) : (
            <div className="donation-list">
              {donations.map((donation) => (
                <DonationCard
                  donation={donation}
                  key={donation._id}
                  onAccept={onAccept}
                  onComplete={onComplete}
                />
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

function DonationCard({ donation, onAccept, onComplete, showPickupDetails = false }) {
  return (
    <article className="donation-card">
      <div className="card-topline">
        <span className={`status-pill status-${donation.status}`}>
          {donation.status === 'accepted'
            ? 'Reserved'
            : donation.status === 'delivered'
              ? 'Delivered'
              : 'Available'}
        </span>
        <time dateTime={donation.createdAt}>
          {new Date(donation.createdAt).toLocaleDateString()}
        </time>
      </div>

      <h3>{donation.foodType}</h3>
      <p className="quantity">{donation.quantity}</p>

      <dl className="donation-details">
        <div>
          <dt>Donor</dt>
          <dd>{donation.name}</dd>
        </div>
        <div>
          <dt>Location</dt>
          <dd>{donation.location}</dd>
        </div>
        <div>
          <dt>Contact</dt>
          <dd>{donation.contact}</dd>
        </div>
        {showPickupDetails && (
          <>
            <div>
              <dt>Reserved by</dt>
              <dd>{donation.reservedByName || 'Your team'}</dd>
            </div>
            <div>
              <dt>Reserved on</dt>
              <dd>
                {donation.reservedAt
                  ? new Date(donation.reservedAt).toLocaleDateString()
                  : 'Pending'}
              </dd>
            </div>
            <div>
              <dt>Delivered on</dt>
              <dd>
                {donation.deliveredAt
                  ? new Date(donation.deliveredAt).toLocaleDateString()
                  : 'Not delivered yet'}
              </dd>
            </div>
          </>
        )}
      </dl>

      <div className="card-actions">
        {onAccept && (
          <button
            className="secondary-button"
            type="button"
            onClick={() => onAccept(donation._id)}
            disabled={donation.status !== 'available'}
          >
            Reserve
          </button>
        )}
        <button
          className="text-button"
          type="button"
          onClick={() => onComplete(donation._id)}
          disabled={donation.status === 'delivered'}
        >
          Complete pickup
        </button>
      </div>
    </article>
  );
}

export default App;
