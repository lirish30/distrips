import { dvcUseYears } from '../data/sampleData';
import '../styles/page-sections.css';

const DvcUseYearsPage = () => (
  <div className="grid" style={{ gap: '1.5rem' }}>
    <section className="card">
      <h2>Use Years</h2>
      <p>Roll up allocations, balances, and deadlines per contract.</p>
      <table className="budget-table">
        <thead>
          <tr>
            <th>Year</th>
            <th>Starting</th>
            <th>Allocated</th>
            <th>Remaining</th>
            <th>Expiring</th>
            <th>Banking Deadline</th>
          </tr>
        </thead>
        <tbody>
          {dvcUseYears.map((year) => (
            <tr key={year.year}>
              <td>{year.year}</td>
              <td>{year.startingPoints}</td>
              <td>{year.pointsAllocated}</td>
              <td>{year.pointsRemaining}</td>
              <td>{year.pointsExpiring}</td>
              <td>{year.bankingDeadline}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  </div>
);

export default DvcUseYearsPage;
