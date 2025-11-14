import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/auth.css';

const TripCreatePage = () => {
  const navigate = useNavigate();
  const [formState, setFormState] = useState({
    name: '',
    startDate: '',
    endDate: '',
    homeResortOrHotel: '',
    budgetTarget: ''
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    alert('Trip would be created with: ' + JSON.stringify(formState, null, 2));
    navigate('/trips');
  };

  return (
    <div className="auth-card" style={{ maxWidth: '720px', margin: '0 auto' }}>
      <h1>Create a Trip</h1>
      <p>Set travel window and optional details to auto-generate day plans.</p>
      <form className="grid" style={{ gap: '1rem' }} onSubmit={handleSubmit}>
        <label>
          <span>Trip name</span>
          <input type="text" value={formState.name} onChange={(e) => setFormState((s) => ({ ...s, name: e.target.value }))} required />
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
          <label>
            <span>Start date</span>
            <input
              type="date"
              value={formState.startDate}
              onChange={(e) => setFormState((s) => ({ ...s, startDate: e.target.value }))}
              required
            />
          </label>
          <label>
            <span>End date</span>
            <input type="date" value={formState.endDate} onChange={(e) => setFormState((s) => ({ ...s, endDate: e.target.value }))} required />
          </label>
        </div>
        <label>
          <span>Home resort or hotel</span>
          <input
            type="text"
            value={formState.homeResortOrHotel}
            onChange={(e) => setFormState((s) => ({ ...s, homeResortOrHotel: e.target.value }))}
            placeholder="Pop Century, Saratoga Springs, etc."
          />
        </label>
        <label>
          <span>Budget target (USD)</span>
          <input
            type="number"
            min="0"
            value={formState.budgetTarget}
            onChange={(e) => setFormState((s) => ({ ...s, budgetTarget: e.target.value }))}
            placeholder="4000"
          />
        </label>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button type="submit" className="primary">
            Save Trip
          </button>
          <button type="button" className="ghost" onClick={() => navigate(-1)}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default TripCreatePage;
