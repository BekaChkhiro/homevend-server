
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import PropertyDetail from "./pages/PropertyDetail";
import Listings from "./pages/Listings";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AdminOverview from "./pages/AdminDashboard/pages/Overview";
import AdminUsers from "./pages/AdminDashboard/pages/Users";
import AdminListings from "./pages/AdminDashboard/pages/Listings";
import AdminAdvertisements from "./pages/AdminDashboard/pages/Advertisements";
import AdminSettings from "./pages/AdminDashboard/pages/Settings";
import { AddProperty } from "./pages/Dashboard/pages/AddProperty";
import { MyProperties } from "./pages/Dashboard/components/MyProperties";
import { Favorites } from "./pages/Dashboard/components/Favorites";
import { ProfilePage } from "./pages/Dashboard/components/ProfilePage";
import { BalancePage } from "./pages/Dashboard/components/BalancePage";
import { TestComponent } from "./pages/Dashboard/components/TestComponent";
import { SimpleAddProperty, SimpleMyProperties, SimpleFavorites, SimpleProfile, SimpleBalance } from "./pages/Dashboard/components/SimpleTest";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/property/:id" element={<PropertyDetail />} />
          <Route path="/listings" element={<Listings />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />}>
            <Route index element={<MyProperties />} />
            <Route path="test" element={<TestComponent />} />
            <Route path="add-property" element={<AddProperty />} />
            <Route path="my-properties" element={<MyProperties />} />
            <Route path="favorites" element={<Favorites />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="balance" element={<BalancePage />} />
          </Route>
          <Route path="/admin" element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }>
            <Route index element={<AdminOverview />} />
            <Route path="overview" element={<AdminOverview />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="listings" element={<AdminListings />} />
            <Route path="advertisements" element={<AdminAdvertisements />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
