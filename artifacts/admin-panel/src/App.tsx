import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "@/components/layout/Sidebar";
import { useAuthStore } from "@/store/auth";

// Pages
import NotFound from "@/pages/not-found";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Sessions from "@/pages/Sessions";
import Broadcast from "@/pages/Broadcast";
import Users from "@/pages/Users";
import Logs from "@/pages/Logs";
import Settings from "@/pages/Settings";
import Commands from "@/pages/Commands";
import Groups from "@/pages/Groups";
import Scheduler from "@/pages/Scheduler";
import AutoReply from "@/pages/AutoReply";

// Patch fetch to automatically attach JWT token for Orval generated hooks
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  const [resource, config] = args;
  const token = localStorage.getItem('admin_token');
  
  const headers = new Headers(config?.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  const response = await originalFetch(resource, {
    ...config,
    headers,
  });
  
  // Handle unauthorized responses globally
  if (response.status === 401 && !resource.toString().includes('/bot-api/auth/login')) {
    useAuthStore.getState().logout();
  }
  
  return response;
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Protected Route Wrapper
function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { token } = useAuthStore();
  if (!token) return <Redirect to="/login" />;
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 ml-64 overflow-y-auto">
        <Component />
      </main>
    </div>
  );
}

function Router() {
  const { token } = useAuthStore();

  return (
    <Switch>
      <Route path="/login">
        {token ? <Redirect to="/" /> : <Login />}
      </Route>
      
      {/* Protected Routes */}
      <Route path="/" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/sessions" component={() => <ProtectedRoute component={Sessions} />} />
      <Route path="/broadcast" component={() => <ProtectedRoute component={Broadcast} />} />
      <Route path="/users" component={() => <ProtectedRoute component={Users} />} />
      <Route path="/commands" component={() => <ProtectedRoute component={Commands} />} />
      <Route path="/groups" component={() => <ProtectedRoute component={Groups} />} />
      <Route path="/scheduler" component={() => <ProtectedRoute component={Scheduler} />} />
      <Route path="/auto-reply" component={() => <ProtectedRoute component={AutoReply} />} />
      <Route path="/logs" component={() => <ProtectedRoute component={Logs} />} />
      <Route path="/settings" component={() => <ProtectedRoute component={Settings} />} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
