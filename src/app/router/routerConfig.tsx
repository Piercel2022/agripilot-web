import { Navigate, createBrowserRouter } from 'react-router-dom'
import AppLayout from '../layout/AppLayout'
import ProtectedRoute from './ProtectedRoute'
import DashboardPage from './DashboardPage'
import LoginPage from './LoginPage'
import NotFoundPage from './NotFoundPage'
import FarmsPage from './FarmsPage'
import FieldsPage from './FieldsPage'
import CropsPage from './CropsPage'
import CampaignsPage from './CampaignsPage'
import InterventionsPage from './InterventionsPage'
import FertilisationPage from './FertilisationPage'
import PhytosanitaryPage from './PhytosanitaryPage'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/app',
        element: <AppLayout />,
        errorElement: <NotFoundPage />,
        children: [
          {
            index: true,
            element: <DashboardPage />,
          },
          {
            path: 'farms',
            element: <FarmsPage />,
          },
          {
            path: 'fields',
            element: <FieldsPage />,
          },
          {
            path: 'crops',
            element: <CropsPage />,
          },
          {
            path: 'campaigns',
            element: <CampaignsPage />,
          },
          {
            path: 'interventions',
            element: <InterventionsPage />,
          },
          {
            path: 'fertilisations',
            element: <FertilisationPage />,
          },
          { path: 'phytosanitary',element: <PhytosanitaryPage />},
        ],
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
])

export default router
