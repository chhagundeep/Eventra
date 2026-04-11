"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, Eye, EyeOff, Lock, Mail } from "lucide-react";


export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // Check root users collection
      const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
      
      if (userDoc.exists()) {
        const role = userDoc.data().role;
        router.push(`/${role.replace('_', '-')}`);
      } else {
        setError("User profile not found in system.");
      }
    } catch (err: any) {
      setError("Invalid credentials. Please try again.");
    }
  };

  return (
    <main className="flex min-h-screen w-full bg-[#0a0a0a] overflow-hidden text-white">
      {/* LEFT SECTION: Branding */}
      <div className="relative hidden lg:flex lg:w-1/2 flex-col justify-between p-16 border-r border-zinc-800/50">
        <motion.div
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.35 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute inset-0"
        >
          <Image
            src="https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?q=80&w=2070&auto=format&fit=crop"
            alt="Eventra Experience"
            fill
            className="object-cover"
            priority
          />
        </motion.div>

        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent z-0" />

        <motion.div
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="relative z-10 flex items-center gap-4"
        >
          <div className="h-12 w-12 rounded-2xl overflow-hidden shadow-orange-900/40 shadow-2xl">
          <Image
          src="/logo.png"
          alt="Eventra Logo"
          width={48}
          height={48}
          className="object-contain"   
          priority                   
          />
          </div>
          <span className="text-3xl font-black tracking-tighter italic text-white">Eventra</span>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="relative z-10"
        >
          <h2 className="text-[5.5rem] font-black leading-[0.8] tracking-tighter uppercase italic text-white">
            Plan. <br />
            Manage. <br />
            <span className="text-orange-600">Succeed.</span>
          </h2>
        </motion.div>
      </div>

      {/* RIGHT SECTION: Form */}
      <div className="flex w-full lg:w-1/2 flex-col items-center justify-center px-8 md:px-20 bg-[#0a0a0a] relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md space-y-10"
        >
          <div className="space-y-3 text-left">
            <h1 className="text-4xl font-black tracking-tight text-white">Sign In</h1>
            <p className="text-zinc-500 font-medium">Welcome back to the Eventra platform.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email Field */}
            <div className="group space-y-2">
              <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-[0.2em] ml-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-orange-600 transition-colors z-10" size={18} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-5 py-4 rounded-2xl bg-zinc-900/50 border border-zinc-800 text-white outline-none focus:ring-4 focus:ring-orange-600/10 focus:border-orange-600 transition-all"
                  placeholder="*****@eventra.com"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="group space-y-2">
              <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-[0.2em] ml-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-orange-600 transition-colors z-10" size={18} />
                
                <input
                  type={showPassword ? "text" : "password"} // Dynamic type
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-4 rounded-2xl bg-zinc-900/50 border border-zinc-800 text-white outline-none focus:ring-4 focus:ring-orange-600/10 focus:border-orange-600 transition-all"
                  placeholder="••••••••"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-orange-500 transition-colors z-20 p-1"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-semibold"
              >
                {error}
              </motion.div>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="w-full py-5 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white font-black text-lg flex items-center justify-center gap-3 transition-all shadow-2xl shadow-orange-900/20"
            >
              Sign into Dashboard <ArrowRight size={22} />
            </motion.button>
          </form>
        </motion.div>
      </div>
    </main>
  );
}