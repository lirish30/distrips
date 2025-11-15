import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { dvcUseYearTrips, dvcUseYears } from '../data/sampleData';
import { formatDate, formatDateRange } from '../utils/date';
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
          {dvcUseYears.map((year) => {
            const linkedTrips = dvcUseYearTrips.filter((trip) => trip.useYear.startsWith(year.year));
            return (
              <Fragment key={year.year}>
                <tr>
                  <td>{year.year}</td>
                  <td>{year.startingPoints}</td>
                  <td>{year.pointsAllocated}</td>
                  <td>{year.pointsRemaining}</td>
                  <td>{year.pointsExpiring}</td>
                  <td>{formatDate(year.bankingDeadline)}</td>
                </tr>
                {linkedTrips.length > 0 && (
                  <tr className="linked-trips-row">
                    <td colSpan={6}>
                      <div className="linked-trips">
                        <p>Linked Trips</p>
                        <table>
                          <thead>
                            <tr>
                              <th>Trip</th>
                              <th>Dates</th>
                              <th>Points used</th>
                            </tr>
                          </thead>
                          <tbody>
                            {linkedTrips.map((trip) => (
                              <tr key={trip.tripId}>
                                <td>
                                  <Link to={`/trips/${trip.tripId}`}>{trip.tripName}</Link>
                                </td>
                                <td>{formatDateRange(trip.startDate, trip.endDate)}</td>
                                <td>{trip.pointsUsed}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </section>
  </div>
);

export default DvcUseYearsPage;
