import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { router } from './router';
import { useVisualizationStore } from './store/visualizationStore';

const initViz = useVisualizationStore.getState();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
      refetchInterval: initViz.autoRefresh ? initViz.refreshInterval * 1000 : false,
    },
  },
});

export function App() {
  const autoRefresh = useVisualizationStore((s) => s.autoRefresh);
  const refreshInterval = useVisualizationStore((s) => s.refreshInterval);

  useEffect(() => {
    queryClient.setDefaultOptions({
      queries: {
        ...queryClient.getDefaultOptions().queries,
        refetchInterval: autoRefresh ? refreshInterval * 1000 : false,
      },
    });
  }, [autoRefresh, refreshInterval]);

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
