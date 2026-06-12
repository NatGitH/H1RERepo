import os, uuid, pdfplumber, re
from PIL import Image
import pytesseract
from sentence_transformers import SentenceTransformer, util
from groq import Groq
from supabase import create_client
from django.conf import settings

# Initialize clients
supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)
groq_client = Groq(api_key=settings.GROQ_API_KEY)

# Load Sentence-BERT model once (cached after first load)
sbert_model = SentenceTransformer("all-MiniLM-L6-v2")


def extract_text_from_pdf(file_bytes: bytes) -> str:
    import io
    text = ""
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    return text.strip()


def extract_text_from_image(file_bytes: bytes) -> str:
    import io
    image = Image.open(io.BytesIO(file_bytes))
    text = pytesseract.image_to_string(image)
    return text.strip()


def compute_sbert_score(resume_text: str, job_requirements: str) -> float:
    embeddings = sbert_model.encode(
        [resume_text, job_requirements], convert_to_tensor=True
    )
    similarity = util.cos_sim(embeddings[0], embeddings[1])
    score = float(similarity[0][0]) * 100
    return round(min(max(score, 0), 100), 2)


def analyze_with_groq(resume_text: str, job_title: str, description: str, qualifications: str) -> dict:
    prompt = f"""You are an expert HR evaluator for the H!RE platform.

Analyze this resume against the job requirement below and return ONLY a valid JSON object.

JOB TITLE: {job_title}
JOB DESCRIPTION: {description}
QUALIFICATIONS: {qualifications}

RESUME:
{resume_text[:3000]}

Return ONLY this JSON (no markdown, no explanation):
{{
  "pros": ["pro1", "pro2", "pro3"],
  "cons": ["con1", "con2"],
  "summary": "2-3 sentence summary of the candidate's fit for this role"
}}"""

    response = groq_client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        max_tokens=500,
    )

    raw = response.choices[0].message.content.strip()

    # Strip markdown code blocks if present
    raw = re.sub(r"```json|```", "", raw).strip()

    import json
    result = json.loads(raw)
    return result


def upload_resume_to_storage(file_bytes: bytes, file_name: str) -> str:
    path = f"resumes/{uuid.uuid4()}_{file_name}"
    supabase.storage.from_("resumes").upload(
        path,
        file_bytes,
        {"content-type": "application/octet-stream"},
    )
    public_url = supabase.storage.from_("resumes").get_public_url(path)
    return public_url, path


def evaluate_resume(file_bytes: bytes, file_name: str, file_type: str,
                    requirement_id: str, job_title: str,
                    description: str, qualifications: str,
                    uploaded_by_user_id: str) -> dict:

    # 1. Extract text
    if file_type in ["application/pdf", "pdf"]:
        resume_text = extract_text_from_pdf(file_bytes)
    else:
        resume_text = extract_text_from_image(file_bytes)

    if not resume_text:
        raise ValueError("Could not extract text from file")

    # 2. Compute SBERT similarity score
    job_requirements_text = f"{job_title} {description} {qualifications}"
    sbert_score = compute_sbert_score(resume_text, job_requirements_text)

    # 3. Groq LLM analysis
    ai_result = analyze_with_groq(resume_text, job_title, description, qualifications)

    # 4. Upload file to Supabase Storage
    public_url, file_path = upload_resume_to_storage(file_bytes, file_name)

    # 5. Save to DB via Supabase
    resume_id = str(uuid.uuid4())
    evaluation_id = str(uuid.uuid4())

    # Insert into Resumes table
    supabase.table("Resumes").insert({
        "resume_id":           resume_id,
        "uploaded_by_user_id": uploaded_by_user_id,
        "file_name":           file_name,
        "file_type":           file_type,
        "file_path":           file_path,
        "extracted_text":      resume_text,
    }).execute()

    # Insert into Evaluations table
    supabase.table("Evaluations").insert({
        "evaluation_id":      evaluation_id,
        "requirement_id":     requirement_id,
        "resume_id":          resume_id,
        "hire_score":         sbert_score,
        "ai_summary":         ai_result.get("summary", ""),
        "applicationtion_status": "pending",
    }).execute()

    # Insert Pros
    for pro in ai_result.get("pros", []):
        supabase.table("Evaluation_Pros").insert({
            "pros_id":       str(uuid.uuid4()),
            "evaluation_id": evaluation_id,
            "pros_text":     pro,
        }).execute()

    # Insert Cons
    for con in ai_result.get("cons", []):
        supabase.table("Evaluation_Cons").insert({
            "cons_id":       str(uuid.uuid4()),
            "evaluation_id": evaluation_id,
            "cons_text":     con,
        }).execute()

    return {
        "evaluation_id": evaluation_id,
        "resume_id":     resume_id,
        "hire_score":    sbert_score,
        "summary":       ai_result.get("summary", ""),
        "pros":          ai_result.get("pros", []),
        "cons":          ai_result.get("cons", []),
        "file_url":      public_url,
    }