import { RecoilRoot } from 'recoil';
import { DndProvider } from 'react-dnd';
import { RouterProvider } from 'react-router-dom';
import * as RadixToast from '@radix-ui/react-toast';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { QueryClient, QueryClientProvider, QueryCache } from '@tanstack/react-query';
import { ScreenshotProvider, ThemeProvider, useApiErrorBoundary } from './hooks';
import { ToastProvider } from './Providers';
// import { TourProvider } from './components/Tour';
import { TourProvider } from '@reactour/tour';
import Toast from './components/ui/Toast';
import { LiveAnnouncer } from '~/a11y';
import { router } from './routes';
import Scripts from './components/CourseGPT/Scripts/Scripts';

const steps = [
  {
    selector: '[data-tour="sidebar-toggle"]',
    content:
      'Click here to toggle the sidebar and access your chat history, settings, and other features.',
  },
  {
    selector: '[data-tour="model-selector"]',
    content:
      'Select different AI models or agents for your conversations. Each has unique capabilities.',
  },
  {
    selector: '[data-tour="chat-input"]',
    content:
      'Type your messages here. You can ask questions, request help with tasks, or have conversations.',
  },
  {
    selector: '[data-tour="send-button"]',
    content: 'Click here or press Enter to send your message to the AI.',
  },
];

const App = () => {
  const { setError } = useApiErrorBoundary();

  const queryClient = new QueryClient({
    queryCache: new QueryCache({
      onError: (error) => {
        if (error?.response?.status === 401) {
          setError(error);
        }
      },
    }),
  });

  return (
    <QueryClientProvider client={queryClient}>
      <RecoilRoot>
        <LiveAnnouncer>
          <Scripts />
          <ThemeProvider>
            <TourProvider steps={steps}>
              <RadixToast.Provider>
                <ToastProvider>
                  <DndProvider backend={HTML5Backend}>
                    <RouterProvider router={router} />
                    <ReactQueryDevtools initialIsOpen={false} position="top-right" />
                    <Toast />
                    <RadixToast.Viewport className="pointer-events-none fixed inset-0 z-[1000] mx-auto my-2 flex max-w-[560px] flex-col items-stretch justify-start md:pb-5" />
                  </DndProvider>
                </ToastProvider>
              </RadixToast.Provider>
            </TourProvider>
          </ThemeProvider>
        </LiveAnnouncer>
      </RecoilRoot>
    </QueryClientProvider>
  );
};

export default () => (
  <ScreenshotProvider>
    <App />
    <iframe
      src="/assets/silence.mp3"
      allow="autoplay"
      id="audio"
      title="audio-silence"
      style={{
        display: 'none',
      }}
    />
  </ScreenshotProvider>
);
