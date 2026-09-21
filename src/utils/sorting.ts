import { Question } from '../types';

export const DIFFICULTY_ORDER: Record<string, number> = {
  easy: 1,
  medium: 2,
  hard: 3
};

/**
 * Compares two questions by difficulty order: Easy -> Medium -> Hard.
 * Secondary sort is alphabetical by title.
 */
export function compareQuestionsByDifficulty(a: Question, b: Question): number {
  const wA = DIFFICULTY_ORDER[(a.difficulty || '').toLowerCase()] ?? 99;
  const wB = DIFFICULTY_ORDER[(b.difficulty || '').toLowerCase()] ?? 99;

  if (wA !== wB) {
    return wA - wB;
  }

  return (a.title || '').localeCompare(b.title || '', undefined, {
    sensitivity: 'base',
    numeric: true
  });
}

/**
 * Returns a new array of questions sorted in order: Easy -> Medium -> Hard.
 */
export function sortQuestionsByDifficulty(questions: Question[]): Question[] {
  return [...questions].sort(compareQuestionsByDifficulty);
}
