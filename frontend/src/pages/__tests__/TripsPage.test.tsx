import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TripsPage from '../TripsPage';
import { trips } from '../../data/sampleData';

describe('TripsPage', () => {
  it('renders a card for each trip', () => {
    render(
      <MemoryRouter>
        <TripsPage />
      </MemoryRouter>
    );
    trips.forEach((trip) => {
      expect(screen.getByRole('heading', { name: trip.name })).toBeInTheDocument();
    });
  });

  it('links to the trip overview', () => {
    render(
      <MemoryRouter>
        <TripsPage />
      </MemoryRouter>
    );
    const dashboardLinks = screen.getAllByRole('link', { name: /open dashboard/i });
    expect(dashboardLinks[0]).toHaveAttribute('href', `/trips/${trips[0].id}`);
  });
});
