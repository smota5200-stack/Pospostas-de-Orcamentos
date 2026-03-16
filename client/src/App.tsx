import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import QuoteGenerator from "@/pages/QuoteGenerator";
import Dashboard from "@/pages/Dashboard";
import Budgets from "@/pages/Budgets";
import Clients from "@/pages/Clients";
import Finances from "@/pages/Finances";
import Meetings from "@/pages/Meetings";
import MarketingPage from "@/pages/Marketing";
import Notes from "@/pages/Notes";
import Texts from "@/pages/Texts";
import AppLayout from "@/components/AppLayout";

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/orcamentos" component={Budgets} />
        <Route path="/clientes" component={Clients} />
        <Route path="/financas" component={Finances} />
        <Route path="/reunioes" component={Meetings} />
        <Route path="/marketing" component={MarketingPage} />
        <Route path="/anotacoes" component={Notes} />
        <Route path="/textos" component={Texts} />
        <Route path="/orcamento/novo" component={QuoteGenerator} />
        <Route path="/orcamento/:id" component={QuoteGenerator} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;