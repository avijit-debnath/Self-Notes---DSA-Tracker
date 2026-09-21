import { Question, SolutionApproach } from '../types';

export function parseApproaches(question: Question): SolutionApproach[] {
  const rawCode = question.solutionCode || '';

  if (rawCode.trim().startsWith('[') && rawCode.trim().endsWith(']')) {
    try {
      const parsed = JSON.parse(rawCode);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].name) {
        return parsed;
      }
    } catch {
      // Not JSON, continue with legacy fallback
    }
  }

  // Fallback for single-code questions
  return [
    {
      id: 'app_1',
      name: 'Approach 1',
      code: rawCode,
      language: question.solutionLanguage || 'cpp',
      timeComplexity: question.timeComplexity || '',
      spaceComplexity: question.spaceComplexity || ''
    }
  ];
}

export function serializeApproaches(approaches: SolutionApproach[]): {
  solutionCode: string;
  solutionLanguage: string;
  timeComplexity: string;
  spaceComplexity: string;
} {
  if (approaches.length === 0) {
    return {
      solutionCode: '',
      solutionLanguage: 'cpp',
      timeComplexity: '',
      spaceComplexity: ''
    };
  }

  const primary = approaches[0];

  return {
    solutionCode: JSON.stringify(approaches),
    solutionLanguage: primary.language || 'cpp',
    timeComplexity: primary.timeComplexity || '',
    spaceComplexity: primary.spaceComplexity || ''
  };
}
