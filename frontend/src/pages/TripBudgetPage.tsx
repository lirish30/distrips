import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { budgetItems, trips } from '../data/sampleData';
import '../styles/page-sections.css';

const TripBudgetPage = () => {
  const { tripId } = useParams();
  const trip = trips.find((item) => item.id === tripId) ?? trips[0];
  const items = useMemo(() => budgetItems.filter((item) => item.tripId === trip.id), [trip.id]);
  const spent = items.reduce((total, item) => total + item.amount, 0);
  const remaining = trip.budgetTarget ? trip.budgetTarget - spent : undefined;

  return (
    <div className="grid" style={{ gap: '1.5rem' }}>
      <section className="card">
        <div className="trip-card__header">
          <div>
            <h2>Budget Snapshot</h2>
            <p>Track spending vs target.</p>
          </div>
          <button className="primary" type="button">
            Add item
          </button>
        </div>
        <dl className="trip-card__meta">
          <div>
            <dt>Target</dt>
            <dd>${trip.budgetTarget?.toLocaleString() ?? '—'}</dd>
          </div>
          <div>
            <dt>Logged</dt>
            <dd>${spent.toFixed(2)}</dd>
          </div>
          <div>
            <dt>Remaining</dt>
            <dd>{remaining !== undefined ? `$${remaining.toFixed(2)}` : '—'}</dd>
          </div>
        </dl>
        <progress max={trip.budgetTarget ?? spent} value={spent} style={{ width: '100%' }} />
      </section>

      <section className="card">
        <h2>Expense log</h2>
        <table className="budget-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Category</th>
              <th>Description</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.date ?? 'Trip total'}</td>
                <td>{item.category}</td>
                <td>{item.description ?? '—'}</td>
                <td>${item.amount.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default TripBudgetPage;
