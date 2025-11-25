import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  const navStyle = {
    background: 'white',
    padding: '15px 30px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'sticky',
    top: 0,
    zIndex: 100
  };

  const linkStyle = (active) => ({
    textDecoration: 'none',
    color: active ? '#1b5e20' : '#6b7280',
    fontWeight: active ? 'bold' : 'normal',
    padding: '8px 16px',
    borderRadius: '20px',
    backgroundColor: active ? '#f0fdf4' : 'transparent',
    marginLeft: '10px',
    transition: 'all 0.2s'
  });

  return (
    <nav style={navStyle}>
      <div style={{ fontWeight: '900', fontSize: '20px', color: '#1b5e20', letterSpacing: '-1px' }}>
        AERAS <span style={{ color: '#ff6f00' }}>.</span>
      </div>
      <div>
        <Link to="/" style={linkStyle(isActive('/'))}>Student Search</Link>
        <Link to="/admin" style={linkStyle(isActive('/admin'))}>Admin Portal</Link>
      </div>
    </nav>
  );
}