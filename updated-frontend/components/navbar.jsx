"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Heart, User, ChevronDown, LogOut, LayoutDashboard } from "lucide-react"
import ThemeToggle from "@/components/theme-toggle"
import { useAuth } from "@/context/AuthContext"

export default function Navbar() {
  const router = useRouter();
  const { logout } = useAuth();
  
  const [user, setUser] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Failed to parse user data");
      }
    }
  }, []);

  const handleLogout = () => {
    logout();
    setUser(null);
    setShowProfileMenu(false);
    router.push("/");
  };

  const dashboardRoute = user?.role === "Doctor" ? "/doctor" : "/facilitator";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center px-4 md:px-8">
        
        <Link href="/" className="mr-8 flex items-center space-x-2">
          <Heart className="h-6 w-6 text-blue-600" />
          <span className="font-bold text-xl text-blue-600">MediSense</span>
        </Link>
        
        <nav className="flex flex-1 items-center space-x-8 text-sm font-medium">
          <Link href="/" className="transition-colors hover:text-primary">
            Home
          </Link>
          <Link href="#features" className="transition-colors hover:text-primary">
            Features
          </Link>
          <Link href="#contact" className="transition-colors hover:text-primary">
            Contact
          </Link>
        </nav>
        
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          
          {user ? (
            <div className="flex items-center space-x-2 md:space-x-4">
              <Button asChild variant="outline" size="sm" className="hidden sm:flex border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-900/30">
                <Link href={dashboardRoute}>
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Dashboard
                </Link>
              </Button>

              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center space-x-2 md:space-x-3 p-1.5 md:p-2 rounded-lg hover:bg-accent transition-colors border border-transparent"
                >
                  <div className="text-right hidden md:block">
                    <p className="text-sm font-medium text-foreground">{user.fullName || "User"}</p>
                    <p className="text-xs text-muted-foreground">{user.role}</p>
                  </div>
                  <div className="w-8 h-8 md:w-9 md:h-9 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 md:h-5 md:w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground hidden sm:block" />
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-popover rounded-lg shadow-lg border border-border z-50">
                    <div className="py-1">
                      <div className="px-4 py-2 border-b border-border md:hidden">
                        <p className="text-sm font-medium text-foreground truncate">{user.fullName}</p>
                        <p className="text-xs text-muted-foreground">{user.role}</p>
                      </div>
                      <Link href={dashboardRoute} onClick={() => setShowProfileMenu(false)} className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-foreground hover:bg-accent">
                        <LayoutDashboard className="h-4 w-4" />
                        <span>My Dashboard</span>
                      </Link>
                      <hr className="my-1 border-border" />
                      <button onClick={handleLogout} className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20">
                        <LogOut className="h-4 w-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/auth/doctor/login">Login</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/get-started">Get Started</Link>
              </Button>
            </>
          )}
        </div>
      </div>

      {showProfileMenu && <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />}
    </header>
  )
}