"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react"; 

export default function ProtectedRoute({ children, allowedRole, redirectTo = "/" }) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("token");
      const userStr = localStorage.getItem("user");

      // 1. If no token exists, kick them to their specific login page
      if (!token || !userStr) {
        router.replace(redirectTo);
        return;
      }

      try {
        const user = JSON.parse(userStr);

        // 2. If they are logged in but have the WRONG role (e.g., Doctor on Facilitator page)
        if (allowedRole && user.role !== allowedRole) {
          // Send them back to their correct dashboard
          if (user.role === "Doctor") {
            router.replace("/doctor"); // Update with your actual doctor route
          } else if (user.role === "Facilitator") {
            router.replace("/facilitator"); // Update with your actual facilitator route
          } else {
            router.replace("/");
          }
          return;
        }

        // 3. Passed all checks! Allow them to see the page.
        setIsAuthorized(true);
      } catch (error) {
        console.error("Auth parsing error", error);
        localStorage.clear();
        router.replace(redirectTo);
      }
    };

    checkAuth();
  }, [router, allowedRole, redirectTo]);

  // Prevent the "flash" of unauthorized content by showing a loading state
  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Heart className="h-12 w-12 text-blue-600 animate-pulse mb-4" />
        <p className="text-gray-500 font-medium">Verifying secure access...</p>
      </div>
    );
  }

  // Render the protected dashboard
  return <>{children}</>;
}