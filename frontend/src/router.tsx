import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppShell from './components/AppShell';
import AuthPage from './pages/AuthPage';
import TripsPage from './pages/TripsPage';
import TripDashboardPage from './pages/TripDashboardPage';
import TripDayPlannerPage from './pages/TripDayPlannerPage';
import TripBudgetPage from './pages/TripBudgetPage';
import TripFamilyModePage from './pages/TripFamilyModePage';
import TripCreatePage from './pages/TripCreatePage';
import DvcOverviewPage from './pages/DvcOverviewPage';
import DvcContractsPage from './pages/DvcContractsPage';
import DvcUseYearsPage from './pages/DvcUseYearsPage';
import DvcScenariosPage from './pages/DvcScenariosPage';
import NotFoundPage from './pages/NotFoundPage';
import TripPrintPage from './pages/TripPrintPage';

const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/trips" replace /> },
      { path: '/trips', element: <TripsPage /> },
      { path: '/trips/new', element: <TripCreatePage /> },
      { path: '/trips/:tripId', element: <TripDashboardPage /> },
      { path: '/trips/:tripId/day/:dayId', element: <TripDayPlannerPage /> },
      { path: '/trips/:tripId/budget', element: <TripBudgetPage /> },
      { path: '/trips/:tripId/family', element: <TripFamilyModePage /> },
      { path: '/trips/:tripId/print', element: <TripPrintPage /> },
      { path: '/dvc', element: <DvcOverviewPage /> },
      { path: '/dvc/contracts', element: <DvcContractsPage /> },
      { path: '/dvc/use-years', element: <DvcUseYearsPage /> },
      { path: '/dvc/scenarios', element: <DvcScenariosPage /> },
      { path: '*', element: <NotFoundPage /> }
    ]
  },
  { path: '/login', element: <AuthPage mode="login" /> },
  { path: '/register', element: <AuthPage mode="register" /> }
]);

export default router;
