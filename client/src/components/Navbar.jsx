import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <header className="border-b border-primary/20 bg-surface">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="text-xl font-semibold text-primary">
          The Orange Fare
        </Link>

        <div className="flex items-center gap-4 text-sm">
          <Link to="/fare-split" className="text-dark hover:text-primary">
            Fare Split
          </Link>
          <Link to="/dashboard" className="text-dark hover:text-primary">
            Dashboard
          </Link>
          {isAuthenticated ? (
            <>
              <span className="text-dark/70">{user?.name}</span>
              <button
                type="button"
                onClick={logout}
                className="rounded-md bg-dark px-3 py-2 text-surface hover:opacity-90"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-dark hover:text-primary">
                Login
              </Link>
              <Link to="/register" className="rounded-md bg-primary px-3 py-2 text-surface hover:opacity-90">
                Register
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
