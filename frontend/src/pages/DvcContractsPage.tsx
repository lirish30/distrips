import { dvcContracts } from '../data/sampleData';
import '../styles/page-sections.css';

const DvcContractsPage = () => {
  return (
    <div className="grid" style={{ gap: '1.5rem' }}>
      <section className="card">
        <div className="trip-card__header">
          <div>
            <h2>DVC Contracts</h2>
            <p>Track home resorts and available points.</p>
          </div>
          <button className="primary" type="button">
            Add contract
          </button>
        </div>
        <div className="grid" style={{ marginTop: '1rem', gap: '1rem' }}>
          {dvcContracts.map((contract) => (
            <article key={contract.id} className="contract-tile">
              <header>
                <h3>{contract.nickname ?? contract.homeResort}</h3>
                <span>{contract.homeResort}</span>
              </header>
              <dl>
                <div>
                  <dt>Use Year</dt>
                  <dd>{contract.useYearMonth}</dd>
                </div>
                <div>
                  <dt>Total Points</dt>
                  <dd>{contract.totalPoints}</dd>
                </div>
                <div>
                  <dt>Annual Dues</dt>
                  <dd>${contract.annualDuesAmount?.toFixed(2) ?? '—'}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};

export default DvcContractsPage;
