import { render, screen } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import AppLayout from '../../components/AppLayout';
import TripDashboardPage from '../TripDashboardPage';
import { trips } from '../../data/sampleData';

const renderDashboard = () => {
  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: <AppLayout />,
        children: [{ path: '/trips/:tripId', element: <TripDashboardPage /> }]
      }
    ],
    { initialEntries: [`/trips/${trips[0].id}`] }
  );
  return render(<RouterProvider router={router} />);
};

describe('TripDashboardPage', () => {
  it('shows the create trip button and trip name', () => {
    renderDashboard();
    expect(screen.getAllByRole('link', { name: /create trip/i })).not.toHaveLength(0);
    expect(screen.getByRole('heading', { name: trips[0].name })).toBeInTheDocument();
  });

  it('includes link to printable itinerary', () => {
    renderDashboard();
    expect(screen.getByRole('link', { name: /printable itinerary/i })).toHaveAttribute(
      'href',
      `/trips/${trips[0].id}/print`
    );
  });
});
