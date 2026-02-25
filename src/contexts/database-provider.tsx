"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  StorageAdapter,
  StorageType,
  PendingLocalData,
} from "@/lib/storage/storage-adapter";
import { LocalStorageAdapter } from "@/lib/storage/local-storage-adapter";
import { DatabaseStorageAdapter } from "@/lib/storage/database-storage-adapter";

const MIGRATED_KEY = "habits-app-migrated";
const STORAGE_KEYS = {
  HABITS: "habits-app-habits",
  TAGS: "habits-app-tags",
  PROGRESS: "habits-app-progress",
} as const;

function getFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setToStorage<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error("Failed to save to localStorage:", error);
  }
}

interface DatabaseContextValue {
  storageType: StorageType;
  storage: StorageAdapter;
  isReady: boolean;
  pendingMigration: PendingLocalData | null;
  isSyncing: boolean;
  migrate: () => Promise<void>;
  dismissMigration: () => void;
}

const DatabaseContext = createContext<DatabaseContextValue | null>(null);

export function useDatabaseContext() {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error("useDatabaseContext must be used within DatabaseProvider");
  }
  return context;
}

interface DatabaseProviderProps {
  children: React.ReactNode;
}

export function DatabaseProvider({ children }: DatabaseProviderProps) {
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";
  const isAuthLoading = status === "loading";

  const [storageType, setStorageType] = useState<StorageType>("local");
  const [storage, setStorage] = useState<StorageAdapter>(
    new LocalStorageAdapter(),
  );
  const [isReady, setIsReady] = useState(false);
  const [pendingMigration, setPendingMigration] =
    useState<PendingLocalData | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Switch storage adapter based on auth state
  useEffect(() => {
    if (isAuthLoading) {
      setIsReady(false);
      return;
    }

    const initializeStorage = async () => {
      if (isAuthenticated) {
        // Switch to database storage
        setStorageType("db");
        setStorage(new DatabaseStorageAdapter());

        // Check for pending migration
        const alreadyMigrated = getFromStorage<boolean>(MIGRATED_KEY, false);
        if (!alreadyMigrated) {
          const localHabits = getFromStorage(STORAGE_KEYS.HABITS, []);
          const localTags = getFromStorage(STORAGE_KEYS.TAGS, []);
          const localProgress = getFromStorage(STORAGE_KEYS.PROGRESS, []);

          if (localHabits.length > 0 || localTags.length > 0) {
            setPendingMigration({
              habits: localHabits,
              tags: localTags,
              progressEvents: localProgress,
            });
          }
        }
      } else {
        // Switch to local storage
        setStorageType("local");
        setStorage(new LocalStorageAdapter());
        setPendingMigration(null);
      }

      setIsReady(true);
    };

    initializeStorage();
  }, [isAuthenticated, isAuthLoading]);

  const migrate = async () => {
    if (!pendingMigration || storageType !== "db") return;

    setIsSyncing(true);
    try {
      const dbAdapter = storage as DatabaseStorageAdapter;
      if (dbAdapter.migrate) {
        await dbAdapter.migrate(pendingMigration);
        setToStorage(MIGRATED_KEY, true);
        setPendingMigration(null);
      }
    } catch (error) {
      console.error("Migration failed:", error);
      throw error;
    } finally {
      setIsSyncing(false);
    }
  };

  const dismissMigration = () => {
    setToStorage(MIGRATED_KEY, true);
    setPendingMigration(null);
  };

  return (
    <DatabaseContext.Provider
      value={{
        storageType,
        storage,
        isReady,
        pendingMigration,
        isSyncing,
        migrate,
        dismissMigration,
      }}
    >
      {children}
    </DatabaseContext.Provider>
  );
}
