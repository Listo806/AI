import { Outlet, Link, useNavigate } from 'react-router-dom';
import './Layout.css';

function Layout({ user, setUser }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="nav-container">
          <Link to="/" className="nav-brand">
            Ninja CRM
          </Link>
          <div className="nav-links">
            <Link to="/">Dashboard</Link>
            <Link to="/subscriptions">Subscriptions</Link>
            <Link to="/teams">Teams</Link>
            <Link to="/leads">Leads</Link>
            <Link to="/properties">Properties</Link>
            {user && (
              <span className="nav-user">
                {user.email}
                <button onClick={handleLogout} className="btn btn-secondary" style={{ marginLeft: '10px' }}>
                  Logout
                </button>
              </span>
            )}
          </div>
        </div>
      </nav>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;

