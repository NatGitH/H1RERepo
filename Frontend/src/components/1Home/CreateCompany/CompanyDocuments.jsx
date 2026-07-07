import { useState } from "react";
import { useNavigate } from "react-router";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import { useCompanyRegistration } from "../../../.Context/CompanyRegistrationContext";
import { checkFileSize } from "../../../fileLimit";

export default function CompanyDocuments() {
  const navigate = useNavigate();
  const { updateData } = useCompanyRegistration();

  const [files, setFiles] = useState({
    businessPermit: null,
    dtiSec: null,
    bir: null,
  });

  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    if (file && !checkFileSize(file)) return;
    if (file) setFiles((prev) => ({ ...prev, [field]: file }));
  };

  const handleSubmit = () => {
    if (!files.businessPermit || !files.dtiSec || !files.bir) {
      window.showAlert("Please upload all required documents.");
      return;
    }
    updateData({
      businessPermit: files.businessPermit,
      dtiSec: files.dtiSec,
      bir: files.bir,
    });
    navigate("/subscription-plan");
  };

  const DocumentUpload = ({ label, description, field, inputId }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <p className="text-xs text-slate-400 mb-1">{description}</p>
      <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-1.5">
        <span className="text-xs text-slate-400 flex-1 truncate">
          {files[field] ? files[field].name : "No file chosen — PDF or image accepted"}
        </span>
        <label
          htmlFor={inputId}
          className="text-xs font-medium px-3 py-1 border border-gray-300 rounded-md cursor-pointer bg-slate-50 hover:bg-slate-100 transition whitespace-nowrap"
        >
          Browse file
        </label>
        <input
          id={inputId}
          type="file"
          accept=".pdf,image/*"
          className="hidden"
          onChange={(e) => handleFileChange(e, field)}
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B2447]">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[350px] bg-blue-600 opacity-10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-1/4 translate-x-1/2 -translate-y-1/2 w-[400px] h-[300px] bg-blue-400 opacity-8 rounded-full blur-3xl" />
      </div>

      <div
        className="bg-white rounded-2xl px-8 pt-6 pb-6 w-full max-w-sm mx-4 relative z-10"
        style={{ border: "2px solid #1a1a2e", boxShadow: "6px 6px 0px #000000" }}
      >
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={() => navigate("/create-company")}
            className="w-8 h-8 flex items-center justify-center rounded-full border-2 border-black hover:bg-slate-100 transition cursor-pointer"
          >
            <ArrowBackIosNewIcon style={{ fontSize: 14 }} />
          </button>
          <h2 className="text-xl font-bold text-black">Company Documents</h2>
        </div>

        <div className="flex flex-col gap-2">
          <DocumentUpload
            label="Business Permit"
            description="Issued by the Business Permits and Licensing Office (BPLO)"
            field="businessPermit"
            inputId="businessPermit"
          />
          <DocumentUpload
            label="DTI / SEC Registration"
            description="Proof of ownership — DTI for sole proprietors, SEC for corporations"
            field="dtiSec"
            inputId="dtiSec"
          />
          <DocumentUpload
            label="BIR Certificate of Registration"
            description="Form 2303 confirms tax compliance with the Bureau of Internal Revenue"
            field="bir"
            inputId="bir"
          />
        </div>

        <button
          onClick={handleSubmit}
          className="mt-5 w-full bg-[#0d1b3e] hover:bg-[#162553] text-white font-semibold py-2.5 rounded-lg transition duration-200"
        >
          Submit Documents
        </button>
      </div>
    </div>
  );
}