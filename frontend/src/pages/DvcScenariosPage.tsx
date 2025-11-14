import { dvcScenarios } from '../data/sampleData';
import '../styles/page-sections.css';

const DvcScenariosPage = () => (
  <div className="grid" style={{ gap: '1.5rem' }}>
    <section className="card">
      <div className="trip-card__header">
        <div>
          <h2>Strategy Scenarios</h2>
          <p>Model how points are distributed over years.</p>
        </div>
        <button type="button" className="primary">
          New scenario
        </button>
      </div>
      <div className="grid" style={{ marginTop: '1rem', gap: '1rem' }}>
        {dvcScenarios.map((scenario) => (
          <article key={scenario.id} className="card" style={{ border: '1px solid rgba(20,33,61,0.08)' }}>
            <h3>{scenario.name}</h3>
            <p>{scenario.description}</p>
            <div className="trip-card__meta">
              <div>
                <dt>Total points</dt>
                <dd>{scenario.totalPointsUsed}</dd>
              </div>
              <div>
                <dt>Years</dt>
                <dd>{Object.keys(scenario.targetYears).join(', ')}</dd>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  </div>
);

export default DvcScenariosPage;
