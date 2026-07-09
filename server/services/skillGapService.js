import {
  buildCareerRecommendations,
  extractCurrentSkills,
  findCareerPathByName,
  normalizeSkill,
} from './careerRecommendationService.js';

function chooseTargetPath(profile = {}, resume = null, latestRecommendation = null) {
  const explicit = latestRecommendation?.topCareerPath || profile?.preferredCareer || '';
  const matched = findCareerPathByName(explicit);
  if (matched) return matched;

  const ranked = buildCareerRecommendations({ profile, resume });
  return findCareerPathByName(ranked[0]?.careerPath || '') || null;
}

function createPriorityReason(skill, pathName, priority) {
  if (priority === 'high') {
    return `${skill} is a core requirement for entering ${pathName} roles and should be learned first.`;
  }
  if (priority === 'medium') {
    return `${skill} strengthens your profile and helps you compete for better ${pathName} opportunities.`;
  }
  return `${skill} is useful for deeper confidence and long-term growth in ${pathName}.`;
}

export function buildSkillGapReport({ profile = {}, resume = null, latestRecommendation = null }) {
  const targetPath = chooseTargetPath(profile, resume, latestRecommendation);

  if (!targetPath) {
    return null;
  }

  const currentSkills = extractCurrentSkills(profile, resume);
  const currentSkillSet = new Set(currentSkills.map(normalizeSkill));
  const existingSkills = targetPath.requiredSkills.filter((skill) => currentSkillSet.has(normalizeSkill(skill)));
  const missingSkills = targetPath.requiredSkills.filter((skill) => !currentSkillSet.has(normalizeSkill(skill)));
  const rankedRecommendations = buildCareerRecommendations({ profile, resume });
  const matchedRecommendation = rankedRecommendations.find(
    (item) => normalizeSkill(item.careerPath) === normalizeSkill(targetPath.careerPath),
  );
  const matchPercentage =
    matchedRecommendation?.matchPercentage ||
    Math.round((existingSkills.length / targetPath.requiredSkills.length) * 100);

  const priorities = missingSkills.map((skill, index) => {
    const priority = index < 2 ? 'high' : index < 4 ? 'medium' : 'low';
    return {
      skill,
      priority,
      reason: createPriorityReason(skill, targetPath.careerPath, priority),
      recommendedCourse:
        targetPath.recommendedCourses[index % targetPath.recommendedCourses.length] ||
        'Targeted self-paced learning track',
      practiceProject:
        targetPath.suggestedProjects[index % targetPath.suggestedProjects.length] ||
        'Portfolio-aligned practice project',
      estimatedWeeks: priority === 'high' ? '2-3 weeks' : priority === 'medium' ? '1-2 weeks' : '1 week',
    };
  });

  const summary = missingSkills.length
    ? `You already have ${existingSkills.length} of ${targetPath.requiredSkills.length} key skills for ${targetPath.careerPath}. Focus first on ${missingSkills.slice(0, 3).join(', ')} to improve your readiness quickly.`
    : `Your current skills already align strongly with ${targetPath.careerPath}. Focus on portfolio depth, interview practice, and job applications.`;

  return {
    targetCareer: targetPath.careerPath,
    basedOnRecommendation:
      latestRecommendation?.topCareerPath || profile?.preferredCareer || targetPath.careerPath,
    currentSkills,
    existingSkills,
    missingSkills,
    matchPercentage,
    recommendedCourses: targetPath.recommendedCourses,
    suggestedProjects: targetPath.suggestedProjects,
    estimatedLearningDuration: targetPath.estimatedLearningDuration,
    priorities,
    summary,
  };
}
