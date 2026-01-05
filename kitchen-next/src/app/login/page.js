"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const supabase = createClient();

  // Check if user is already logged in
  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setCheckingAuth(false);
      
      // If user is already logged in, redirect to the target page
      if (user) {
        router.replace(redirectTo);
      }
    }
    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      // Redirect on successful login
      if (session?.user) {
        router.replace(redirectTo);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth, router, redirectTo]);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    });

    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      setMessage({ type: "success", text: "Check your email for the login link!" });
    }

    setLoading(false);
  }

  async function handleGoogleLogin() {
    setLoading(true);
    setMessage(null);

    // Include redirect parameter in callback URL
    const callbackUrl = new URL("/auth/callback", location.origin);
    if (redirectTo && redirectTo !== "/") {
      callbackUrl.searchParams.set("redirect", redirectTo);
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl.toString(),
        queryParams: {
          prompt: "select_account",
        },
      },
    });

    if (error) {
      setMessage({ type: "error", text: error.message });
      setLoading(false);
    }
  }

  async function handleSignOut() {
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setMessage({ type: "success", text: "Signed out successfully." });
    setLoading(false);
  }

  // Loading state
  if (checkingAuth) {
    return (
      <div style={{ maxWidth: 400, margin: "100px auto", padding: 20, textAlign: "center" }}>
        <p style={{ color: "#888" }}>Loading...</p>
      </div>
    );
  }

  // Logged in state
  if (user) {
    return (
      <div style={{ maxWidth: 400, margin: "100px auto", padding: 20 }}>
        <h1 style={{ marginBottom: 20 }}>Account</h1>

        <div
          style={{
            padding: 16,
            backgroundColor: "#f5f5f5",
            borderRadius: 8,
            marginBottom: 20,
          }}
        >
          <p style={{ margin: 0, fontSize: 14, color: "#666" }}>Logged in as:</p>
          <p style={{ margin: "8px 0 0", fontSize: 16, fontWeight: 500 }}>
            {user.email}
          </p>
          {user.user_metadata?.name && (
            <p style={{ margin: "4px 0 0", fontSize: 14, color: "#666" }}>
              {user.user_metadata.name}
            </p>
          )}
        </div>

        {message && (
          <div
            style={{
              marginBottom: 16,
              padding: 12,
              borderRadius: 4,
              backgroundColor: message.type === "error" ? "#fee" : "#efe",
              color: message.type === "error" ? "#c00" : "#060",
            }}
          >
            {message.text}
          </div>
        )}

        <button
          onClick={handleSignOut}
          disabled={loading}
          style={{
            width: "100%",
            padding: 12,
            fontSize: 16,
            backgroundColor: "#dc2626",
            color: "white",
            border: "none",
            borderRadius: 4,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Signing out..." : "Sign Out"}
        </button>
      </div>
    );
  }

  // Not logged in - show login form
  return (
    <div style={{ maxWidth: 400, margin: "100px auto", padding: 20 }}>
      <h1 style={{ marginBottom: 20 }}>Login</h1>

      {/* Google OAuth */}
      <button
        onClick={handleGoogleLogin}
        disabled={loading}
        style={{
          width: "100%",
          padding: 12,
          fontSize: 16,
          backgroundColor: "#fff",
          color: "#333",
          border: "1px solid #ddd",
          borderRadius: 4,
          cursor: loading ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          marginBottom: 20,
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Continue with Google
      </button>

      {/* Divider */}
      <div style={{ display: "flex", alignItems: "center", margin: "20px 0" }}>
        <div style={{ flex: 1, height: 1, backgroundColor: "#ddd" }} />
        <span style={{ padding: "0 12px", color: "#888", fontSize: 14 }}>or</span>
        <div style={{ flex: 1, height: 1, backgroundColor: "#ddd" }} />
      </div>

      {/* Email OTP */}
      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{
            width: "100%",
            padding: 12,
            marginBottom: 12,
            fontSize: 16,
            border: "1px solid #ccc",
            borderRadius: 4,
          }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: 12,
            fontSize: 16,
            backgroundColor: "#0070f3",
            color: "white",
            border: "none",
            borderRadius: 4,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Sending..." : "Send Magic Link"}
        </button>
      </form>

      {message && (
        <div
          style={{
            marginTop: 16,
            padding: 12,
            borderRadius: 4,
            backgroundColor: message.type === "error" ? "#fee" : "#efe",
            color: message.type === "error" ? "#c00" : "#060",
          }}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}
