"use client";

import { useHabitsContext } from "@/contexts/habits-context";
import { signIn, signOut } from "next-auth/react";
import { Separator } from "@/components/ui/separator";
import { LogOut, User, Sun, Moon, Monitor, Check } from "lucide-react";
import Image from "next/image";
import { useTheme } from "next-themes";

export default function ProfilePage() {
  const { user, isLoaded, isAuthenticated } = useHabitsContext();
  const { theme, setTheme } = useTheme();

  const isLoading = !isLoaded;

  const themeOptions = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ];

  return (
    <div className="flex flex-col h-full overflow-y-auto pb-24 lg:pb-6">
      {/* Content sections with full-bleed */}
      <div className="divide-y divide-border">
        {/* User Info Section */}
        <div>
          {isLoading ? (
            <div className="flex items-center gap-4 px-6 py-6">
              <div className="w-16 h-16 bg-muted animate-pulse rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-5 bg-muted animate-pulse rounded w-32" />
                <div className="h-4 bg-muted animate-pulse rounded w-48" />
              </div>
            </div>
          ) : isAuthenticated && user ? (
            <div>
              <div className="flex items-center gap-4 px-6 py-6">
                {user.image ? (
                  <Image
                    src={user.image}
                    width={64}
                    height={64}
                    alt={user.name || "User"}
                    className="w-16 h-16 rounded-full"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-8 h-8 text-primary" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-semibold truncate">
                    {user.name || "User"}
                  </h2>
                  <p className="text-sm text-muted-foreground truncate">
                    {user.email}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-4 px-6 py-6">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                  <User className="w-8 h-8 text-muted-foreground" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Guest</h2>
                  <p className="text-sm text-muted-foreground">Not signed in</p>
                </div>
              </div>
              <Separator />
              <div className="px-6 py-4">
                <button
                  onClick={() => signIn("google", { callbackUrl: "/profile" })}
                  className="rounded w-full flex items-center justify-center gap-3 px-6 py-2.5 bg-white dark:bg-[#131314] hover:bg-gray-50 dark:hover:bg-[#2c2c2e] text-[#1f1f1f] dark:text-white font-medium border border-[#dadce0] dark:border-[#5f6368] transition-colors"
                  style={{ height: "40px" }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 18 18"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
                      fill="#4285F4"
                    />
                    <path
                      d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
                      fill="#34A853"
                    />
                    <path
                      d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z"
                      fill="#EA4335"
                    />
                  </svg>
                  Sign in with Google
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Theme Settings Section */}
        <div>
          <div className="px-6 py-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Appearance
            </h3>
          </div>
          <div>
            {themeOptions.map((option, index) => {
              const Icon = option.icon;
              const isActive = theme === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => setTheme(option.value)}
                  className={`w-full flex items-center gap-3 px-6 py-4 transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "bg-card hover:bg-accent"
                  } ${index > 0 ? "border-t border-border" : ""}`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{option.label}</span>
                  {isActive && <Check className="ml-auto w-5 h-5" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sign Out Section */}
        {isAuthenticated && user && (
          <div>
            <div className="px-6 py-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Account
              </h3>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="w-full flex items-center gap-3 px-6 py-4 transition-colors bg-card hover:bg-accent text-muted-foreground hover:text-foreground"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Sign out</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
