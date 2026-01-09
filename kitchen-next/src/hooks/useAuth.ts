"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@/types/account";

interface UseAuthReturn {
  user: User | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

/**
 * Client-side hook for authentication state.
 * Uses Supabase auth and maps to our User type.
 */
export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient();

  // Fetch and map user
  const fetchUser = useCallback(async () => {
    try {
      const { data: { user: supabaseUser } } = await supabase.auth.getUser();
      
      if (supabaseUser) {
        const metadata = supabaseUser.user_metadata || {};
        const googleIdentity = supabaseUser.identities?.find(i => i.provider === 'google')?.identity_data;
        
        // Extract avatar URL - Google OAuth uses 'picture', others may use 'avatar_url'
        const avatarUrl = 
          metadata.picture ||
          metadata.avatar_url ||
          metadata.avatarUrl ||
          googleIdentity?.picture ||
          googleIdentity?.avatar_url ||
          null;

        // Extract first/last name from Google OAuth or fallback to splitting full name
        const firstName = 
          metadata.given_name ||
          googleIdentity?.given_name ||
          null;
        
        const lastName = 
          metadata.family_name ||
          googleIdentity?.family_name ||
          null;

        const fullName = 
          metadata.name || 
          metadata.full_name ||
          (firstName && lastName ? `${firstName} ${lastName}` : firstName || lastName) ||
          null;

        setUser({
          id: supabaseUser.id,
          email: supabaseUser.email || "",
          name: fullName,
          firstName,
          lastName,
          avatarUrl,
          createdAt: new Date(supabaseUser.created_at),
        });
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [supabase.auth]);

  // Initial fetch and auth state listener
  useEffect(() => {
    fetchUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          const metadata = session.user.user_metadata || {};
          const googleIdentity = session.user.identities?.find(i => i.provider === 'google')?.identity_data;
          
          // Extract avatar URL
          const avatarUrl = 
            metadata.picture ||
            metadata.avatar_url ||
            metadata.avatarUrl ||
            googleIdentity?.picture ||
            googleIdentity?.avatar_url ||
            null;

          // Extract first/last name from Google OAuth
          const firstName = 
            metadata.given_name ||
            googleIdentity?.given_name ||
            null;
          
          const lastName = 
            metadata.family_name ||
            googleIdentity?.family_name ||
            null;

          const fullName = 
            metadata.name || 
            metadata.full_name ||
            (firstName && lastName ? `${firstName} ${lastName}` : firstName || lastName) ||
            null;

          setUser({
            id: session.user.id,
            email: session.user.email || "",
            name: fullName,
            firstName,
            lastName,
            avatarUrl,
            createdAt: new Date(session.user.created_at),
          });
        } else {
          setUser(null);
        }
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchUser, supabase.auth]);

  // Sign out handler
  const signOut = useCallback(async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setIsLoading(false);
    }
  }, [supabase.auth]);

  return { user, isLoading, signOut };
}

