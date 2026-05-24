import { useState } from "react";
import { useNavigate } from "react-router";

export default function Home() {
  const navigate = useNavigate();

  const actions = [
    { label: "Create Company",   route: "/create-company",  variant: "blue" },
    { label: "Login as Owner",   route: "/login-owner",     variant: "dark" },
    { label: "Login to Company", route: "/login-company",   variant: "blue" },
    { label: "Login as Admin",   route: "/login-admin",     variant: "dark" },
  ];

  return (
    
    <div className="min-h-screen flex items-center justify-center bg-[#0B2447]">

      {/* Glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[350px] bg-blue-600 opacity-10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-1/4 translate-x-1/2 -translate-y-1/2 w-[400px] h-[300px] bg-blue-400 opacity-8 rounded-full blur-3xl" />
      </div>

      {/* Card */}
      <div
        className="bg-white rounded-2xl px-10 pt-10 pb-8 w-full max-w-sm mx-4"
        style={{
          border: "2px solid #1a1a2e",
          boxShadow: "6px 6px 0px rgb(0, 0, 0)",
        }}
      >
        {/* Logo */}
        <div className="text-center mb-6">
          <h1 className="text-[2rem] font-extrabold tracking-tight leading-none">
            <span className="text-black">H</span>
            <span className="text-[#1a4ccc]">!</span>
            <span className="text-black">RE</span>
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            Choose your form of action
          </p>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-100 my-6" />

        {/* Action Buttons Grid */}
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action) => (
            <button
              key={action.route}
              onClick={() => navigate(action.route)}
              className="
                w-full py-3.5 rounded-full
                text-white text-sm font-semibold
                transition-all duration-150
                active:scale-95
                border-2 border-black
                cursor-pointer
              "
              style={{
                background: action.variant === "dark" ? "#1a2a6c" : "#1a4ccc",
              }}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}