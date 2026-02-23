"use client";

import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { LogIn, LogOut, User } from "lucide-react";

export function SidebarAuth() {
  const { user, isLoading, isAuthenticated, signInWithGoogle, signOut } =
    useAuth();

  if (isLoading) {
    return (
      <div className="px-4 py-3 border-t border-border">
        <div className="h-10 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  if (isAuthenticated && user) {
    return (
      <div className="px-4 py-3 border-t border-border">
        <div className="flex items-center gap-3 mb-3">
          {user.image ? (
            <img
              src={user.image}
              alt={user.name || "User"}
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-4 h-4 text-primary" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {user.name || "User"}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user.email}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground"
          onClick={() => signOut()}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign out
        </Button>
      </div>
    );
  }

  return (
    <div className="px-4 py-3 border-t border-border">
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() => signInWithGoogle()}
      >
        <LogIn className="w-4 h-4 mr-2" />
        Sign in to sync
      </Button>
    </div>
  );
}
