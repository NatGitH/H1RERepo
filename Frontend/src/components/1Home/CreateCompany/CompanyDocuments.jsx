import { useState } from "react";
import { useNavigate } from "react-router";

export default function CompanyDocuments() {
  const navigate = useNavigate();

  const [files, setFiles] = useState({
    businessPermit: null,
    dtiSec: null,
    bir: null,
  });

  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      setFiles((prev) => ({ ...prev, [field]: file }));
    }
  };

  const handleSubmit = () => {
    if (!files.businessPermit || !files.dtiSec || !files.bir) {
      alert("Please upload all required documents.");
      return;
    }
    // TODO: connect to Django API
    console.log("Documents submitted:", files);
    navigate("/account-verification");
  };

  const DocumentUpload = ({ label, description, field }) => (
    <div className="mb-5">
      <p className="text-sm font-bold text-slate-800 mb-0.5 text-left">{label}</p>
      <p className="text-xs text-slate-400 mb-2 text-left">{description}</p>
      <div className="flex items-center border border-dashed border-slate-300 rounded-lg overflow-hidden">
        <span className="flex-1 px-3 py-2 text-xs text-slate-400 truncate text-left">
          {files[field] ? files[field].name : "No file chosen — PDF or Image accepted"}
        </span>
        <label
          htmlFor={field}
          className="px-4 py-2 bg-white border-l border-slate-300 text-xs font-semibold text-slate-700 cursor-pointer hover:bg-slate-50 transition whitespace-nowrap"
        >
          Browse file
          <input
            id={field}
            type="file"
            accept=".pdf,image/*"
            className="hidden"
            onChange={(e) => handleFileChange(e, field)}
          />
        </label>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d1b3e] relative overflow-hidden">

      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[350px] bg-blue-600 opacity-10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-1/4 translate-x-1/2 -translate-y-1/2 w-[400px] h-[300px] bg-blue-400 opacity-8 rounded-full blur-3xl" />
      </div>

      {/* Card */}
      <div
        className="relative z-10 bg-white rounded-2xl px-8 pt-7 pb-8 w-full max-w-md mx-4"
        style={{
          boxShadow: "0 8px 48px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.3)",
          animation: "fadeUp 0.55s cubic-bezier(0.22,1,0.36,1) both",
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-1">
          <button
            onClick={() => navigate("/create-company")}
            className="w-8 h-8 flex items-center justify-center rounded-full border border-slate-300 text-slate-500 hover:bg-slate-100 transition"
          >
            ←
          </button>
          <h2 className="font-semibold" style={{ color: "#000000" }}>Company documents</h2>
        </div>

        <p className="text-xs text-slate-400 mb-6 ml-11 text-left">
          Upload the required business verification documents
        </p>

        {/* Document Uploads */}
        <DocumentUpload
          label="Business Permit"
          description="Issued by the Business Permits and Licensing Office (BPLO)"
          field="businessPermit"
        />
        <DocumentUpload
          label="DTI / SEC Registration"
          description="Proof of ownership — DTI for sole proprietors, SEC for corporations"
          field="dtiSec"
        />
        <DocumentUpload
          label="BIR Certificate of Registration"
          description="Form 2303 confirms tax compliance with the Bureau of Internal Revenue"
          field="bir"
        />

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          className="mt-2 w-full bg-[#1a4ccc] hover:bg-[#1440b0] text-white text-sm font-semibold py-2.5 rounded-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:scale-95"
        >
          Submit
        </button>
      </div>

      {/* Keyframe */}
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}