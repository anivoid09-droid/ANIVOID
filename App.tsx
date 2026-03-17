import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { Layout } from "@/components/layout";
import Dashboard from "@/pages/dashboard";
import Users from "@/pages/users";
import Characters from "@/pages/characters";
import Cards from "@/pages/cards";
import AdsManager from "@/pages/ads";
import Tournaments from "@/pages/tournaments";
import Market from "@/pages/market";
import Groups from "@/pages/groups";
import Guilds from "@/pages/guilds";
import Broadcast from "@/pages/broadcast";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/users" component={Users} />
        <Route path="/characters" component={Characters} />
        <Route path="/cards" component={Cards} />
        <Route path="/ads" component={AdsManager} />
        <Route path="/tournaments" component={Tournaments} />
        <Route path="/market" component={Market} />
        <Route path="/groups" component={Groups} />
        <Route path="/guilds" component={Guilds} />
        <Route path="/broadcast" component={Broadcast} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
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
