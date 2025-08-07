import { useEffect } from "react";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { AdminSidebar } from "./components/AdminSidebar";

const AdminDashboard = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        navigate("/login");
        return;
      }

      if (user.role !== 'admin') {
        navigate("/dashboard");
        return;
      }

      if (location.pathname === "/admin" || location.pathname === "/admin/") {
        navigate("/admin/overview", { replace: true });
      }
    }
  }, [user, isLoading, location.pathname, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          <p className="mt-2">იტვირთება...</p>
        </div>
      </div>
    );
  }
  
  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <div className="flex-1 container mx-auto flex mt-6 min-h-0 pt-16">
        <div className="flex-shrink-0">
          <AdminSidebar user={user} />
        </div>

        <div className="flex-1 bg-white rounded-lg border overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto p-6">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;