import { QueryClient } from 'react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: 1000,
      onError: (error) => {
        if (error.message.includes('504')) {
          // Fallback to cached data or alternate endpoint
        }
      }
    }
  }
});
