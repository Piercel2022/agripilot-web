import { Navigate, createBrowserRouter } from 'react-router-dom'
import AppLayout from '../layout/AppLayout'
import ProtectedRoute from './ProtectedRoute'
import DashboardPage from './DashboardPage'
import LoginPage from './LoginPage'
import NotFoundPage from './NotFoundPage'

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
