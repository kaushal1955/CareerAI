import { buildCareerRecommendations, findCareerPathByName } from './careerRecommendationService.js';

const GENERIC_QUESTIONS = {
  hr: [
    {
      question: 'Tell me about yourself and why you are interested in this role.',
      expectedPoints: ['background', 'career goal', 'role alignment'],
      category: 'Introduction',
      difficulty: 'easy',
    },
    {
      question: 'Why do you want to join our company?',
      expectedPoints: ['company research', 'role fit', 'learning motivation'],
      category: 'Motivation',
      difficulty: 'easy',
    },
    {
      question: 'What are your strengths and one area you are still improving?',
      expectedPoints: ['self awareness', 'relevant strength', 'growth mindset'],
      category: 'Self-awareness',
      difficulty: 'easy',
    },
    {
      question: 'Describe a challenge you faced while learning or building a project.',
      expectedPoints: ['context', 'action', 'result'],
      category: 'Problem solving',
      difficulty: 'medium',
    },
    {
      question: 'How do you handle deadlines and competing priorities?',
      expectedPoints: ['planning', 'communication', 'execution'],
      category: 'Work habits',
      difficulty: 'medium',
    },
    {
      question: 'Where do you see yourself in the next two to three years?',
      expectedPoints: ['realistic goal', 'learning path', 'growth'],
      category: 'Career vision',
      difficulty: 'easy',
    },
  ],
  behavioral: [
    {
      question: 'Tell me about a time you worked in a team to solve a difficult problem.',
      expectedPoints: ['situation', 'task', 'action', 'result'],
      category: 'Teamwork',
      difficulty: 'medium',
    },
    {
      question: 'Describe a time you received critical feedback. What did you do next?',
      expectedPoints: ['listening', 'improvement', 'reflection'],
      category: 'Feedback',
      difficulty: 'medium',
    },
    {
      question: 'Tell me about a time you had to learn something quickly.',
      expectedPoints: ['initiative', 'learning method', 'outcome'],
      category: 'Adaptability',
      difficulty: 'medium',
    },
    {
      question: 'Share an example of a mistake you made in a project and how you corrected it.',
      expectedPoints: ['ownership', 'fix', 'lesson'],
      category: 'Ownership',
      difficulty: 'medium',
    },
    {
      question: 'Describe a situation where you had to communicate a technical idea to a non-technical person.',
      expectedPoints: ['clarity', 'simplicity', 'impact'],
      category: 'Communication',
      difficulty: 'medium',
    },
    {
      question: 'Tell me about a time you stayed motivated during a long learning journey.',
      expectedPoints: ['discipline', 'goal', 'consistency'],
      category: 'Motivation',
      difficulty: 'easy',
    },
  ],
};

function chooseTargetCareer(profile = {}, latestRecommendation = null) {
  const preferred = latestRecommendation?.topCareerPath || profile?.preferredCareer || '';
  const found = findCareerPathByName(preferred);
  if (found) return found;

  const ranked = buildCareerRecommendations({ profile, resume: null });
  return findCareerPathByName(ranked[0]?.careerPath || '') || null;
}

function buildTechnicalQuestions(path) {
  const skills = path?.requiredSkills || [];
  return skills.slice(0, 6).map((skill, index) => ({
    question:
      index % 2 === 0
        ? `Explain ${skill} and describe how you would apply it in a real ${path.careerPath} project.`
        : `What are common mistakes beginners make with ${skill}, and how would you avoid them?`,
    expectedPoints: [skill, 'real project usage', 'tradeoffs'],
    category: skill,
    difficulty: index < 2 ? 'easy' : index < 4 ? 'medium' : 'hard',
  }));
}

function buildCodingQuestions(path) {
  const skills = path?.requiredSkills || [];
  const focusSkills = skills.slice(0, 4);

  return focusSkills.map((skill, index) => ({
    question:
      index % 2 === 0
        ? `Design a small coding solution or feature that demonstrates ${skill} in the context of a ${path.careerPath} application.`
        : `Walk through your approach to debugging, testing, and improving a task built with ${skill}.`,
    expectedPoints: [skill, 'approach', 'edge cases', 'testing'],
    category: skill,
    difficulty: index < 2 ? 'medium' : 'hard',
  }));
}

export function generateInterviewSession({ profile = {}, latestRecommendation = null, interviewType = 'technical' }) {
  const targetPath = chooseTargetCareer(profile, latestRecommendation);

  if (!targetPath) {
    return null;
  }

  const normalizedType = ['hr', 'technical', 'behavioral', 'coding'].includes(interviewType)
    ? interviewType
    : 'technical';

  let questions = [];
  if (normalizedType === 'technical') {
    questions = buildTechnicalQuestions(targetPath);
  } else if (normalizedType === 'coding') {
    questions = buildCodingQuestions(targetPath);
  } else {
    questions = GENERIC_QUESTIONS[normalizedType];
  }

  return {
    targetCareer: targetPath.careerPath,
    interviewType: normalizedType,
    questions,
  };
}

export function evaluateInterviewAnswers({ interview, answers = [] }) {
  const normalizedAnswers = Array.isArray(answers) ? answers : [];

  const perQuestionFeedback = interview.questions.map((questionItem, index) => {
    const submitted = normalizedAnswers.find((item) => Number(item.questionIndex) === index);
    const answer = String(submitted?.answer || '').trim();
    const lowerAnswer = answer.toLowerCase();
    const matchedKeywords = (questionItem.expectedPoints || []).filter((point) =>
      lowerAnswer.includes(String(point).toLowerCase()),
    );

    const keywordScore = questionItem.expectedPoints?.length
      ? (matchedKeywords.length / questionItem.expectedPoints.length) * 55
      : 30;
    const lengthScore = Math.min(25, Math.floor(answer.length / 12));
    const structureScore = answer ? 15 : 0;
    const rawScore = Math.round(keywordScore + lengthScore + structureScore);
    const score = Math.max(15, Math.min(95, answer ? rawScore : 0));

    let feedback = 'Add more structure and examples in your answer.';
    if (!answer) {
      feedback = 'No answer was provided. Try answering this question in 4–6 clear lines.';
    } else if (score >= 75) {
      feedback = 'Strong answer. You covered relevant points and showed useful clarity.';
    } else if (score >= 55) {
      feedback = 'Good start. Improve with stronger examples, outcomes, and technical detail.';
    }

    return {
      questionIndex: index,
      score,
      feedback,
    };
  });

  const validScores = perQuestionFeedback.map((item) => item.score);
  const performanceScore = validScores.length
    ? Math.round(validScores.reduce((total, value) => total + value, 0) / validScores.length)
    : 0;

  const strengths = [];
  const weakAreas = [];

  perQuestionFeedback.forEach((item, index) => {
    const category = interview.questions[index]?.category || `Question ${index + 1}`;
    if (item.score >= 75) {
      strengths.push(`Strong response quality in ${category}`);
    }
    if (item.score < 55) {
      weakAreas.push(category);
    }
  });

  const improvementSuggestions = [
    'Use structured answers with clear examples and outcomes.',
    'Relate answers to your projects, learning journey, or internships.',
    'Practice speaking out loud to improve confidence and flow.',
  ];

  if (interview.interviewType === 'technical' || interview.interviewType === 'coding') {
    improvementSuggestions.unshift('Explain your technical decisions, tradeoffs, and debugging process clearly.');
  }

  const feedbackSummary =
    performanceScore >= 75
      ? 'You are interview-ready for practice rounds. Keep refining examples and confidence.'
      : performanceScore >= 55
        ? 'You have a solid base, but need better structure, specificity, and clearer examples.'
        : 'Focus on fundamentals, concise communication, and repeated practice before real interviews.';

  return {
    answers: normalizedAnswers,
    performanceScore,
    feedbackSummary,
    strengths,
    weakAreas,
    improvementSuggestions,
    perQuestionFeedback,
    status: 'completed',
  };
}
