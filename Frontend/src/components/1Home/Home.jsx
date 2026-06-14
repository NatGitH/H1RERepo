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
        className="bg-white rounded-2xl px-10 pt-9 pb-9 w-full max-w-md mx-4 relative z-10"
        style={{
          border: "2px solid #1a1a2e",
          boxShadow: "6px 6px 0px #000000",
        }}
      >
        {/* Logo */}
        <div className="text-center mb-6">
          <h1 className="text-[2.5rem] font-extrabold tracking-tight leading-none">
            <span className="text-black">H</span>
            <span className="text-[#1a4ccc]">!</span>
            <span className="text-black">RE</span>
          </h1>

          <p className="text-base text-gray-400 mt-2">
            Choose your form of action
          </p>
        </div>

        {/* Action Buttons Grid */}
        <div className="grid grid-cols-2 gap-4 mt-7">
          {actions.map((action) => (
            <button
              key={action.route}
              onClick={() => navigate(action.route)}
              className={`cursor-pointer w-full py-3.5 rounded-full text-white text-[0.95rem] font-semibold transition duration-200 ${
                  action.variant === "dark"
                    ? "bg-[#0d1b3e] hover:bg-[#162553]"
                    : "bg-[#2255cc] hover:bg-[#1a44bb]"
                }
              `}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}