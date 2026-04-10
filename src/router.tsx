import { createBrowserRouter } from 'react-router-dom';
import { Layout } from '@/components/Layout/Layout';
import { Dashboard } from '@/pages/Dashboard/Dashboard';
import { AgentList } from '@/pages/Agents/AgentList';
import { AgentDetailPage } from '@/pages/Agents/AgentDetail';
import { Attestations } from '@/pages/Attestations/Attestations';
import { Policies } from '@/pages/Policies/Policies';
import { Certificates } from '@/pages/Certificates/Certificates';
import { Alerts } from '@/pages/Alerts/Alerts';
import { Performance } from '@/pages/Performance/Performance';
import { AuditLog } from '@/pages/AuditLog/AuditLog';
import { Integrations } from '@/pages/Integrations/Integrations';
import { Settings } from '@/pages/Settings/Settings';
import { Login } from '@/pages/Login/Login';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'agents', element: <AgentList /> },
      { path: 'agents/:id', element: <AgentDetailPage /> },
      { path: 'attestations', element: <Attestations /> },
      { path: 'policies', element: <Policies /> },
      { path: 'certificates', element: <Certificates /> },
      { path: 'alerts', element: <Alerts /> },
      { path: 'performance', element: <Performance /> },
      { path: 'audit', element: <AuditLog /> },
      { path: 'integrations', element: <Integrations /> },
      { path: 'settings', element: <Settings /> },
    ],
  },
]);
