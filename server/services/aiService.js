import { geminiConfig } from '../config/gemini.js';

const KNOWN_SKILLS = [
  'JavaScript',
  'TypeScript',
  'React',
  'Next.js',
  'Node.js',
  'Express.js',
  'MongoDB',
  'SQL',
  'PostgreSQL',
  'MySQL',
  'Python',
  'Java',
  'C++',
  'C',
  'HTML',
  'CSS',
  'Tailwind CSS',
  'Redux',
  'REST API',
  'GraphQL',
  'AWS',
  'Docker',
  'Git',
  'GitHub',
  'DSA',
  'Data Structures',
  'Algorithms',
  'Machine Learning',
  'Deep Learning',
  'TensorFlow',
  'PyTorch',
  'Pandas',
  'NumPy',
  'Power BI',
  'Excel',
  'Figma',
  'UI/UX',
  'Testing',
  'Jest',
  'Cypress',
  'Socket.IO',
  'Cloudinary',
  'Firebase',
  'Linux',
  'Cybersecurity',
];

const ROLE_KEYWORDS = {
  'frontend developer': ['React', 'JavaScript', 'TypeScript', 'HTML', 'CSS', 'Responsive Design'],
  'backend developer': ['Node.js', 'Express.js', 'MongoDB', 'SQL', 'API Design', 'Authentication'],
  'full stack developer': ['React', 'Node.js', 'MongoDB', 'REST API', 'Authentication', 'Deployment'],
  'data analyst': ['SQL', 'Excel', 'Power BI', 'Python', 'Pandas', 'Data Visualization'],
  'data scientist': ['Python', 'Machine Learning', 'Pandas', 'NumPy', 'Statistics', 'Model Evaluation'],
  'ai engineer': ['Python', 'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'MLOps'],
};

function uniqueItems(values = []) {
  return [...new Set(values.map((item) => String(item).trim()).filter(Boolean))];
}

function extractSkillsFromText(resumeText = '') {
  const text = resumeText.toLowerCase();
  return KNOWN_SKILLS.filter((skill) => text.includes(skill.toLowerCase()));
}

function detectSections(resumeText = '') {
  const text = resumeText.toLowerCase();
  return {
    contact: /email|phone|mobile|linkedin|github/.test(text),
    summary: /summary|objective|profile/.test(text),
    education: /education|university|college|b\.tech|bca|mca|degree/.test(text),
    skills: /skills|technologies|tools/.test(text),
    projects: /projects|portfolio/.test(text),
    experience: /experience|internship|work history/.test(text),
    certifications: /certification|certifications|certificate/.test(text),
  };
}

function estimateATSScore(resumeText = '', extractedSkills = []) {
  if (!resumeText.trim()) return 35;

  const sections = detectSections(resumeText);
  const presentSections = Object.values(sections).filter(Boolean).length;
  const lengthBonus = Math.min(15, Math.round(resumeText.length / 350));
  const skillBonus = Math.min(20, extractedSkills.length * 2);
  const sectionScore = presentSections * 5;

  return Math.max(38, Math.min(92, 30 + sectionScore + lengthBonus + skillBonus));
}

function roleKeywordSuggestions(preferredCareer = '', extractedSkills = []) {
  const role = preferredCareer.toLowerCase().trim();
  const roleKeywords = ROLE_KEYWORDS[role] || [];
  return roleKeywords.filter((keyword) => !extractedSkills.some((skill) => skill.toLowerCase() === keyword.toLowerCase()));
}

function buildFallbackAnalysis(resumeText = '', preferredCareer = '') {
  const extractedSkills = extractSkillsFromText(resumeText);
  const atsScore = estimateATSScore(resumeText, extractedSkills);
  const missingKeywords = roleKeywordSuggestions(preferredCareer, extractedSkills).slice(0, 6);
  const sections = detectSections(resumeText);

  const strengths = uniqueItems([
    extractedSkills.length >= 4 ? 'The resume shows a useful spread of technical skills.' : '',
    sections.projects ? 'Projects are present, which helps recruiters assess hands-on experience.' : '',
    sections.education ? 'Education details are visible and ATS-friendly.' : '',
    sections.contact ? 'Contact and profile links appear to be present.' : '',
  ]).slice(0, 4);

  const improvements = uniqueItems([
    !sections.summary ? 'Add a 2–3 line professional summary tailored to your target role.' : '',
    !sections.projects ? 'Include 2–3 projects with measurable outcomes and tech stack details.' : '',
    !sections.experience ? 'If you lack work experience, highlight internships, freelance work, or leadership roles.' : '',
    missingKeywords.length ? `Add role-relevant keywords such as: ${missingKeywords.join(', ')}.` : '',
    extractedSkills.length < 5 ? 'Expand the skills section with tools, frameworks, and core concepts you actually know.' : '',
  ]).slice(0, 5);

  const recommendedRoles = uniqueItems([
    preferredCareer || '',
    extractedSkills.includes('React') && extractedSkills.includes('JavaScript') ? 'Frontend Developer' : '',
    extractedSkills.includes('Node.js') && extractedSkills.includes('MongoDB') ? 'Backend Developer' : '',
    extractedSkills.includes('React') && extractedSkills.includes('Node.js') ? 'Full Stack Developer' : '',
    extractedSkills.includes('Python') && (extractedSkills.includes('Pandas') || extractedSkills.includes('Machine Learning'))
      ? 'Data Analyst'
      : '',
  ]).slice(0, 4);

  return {
    summary: preferredCareer
      ? `This resume is a promising base for a ${preferredCareer} path, but it can be improved with stronger role-specific keywords and more quantified achievements.`
      : 'This resume has a usable foundation, but it would benefit from stronger targeting, clearer project outcomes, and better ATS keyword alignment.',
    atsScore,
    strengths: strengths.length ? strengths : ['The resume contains enough information to start improving it.'],
    improvements: improvements.length ? improvements : ['Tailor the resume more closely to a specific role and add measurable impact.'],
    missingKeywords,
    extractedSkills,
    recommendedRoles: recommendedRoles.length ? recommendedRoles : ['Software Developer'],
    projectSuggestions: uniqueItems([
      preferredCareer ? `${preferredCareer} portfolio project with deployment and documentation` : '',
      extractedSkills.includes('React') ? 'Responsive React dashboard connected to a REST API' : '',
      extractedSkills.includes('Node.js') ? 'Node.js + Express backend with auth and CRUD APIs' : '',
      extractedSkills.includes('Python') ? 'Data analysis notebook with visualization and business insights' : '',
    ]).slice(0, 4),
    courseSuggestions: uniqueItems([
      missingKeywords.includes('TypeScript') ? 'TypeScript for JavaScript developers' : '',
      missingKeywords.includes('REST API') ? 'REST API design and backend fundamentals' : '',
      missingKeywords.includes('Deployment') ? 'Modern web app deployment on Vercel/Render' : '',
      extractedSkills.includes('React') ? 'Advanced React patterns and state management' : 'Frontend foundations: HTML, CSS, JavaScript',
    ]).slice(0, 4),
    keywordOptimizationTips: [
      'Mirror keywords from the target job description in your summary, skills, and project bullets.',
      'Use action verbs and quantify results wherever possible.',
      'Keep headings simple: Summary, Skills, Projects, Experience, Education.',
    ],
  };
}

function parseJsonFromText(text = '') {
  const cleaned = text.trim();
  const fenced = cleaned.match(/```json\s*([\s\S]*?)```/i) || cleaned.match(/```([\s\S]*?)```/i);
  const candidate = fenced?.[1] || cleaned.match(/\{[\s\S]*\}/)?.[0] || '';

  if (!candidate) return null;

  try {
    return JSON.parse(candidate);
  } catch {
    return null;
  }
}

function normalizeAnalysis(raw = {}, fallback = {}) {
  return {
    summary: String(raw.summary || fallback.summary || '').trim(),
    atsScore: Number.isFinite(Number(raw.atsScore))
      ? Math.max(0, Math.min(100, Number(raw.atsScore)))
      : fallback.atsScore || 0,
    strengths: uniqueItems(Array.isArray(raw.strengths) ? raw.strengths : fallback.strengths || []).slice(0, 6),
    improvements: uniqueItems(Array.isArray(raw.improvements) ? raw.improvements : fallback.improvements || []).slice(0, 8),
    missingKeywords: uniqueItems(
      Array.isArray(raw.missingKeywords) ? raw.missingKeywords : fallback.missingKeywords || [],
    ).slice(0, 10),
    extractedSkills: uniqueItems(
      Array.isArray(raw.extractedSkills) ? raw.extractedSkills : fallback.extractedSkills || [],
    ).slice(0, 20),
    recommendedRoles: uniqueItems(
      Array.isArray(raw.recommendedRoles) ? raw.recommendedRoles : fallback.recommendedRoles || [],
    ).slice(0, 6),
    projectSuggestions: uniqueItems(
      Array.isArray(raw.projectSuggestions) ? raw.projectSuggestions : fallback.projectSuggestions || [],
    ).slice(0, 6),
    courseSuggestions: uniqueItems(
      Array.isArray(raw.courseSuggestions) ? raw.courseSuggestions : fallback.courseSuggestions || [],
    ).slice(0, 6),
    keywordOptimizationTips: uniqueItems(
      Array.isArray(raw.keywordOptimizationTips)
        ? raw.keywordOptimizationTips
        : fallback.keywordOptimizationTips || [],
    ).slice(0, 6),
  };
}

async function callGeminiAnalysis(resumeText, preferredCareer) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const prompt = `You are an ATS resume reviewer for CareerAI. Analyze the following resume text and return ONLY valid JSON with this exact shape:
{
  "summary": string,
  "atsScore": number,
  "strengths": string[],
  "improvements": string[],
  "missingKeywords": string[],
  "extractedSkills": string[],
  "recommendedRoles": string[],
  "projectSuggestions": string[],
  "courseSuggestions": string[],
  "keywordOptimizationTips": string[]
}

Target career: ${preferredCareer || 'Not specified'}

Resume text:
${resumeText.slice(0, 18000)}`;

  const response = await fetch(
    `${geminiConfig.endpoint}/${geminiConfig.model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json',
        },
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Gemini request failed with status ${response.status}`);
  }

  const data = await response.json();
  const text =
    data?.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('\n') || '';
  return parseJsonFromText(text);
}

async function callOpenAIAnalysis(resumeText, preferredCareer) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const prompt = `Return only JSON. Analyze this resume for ATS quality and target role alignment. Target career: ${preferredCareer || 'Not specified'}. Resume text: ${resumeText.slice(0, 18000)}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'Return only valid JSON with keys: summary, atsScore, strengths, improvements, missingKeywords, extractedSkills, recommendedRoles, projectSuggestions, courseSuggestions, keywordOptimizationTips.',
        },
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI request failed with status ${response.status}`);
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content || '';
  return parseJsonFromText(text);
}

export async function analyzeResume({ resumeText = '', preferredCareer = '' }) {
  const fallback = buildFallbackAnalysis(resumeText, preferredCareer);

  if (!resumeText.trim()) {
    return normalizeAnalysis(
      {
        ...fallback,
        summary:
          'The uploaded PDF was stored successfully, but only limited text could be extracted. Use a text-based PDF for stronger AI analysis.',
      },
      fallback,
    );
  }

  const provider = (process.env.AI_PROVIDER || 'gemini').toLowerCase();

  try {
    const rawAnalysis =
      provider === 'openai'
        ? await callOpenAIAnalysis(resumeText, preferredCareer)
        : await callGeminiAnalysis(resumeText, preferredCareer);

    if (!rawAnalysis) {
      return fallback;
    }

    return normalizeAnalysis(rawAnalysis, fallback);
  } catch (error) {
    console.error('AI analysis fallback triggered:', error.message);
    return fallback;
  }
}
