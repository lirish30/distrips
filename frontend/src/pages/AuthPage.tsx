import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/auth.css';

type Mode = 'login' | 'register';

interface Props {
  mode: Mode;
}

const AuthPage = ({ mode }: Props) => {
  const [formState, setFormState] = useState({ email: '', password: '', name: '' });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    alert(`[mock] ${mode} → ` + JSON.stringify(formState, null, 2));
  };

  return (
    <div className="auth-shell">
      <form className="auth-card" onSubmit={handleSubmit}>
        <div>
          <h1>{mode === 'login' ? 'Welcome Back' : 'Create an Account'}</h1>
          <p>DisTrips keeps your Disney planning and DVC math in sync.</p>
        </div>
        {mode === 'register' && (
          <label>
            <span>Name</span>
            <input
              type="text"
              value={formState.name}
              onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
            />
          </label>
        )}
        <label>
          <span>Email</span>
          <input
            type="email"
            value={formState.email}
            onChange={(event) => setFormState((prev) => ({ ...prev, email: event.target.value }))}
            required
          />
        </label>
        <label>
          <span>Password</span>
          <input
            type="password"
            value={formState.password}
            onChange={(event) => setFormState((prev) => ({ ...prev, password: event.target.value }))}
            required
          />
        </label>
        <button type="submit" className="primary">
          {mode === 'login' ? 'Sign in' : 'Create account'}
        </button>
        <p className="auth-footer">
          {mode === 'login' ? 'New here?' : 'Already have an account?'}
          <Link to={mode === 'login' ? '/register' : '/login'}>
            {mode === 'login' ? ' Create an account' : ' Sign in'}
          </Link>
        </p>
      </form>
    </div>
  );
};

export default AuthPage;
