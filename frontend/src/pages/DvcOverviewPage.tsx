import { dvcContracts, dvcScenarios, dvcUseYears } from '../data/sampleData';
import { formatDate } from '../utils/date';
import '../styles/page-sections.css';

const DvcOverviewPage = () => {
  const totalPoints = dvcContracts.reduce((sum, contract) => sum + contract.totalPoints, 0);
  const expiring = dvcUseYears.reduce((sum, year) => sum + year.pointsExpiring, 0);

  return (
    <div className="grid" style={{ gap: '1.5rem' }}>
      <section className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <article className="card">
          <p className="nav-heading">Total points</p>
          <h2>{totalPoints}</h2>
        </article>
        <article className="card">
          <p className="nav-heading">Expiring this year</p>
          <h2>{expiring}</h2>
        </article>
        <article className="card">
          <p className="nav-heading">Active scenarios</p>
          <h2>{dvcScenarios.length}</h2>
        </article>
      </section>

      <section className="card">
        <div className="trip-card__header">
          <div>
            <h2>Use year summary</h2>
            <p>Quick glance at allocations.</p>
          </div>
        </div>
        <table className="budget-table">
          <thead>
            <tr>
              <th>Year</th>
              <th>Starting</th>
              <th>Allocated</th>
              <th>Remaining</th>
              <th>Banking deadline</th>
            </tr>
          </thead>
          <tbody>
            {dvcUseYears.map((year) => (
              <tr key={year.year}>
                <td>{year.year}</td>
                <td>{year.startingPoints}</td>
                <td>{year.pointsAllocated}</td>
                <td>{year.pointsRemaining}</td>
                <td>{formatDate(year.bankingDeadline)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default DvcOverviewPage;
