import { useEffect } from "react";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { Sidebar } from "./components/Sidebar";
import { ProgressBar } from "./components/ProgressBar";
import { usePropertyCompletion } from "./hooks/usePropertyCompletion";
import { PropertyFormProvider, usePropertyForm } from "./contexts/PropertyFormContext";

const DashboardContent = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { formData } = usePropertyForm();
  const { completionPercentage } = usePropertyCompletion(formData);

  // თუ მომხმარებელი არ არის ავტორიზებული, გადავამისამართოთ შესვლის გვერდზე
  useEffect(() => {
    // მხოლოდ მას შემდეგ რაც ავთენტიკაციის ჩატვირთვა დასრულდება
    if (!isLoading) {
      if (!user) {
        navigate("/login");
        return;
      }

      // თუ /dashboard-ზე ვართ, გადავამისამართოთ დეფოლტ გვერდზე
      if (location.pathname === "/dashboard" || location.pathname === "/dashboard/") {
        navigate("/dashboard/my-properties", { replace: true });
      }
    }
  }, [user, isLoading, location.pathname, navigate]);

  // ჩატვირთვის დროს ან როცა მომხმარებელი არ არის, დაბრუნდეს ჩატვირთვის ინდიკატორი
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
  
  if (!user) {
    return null;
  }

  console.log("Dashboard rendering, location:", location.pathname);

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* ძირითადი ჰედერი */}
      <Header />

      {/* მთავარი კონტენტი */}
      <div className="flex-1 container mx-auto flex mt-6 min-h-0 pt-16">
        {/* მენიუ სიდებარი - ფიქსირებული */}
        <div className="flex-shrink-0">
          <Sidebar user={user} />
        </div>

        {/* კონტენტის ნაწილი - მხოლოდ ეს სქროლდება */}
        <div className="flex-1 bg-white rounded-lg border overflow-hidden flex flex-col">
          {/* პროგრესის ბარი - ფიქსირებული */}
          <div className="sticky top-0 z-10 bg-white">
            <ProgressBar 
              percentage={completionPercentage} 
              title="განცხადების შევსების მოწმება"
            />
          </div>
          
          {/* მთავარი კონტენტი - სქროლადი */}
          <div className="flex-1 overflow-y-auto p-6">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  return (
    <PropertyFormProvider>
      <DashboardContent />
    </PropertyFormProvider>
  );
};

export default Dashboard;
