export const ROLES = {
  STUDENT: 'STUDENT',
  INSTRUCTOR: 'INSTRUCTOR',
  ADMIN: 'ADMIN',
};

export const DIFFICULTY_LEVELS = {
  BEGINNER: 'BEGINNER',
  INTERMEDIATE: 'INTERMEDIATE',
  ADVANCED: 'ADVANCED',
};

export const getRoleDisplayName = (role) => {
  const roleNames = {
    [ROLES.STUDENT]: 'Student',
    [ROLES.INSTRUCTOR]: 'Instructor',
    [ROLES.ADMIN]: 'Administrator',
  };
  return roleNames[role] || role;
};

export const getDifficultyDisplayName = (difficulty) => {
  const difficultyNames = {
    [DIFFICULTY_LEVELS.BEGINNER]: 'Beginner',
    [DIFFICULTY_LEVELS.INTERMEDIATE]: 'Intermediate',
    [DIFFICULTY_LEVELS.ADVANCED]: 'Advanced',
  };
  return difficultyNames[difficulty] || difficulty;
};

export const getDifficultyColor = (difficulty) => {
  const colors = {
    [DIFFICULTY_LEVELS.BEGINNER]: 'bg-green-100 text-green-800',
    [DIFFICULTY_LEVELS.INTERMEDIATE]: 'bg-yellow-100 text-yellow-800',
    [DIFFICULTY_LEVELS.ADVANCED]: 'bg-red-100 text-red-800',
  };
  return colors[difficulty] || 'bg-gray-100 text-gray-800';
};
