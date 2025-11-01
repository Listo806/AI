import React, { useState } from "react";
import signInHero from "../assets/signin-hero.png";

const SignInLandingPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`Signing in as ${email}`);
    // Replace with real login logic or CRM redirect
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-white via-blue-50/20 to-blue-100/40">
      {/* Left: Text */}
      <div className="flex-1 flex flex-col justify-center px-8 md:px-20 py-20">
        <h1 className="text-5xl font-semibold text-slate-900 mb-4">
          Your AI-Powered Real Estate Workspace Awaits
        </h1>
        <p className="text-slate-600 text-lg mb-10">
          Manage properties, leads, analytics, and automations in one seamless AI-driven platform.
        </p>
        <form
          onSubmit={handleSubmit}
          className="bg-white shadow-lg rounded-2xl p-8 border border-slate-100 w-full max-w-md"
        >
          <label className="block mb-4">
            <span className="text-sm text-slate-600">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mt-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          </label>
          <label className="block mb-6">
            <span className="text-sm text-slate-600">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mt-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          </label>
          <button
            type="submit"
            className="w-full py-3 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition"
          >
            Sign In
          </button>
          <div className="flex justify-between items-center mt-4 text-sm text-slate-500">
            <a href="#" className="hover:text-blue-600">
              Forgot password?
            </a>
            <a href="#" className="hover:text-blue-600">
              Create account
            </a>
          </div>
        </form>
      </div>

      {/* Right: Hero Image */}
      <div className="flex-1 flex items-center justify-center p-10">
        <img
          src={signInHero}
          alt="People working with AI CRM"
          className="rounded-2xl shadow-2xl border border-slate-100 w-full max-w-lg"
        />
      </div>
    </div>
  );
};

export default SignInLandingPage;
