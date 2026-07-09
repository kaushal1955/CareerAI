import { buildSkillGapReport } from './skillGapService.js';

function chunkItems(items = [], size = 2) {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

export function buildLearningRoadmap({ profile = {}, resume = null, latestRecommendation = null, latestSkillGap = null }) {
  const skillGap = latestSkillGap || buildSkillGapReport({ profile, resume, latestRecommendation });

  if (!skillGap) {
    return null;
  }

  const priorityChunks = chunkItems(skillGap.priorities, 2);
  const foundationTopics = priorityChunks[0]?.map((item) => item.skill) || ['Role fundamentals'];
  const buildTopics = priorityChunks[1]?.map((item) => item.skill) || skillGap.missingSkills.slice(2, 4);
  const advancedTopics = priorityChunks[2]?.map((item) => item.skill) || skillGap.missingSkills.slice(4);

  const stages = [
    {
      title: 'Stage 1: Foundations',
      weekRange: 'Weeks 1-2',
      goal: `Build the baseline concepts required for ${skillGap.targetCareer}.`,
      topics: foundationTopics.length ? foundationTopics : skillGap.existingSkills.slice(0, 2),
      courses: skillGap.recommendedCourses.slice(0, 1),
      practiceItems: [
        'Create concise notes after each study session',
        'Solve 3-5 practice tasks for every topic',
        'Revise vocabulary and core concepts weekly',
      ],
      miniProjects: ['Topic-wise mini exercises and demos'],
      milestone: `Understand the basics of ${foundationTopics.join(', ') || skillGap.targetCareer}.`,
    },
    {
      title: 'Stage 2: Core Skill Build',
      weekRange: 'Weeks 3-5',
      goal: 'Develop the most important missing skills through guided practice.',
      topics: buildTopics.length ? buildTopics : skillGap.missingSkills.slice(0, 2),
      courses: skillGap.recommendedCourses.slice(1, 3),
      practiceItems: [
        'Implement small assignments for each missing skill',
        'Track errors and document fixes in a learning journal',
        'Practice explaining each concept in simple language',
      ],
      miniProjects: skillGap.suggestedProjects.slice(0, 2),
      milestone: 'Complete 2 portfolio-ready exercises and gain hands-on comfort.',
    },
    {
      title: 'Stage 3: Portfolio and Applied Work',
      weekRange: 'Weeks 6-8',
      goal: 'Turn your learning into visible proof through strong projects.',
      topics: advancedTopics.length ? advancedTopics : skillGap.existingSkills.slice(0, 3),
      courses: skillGap.recommendedCourses.slice(0, 2),
      practiceItems: [
        'Publish code with README documentation',
        'Write project outcome bullets for resume usage',
        'Collect screenshots, demos, and deployment links',
      ],
      miniProjects: skillGap.suggestedProjects.slice(0, 3),
      milestone: 'Finish at least one major showcase project and one smaller supporting project.',
    },
    {
      title: 'Stage 4: Interview and Job Readiness',
      weekRange: 'Weeks 9-10',
      goal: 'Prepare for interviews, resume refinement, and consistent applications.',
      topics: ['Mock interviews', 'Resume tailoring', 'Job description analysis', 'Project storytelling'],
      courses: ['Interview preparation and communication practice'],
      practiceItems: [
        'Practice answering common HR and technical questions',
        'Tailor resume keywords to target roles',
        'Apply weekly and track outcomes',
      ],
      miniProjects: ['Presentation deck or portfolio case-study for your strongest project'],
      milestone: 'Be ready to apply confidently with a stronger profile and project portfolio.',
    },
  ];

  return {
    targetCareer: skillGap.targetCareer,
    summary: `This roadmap is designed to close the main skill gaps for ${skillGap.targetCareer} and help you move from learning to interviews.`,
    estimatedDuration: skillGap.estimatedLearningDuration || '8 to 10 weeks',
    stages,
  };
}
