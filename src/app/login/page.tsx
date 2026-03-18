"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
      
      if (userDoc.exists()) {
        const role = userDoc.data().role;
        // The redirection logic is role-dependent
        if (role === "super_admin") router.push("/super-admin");
        else if (role === "admin") router.push("/admin");
        else if (role === "trainer") router.push("/trainer");
        else router.push("/user"); // Fallback for standard users
      }
    } catch (err: any) {
      setError("Invalid credentials. Please try again.");
    }
  };

  return (
    <>
      {/* This is the critical fix. Since globals.css is deleted, we must use 
        internal CSS to define the widths and colors, as seen in your reference.
      */}
      <style>{`
        /* Global Reset to prevent margins/padding that spoiled previous layouts */
        html, body { margin: 0; padding: 0; height: 100%; width: 100%; overflow: hidden; }
        
        /* Two-Column split screen container */
        .login-wrapper { display: flex; min-height: 100vh; width: 100%; font-family: sans-serif; background-color: #0a0a0a; }
        
        /* Left Column (Image): Only show on large screens (lg:) */
        .event-image-section { position: relative; width: 50%; display: none; }
        @media (min-width: 1024px) { .event-image-section { display: block; } }
        
        /* Right Column (Form) */
        .login-form-section { display: flex; width: 100%; flex-direction: column; align-items: center; justify-content: center; padding: 0 40px; background-color: #0a0a0a; }
        @media (min-width: 1024px) { .login-form-section { width: 50%; } }
        
        /* Dark input field styling */
        .custom-input { width: 100%; padding: 16px; margin-top: 8px; border-radius: 12px; background: #18181b; border: 1px solid #27272a; color: white; outline: none; box-sizing: border-box; }
        .custom-input:focus { border-color: #f97316; box-shadow: 0 0 0 4px rgba(249, 115, 22, 0.1); }
        
        /* Primary Orange Button */
        .login-submit-btn { width: 100%; padding: 16px; margin-top: 24px; border-radius: 12px; background-color: #f97316; color: white; font-weight: bold; border: none; cursor: pointer; transition: background 0.2s; font-size: 1.1rem; }
        .login-submit-btn:hover { background-color: #ea580c; }
      `}</style>

      <main className="login-wrapper">
        {/* Left Section: Visual Impact (as per the reference image) */}
        <div className="event-image-section">
          <Image
            src="https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?q=80&w=2070&auto=format&fit=crop"
            alt="Eventra Experience"
            fill
            style={{ objectFit: 'cover', opacity: 0.4 }}
            priority
          />
          {/* Brand Overlay - Top Left */}
          <div style={{ position: 'absolute', left: '48px', top: '48px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ height: '48px', width: '48px', backgroundColor: '#f97316', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', color: 'white', fontSize: '1.5rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>E</div>
            <span style={{ fontSize: '1.875rem', fontWeight: '900', color: 'white', letterSpacing: '-1.5px' }}>Eventra</span>
          </div>
          
          {/* Catchphrase Overlay - Bottom Left */}
          <div style={{ position: 'absolute', bottom: '80px', left: '48px' }}>
            <h2 style={{ fontSize: '4.5rem', fontWeight: '900', color: 'white', textTransform: 'uppercase', lineHeight: '0.9', margin: 0, letterSpacing: '-4px' }}>
              Plan. <br /> Manage. <br /> <span style={{ color: '#f97316' }}>Succeed.</span>
            </h2>
          </div>
        </div>

        {/* Right Section: Form Section (The missing part) */}
        <div className="login-form-section">
          <div style={{ width: '100%', maxWidth: '400px' }}>
            <div style={{ marginBottom: '40px', textAlign: 'left' }}>
              <h1 style={{ fontSize: '2.25rem', fontWeight: '900', color: 'white', margin: 0 }}>Welcome Back</h1>
              <p style={{ marginTop: '12px', color: '#71717a', fontSize: '1rem' }}>Enter your credentials to manage your events.</p>
            </div>

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#a1a1aa', textTransform: 'uppercase', display: 'block' }}>Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@eventra.com"
                  className="custom-input"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#a1a1aa', textTransform: 'uppercase', display: 'block' }}>Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="custom-input"
                />
              </div>

              {error && <div style={{ p: '12px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', fontSize: '0.875rem' }}>{error}</div>}

              <button type="submit" className="login-submit-btn">
                Sign into Dashboard →
              </button>
            </form>
          </div>
        </div>
      </main>
    </>
  );
}