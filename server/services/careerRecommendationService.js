export const CAREER_PATHS = [
  {
    careerPath: 'Frontend Developer',
    summary:
      'Focuses on building responsive user interfaces, modern web experiences, and accessible product flows.',
    salaryRangeIndia: '₹4 LPA – ₹14 LPA',
    growthOutlook: 'High',
    futureDemand: 'High',
    requiredSkills: ['HTML', 'CSS', 'JavaScript', 'React', 'TypeScript', 'Responsive Design'],
    interestKeywords: ['frontend', 'web', 'ui', 'ux', 'design', 'interface'],
    recommendedCourses: [
      'Modern JavaScript and ES6+',
      'React and TypeScript fundamentals',
      'Accessible UI design systems',
    ],
    suggestedProjects: [
      'Responsive e-commerce storefront',
      'Analytics dashboard with charts and filters',
      'Portfolio site with dark/light themes',
    ],
    estimatedLearningDuration: '4 to 6 months',
  },
  {
    careerPath: 'Backend Developer',
    summary:
      'Ideal for learners who enjoy APIs, databases, authentication, server logic, and scalable system design.',
    salaryRangeIndia: '₹5 LPA – ₹16 LPA',
    growthOutlook: 'High',
    futureDemand: 'High',
    requiredSkills: ['Node.js', 'Express.js', 'MongoDB', 'SQL', 'REST API', 'Authentication'],
    interestKeywords: ['backend', 'api', 'server', 'database', 'system'],
    recommendedCourses: [
      'Node.js and Express backend engineering',
      'Database design with MongoDB and SQL',
      'Authentication and API security',
    ],
    suggestedProjects: [
      'REST API with JWT auth and role-based access',
      'Booking system with database relationships',
      'Realtime chat backend with sockets',
    ],
    estimatedLearningDuration: '4 to 7 months',
  },
  {
    careerPath: 'Full Stack Developer',
    summary:
      'A strong choice if you want to build complete products across frontend, backend, deployment, and integration.',
    salaryRangeIndia: '₹5 LPA – ₹18 LPA',
    growthOutlook: 'Very High',
    futureDemand: 'Very High',
    requiredSkills: ['React', 'Node.js', 'MongoDB', 'REST API', 'Git', 'Deployment'],
    interestKeywords: ['full stack', 'product', 'web', 'startup', 'application'],
    recommendedCourses: [
      'Full stack MERN development',
      'System design for web apps',
      'Deployment with Vercel, Render, and CI/CD',
    ],
    suggestedProjects: [
      'Job portal with auth and dashboards',
      'Learning management platform',
      'Realtime collaboration app',
    ],
    estimatedLearningDuration: '5 to 8 months',
  },
  {
    careerPath: 'Data Analyst',
    summary:
      'Well-suited to profiles that enjoy data cleaning, dashboards, reporting, and turning numbers into decisions.',
    salaryRangeIndia: '₹4 LPA – ₹12 LPA',
    growthOutlook: 'High',
    futureDemand: 'High',
    requiredSkills: ['SQL', 'Excel', 'Python', 'Pandas', 'Power BI', 'Data Visualization'],
    interestKeywords: ['data', 'analysis', 'dashboard', 'analytics', 'business'],
    recommendedCourses: [
      'SQL for analytics',
      'Python with Pandas for data analysis',
      'Power BI dashboard design',
    ],
    suggestedProjects: [
      'Sales dashboard with business KPIs',
      'Data cleaning and EDA notebook',
      'Customer churn analysis report',
    ],
    estimatedLearningDuration: '3 to 5 months',
  },
  {
    careerPath: 'Data Scientist',
    summary:
      'A strong path for those who enjoy statistics, machine learning experiments, and model-driven problem solving.',
    salaryRangeIndia: '₹6 LPA – ₹20 LPA',
    growthOutlook: 'Very High',
    futureDemand: 'Very High',
    requiredSkills: ['Python', 'Pandas', 'NumPy', 'Machine Learning', 'Statistics', 'Model Evaluation'],
    interestKeywords: ['machine learning', 'data science', 'model', 'prediction', 'ai'],
    recommendedCourses: [
      'Statistics for machine learning',
      'Supervised and unsupervised ML',
      'Model evaluation and experimentation',
    ],
    suggestedProjects: [
      'Recommendation engine prototype',
      'House price prediction system',
      'NLP classification project',
    ],
    estimatedLearningDuration: '6 to 9 months',
  },
  {
    careerPath: 'AI Engineer',
    summary:
      'Best for learners targeting applied AI, LLM products, deep learning systems, and intelligent automation.',
    salaryRangeIndia: '₹8 LPA – ₹24 LPA',
    growthOutlook: 'Exceptional',
    futureDemand: 'Exceptional',
    requiredSkills: ['Python', 'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'APIs'],
    interestKeywords: ['ai', 'llm', 'deep learning', 'automation', 'intelligence'],
    recommendedCourses: [
      'Deep learning foundations',
      'LLM application engineering',
      'Model deployment and evaluation',
    ],
    suggestedProjects: [
      'AI chatbot with memory and tools',
      'Resume analyzer using embeddings',
      'Document Q&A system',
    ],
    estimatedLearningDuration: '7 to 10 months',
  },
  {
    careerPath: 'Cybersecurity Analyst',
    summary:
      'Good for profiles interested in system safety, vulnerability analysis, secure operations, and threat detection.',
    salaryRangeIndia: '₹5 LPA – ₹15 LPA',
    growthOutlook: 'High',
    futureDemand: 'High',
    requiredSkills: ['Linux', 'Networking', 'Cybersecurity', 'Python', 'Security Tools', 'Incident Response'],
    interestKeywords: ['security', 'cybersecurity', 'network', 'threat', 'ethical hacking'],
    recommendedCourses: [
      'Network security fundamentals',
      'Linux and security operations',
      'Python for security automation',
    ],
    suggestedProjects: [
      'Security log analysis dashboard',
      'Port scanner and alerting utility',
      'Basic SIEM-style monitoring prototype',
    ],
    estimatedLearningDuration: '5 to 8 months',
  },
];

export function unique(values = []) {
  return [...new Set(values.map((item) => String(item || '').trim()).filter(Boolean))];
}

export function normalizeSkill(value = '') {
  return String(value).trim().toLowerCase();
}

export function extractCurrentSkills(profile = {}, resume = null) {
  return unique([
    ...(profile.skills || []),
    ...(resume?.analysis?.extractedSkills || []),
  ]);
}

export function getInterestsText(profile = {}) {
  return [
    profile.preferredCareer || '',
    profile.headline || '',
    profile.bio || '',
    ...(profile.interests || []),
  ]
    .join(' ')
    .toLowerCase();
}

export function getEducationText(profile = {}) {
  return (profile.education || [])
    .map((item) => `${item.degree || ''} ${item.fieldOfStudy || ''} ${item.institution || ''}`)
    .join(' ')
    .toLowerCase();
}

export function findCareerPathByName(value = '') {
  const normalized = normalizeSkill(value);

  return (
    CAREER_PATHS.find((item) => normalizeSkill(item.careerPath) === normalized) ||
    CAREER_PATHS.find(
      (item) =>
        normalizeSkill(item.careerPath).includes(normalized) || normalized.includes(normalizeSkill(item.careerPath)),
    ) ||
    null
  );
}

function scoreCareer(path, profile, resume) {
  const currentSkills = extractCurrentSkills(profile, resume);
  const currentSkillSet = new Set(currentSkills.map(normalizeSkill));
  const interestsText = getInterestsText(profile);
  const educationText = getEducationText(profile);

  const existingSkills = path.requiredSkills.filter((skill) => currentSkillSet.has(normalizeSkill(skill)));
  const missingSkills = path.requiredSkills.filter((skill) => !currentSkillSet.has(normalizeSkill(skill)));

  const skillScore = path.requiredSkills.length
    ? (existingSkills.length / path.requiredSkills.length) * 70
    : 0;

  const interestMatches = path.interestKeywords.filter((keyword) => interestsText.includes(keyword));
  const interestScore = Math.min(18, interestMatches.length * 4.5);

  const preferredCareerBonus = profile.preferredCareer
    ? normalizeSkill(profile.preferredCareer).includes(normalizeSkill(path.careerPath)) ||
      normalizeSkill(path.careerPath).includes(normalizeSkill(profile.preferredCareer))
      ? 12
      : 0
    : 0;

  const educationBonus = /(computer|information|software|it|data|technology|engineering|bca|mca|b\.tech)/.test(
    educationText,
  )
    ? 8
    : 0;

  const projectBonus = resume?.analysis?.projectSuggestions?.length ? 4 : 0;
  const rawScore = Math.round(28 + skillScore + interestScore + preferredCareerBonus + educationBonus + projectBonus);
  const matchPercentage = Math.max(35, Math.min(96, rawScore));

  const topStrengths = existingSkills.slice(0, 4);
  const whyItFits = topStrengths.length
    ? `Your current profile already overlaps with ${path.careerPath} through ${topStrengths.join(', ')}.`
    : `This path aligns with your profile goals, but you should first build core skills in ${missingSkills.slice(0, 3).join(', ')}.`;

  return {
    careerPath: path.careerPath,
    matchPercentage,
    summary: path.summary,
    salaryRangeIndia: path.salaryRangeIndia,
    growthOutlook: path.growthOutlook,
    futureDemand: path.futureDemand,
    requiredSkills: path.requiredSkills,
    existingSkills,
    missingSkills,
    recommendedCourses: path.recommendedCourses,
    suggestedProjects: path.suggestedProjects,
    estimatedLearningDuration: path.estimatedLearningDuration,
    whyItFits,
  };
}

export function buildCareerRecommendations({ profile = {}, resume = null }) {
  const ranked = CAREER_PATHS.map((path) => scoreCareer(path, profile, resume)).sort(
    (a, b) => b.matchPercentage - a.matchPercentage,
  );

  return ranked.slice(0, 3);
}
