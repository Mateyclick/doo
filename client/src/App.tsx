import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import { AppProvider } from "./contexts/AppContext";
import Header from "@/components/Header";
import { ToastProvider } from "@/hooks/use-toast"; // 1. Importar el ToastProvider

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        {/* 2. Envolver con ToastProvider */}
        <ToastProvider>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">
              <Router />
            </main>
          </div>
          <Toaster /> {/* 3. Este es el componente visual de Shadcn */}
        </ToastProvider>
      </AppProvider>
    </QueryClientProvider>
  );
}

export default App;