import type { CodeSnippet, Level, LevelProgress, Program } from './types';

const PROGRESS_KEY = 'coderobot_progress_v1';
const CUSTOM_LEVELS_KEY = 'coderobot_custom_levels_v1';
const SNIPPETS_KEY = 'coderobot_snippets_v1';

export interface ProgressData {
  [levelId: string]: LevelProgress;
}

export function loadProgress(): ProgressData {
  try {
    const data = localStorage.getItem(PROGRESS_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

export function saveProgress(progress: ProgressData): void {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch (e) {
    console.error('Failed to save progress:', e);
  }
}

export function updateLevelProgress(
  levelId: string,
  stars: number,
  steps: number
): ProgressData {
  const progress = loadProgress();
  const existing = progress[levelId];

  if (!existing || stars > existing.starsCollected || steps < existing.bestSteps) {
    progress[levelId] = {
      completed: true,
      starsCollected: Math.max(existing?.starsCollected || 0, stars),
      bestSteps: existing?.bestSteps ? Math.min(existing.bestSteps, steps) : steps,
    };
    saveProgress(progress);
  }

  return progress;
}

export function isLevelUnlocked(levelId: string, allLevels: Level[]): boolean {
  const progress = loadProgress();
  const index = allLevels.findIndex((l) => l.id === levelId);
  if (index <= 0) return true;

  const prevLevel = allLevels[index - 1];
  return progress[prevLevel.id]?.completed || false;
}

export function saveCustomLevel(level: Level): void {
  try {
    const custom = loadCustomLevels();
    const existingIndex = custom.findIndex((l) => l.id === level.id);
    if (existingIndex >= 0) {
      custom[existingIndex] = level;
    } else {
      custom.push(level);
    }
    localStorage.setItem(CUSTOM_LEVELS_KEY, JSON.stringify(custom));
  } catch (e) {
    console.error('Failed to save custom level:', e);
  }
}

export function loadCustomLevels(): Level[] {
  try {
    const data = localStorage.getItem(CUSTOM_LEVELS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function deleteCustomLevel(levelId: string): void {
  try {
    const custom = loadCustomLevels().filter((l) => l.id !== levelId);
    localStorage.setItem(CUSTOM_LEVELS_KEY, JSON.stringify(custom));
  } catch (e) {
    console.error('Failed to delete custom level:', e);
  }
}

export function exportLevelToJson(level: Level): string {
  return JSON.stringify(level, null, 2);
}

export function importLevelFromJson(json: string): Level | null {
  try {
    const data = JSON.parse(json);
    if (
      data.id &&
      data.name &&
      data.width &&
      data.height &&
      data.grid &&
      data.start &&
      data.goal
    ) {
      return data as Level;
    }
    return null;
  } catch {
    return null;
  }
}

export function downloadLevel(level: Level): void {
  const json = exportLevelToJson(level);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${level.name.replace(/\s+/g, '_')}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function shareLevel(level: Level): Promise<boolean> {
  const json = exportLevelToJson(level);
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(json);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export function loadCustomSnippets(): CodeSnippet[] {
  try {
    const data = localStorage.getItem(SNIPPETS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveCustomSnippets(snippets: CodeSnippet[]): void {
  try {
    localStorage.setItem(SNIPPETS_KEY, JSON.stringify(snippets));
  } catch (e) {
    console.error('Failed to save snippets:', e);
  }
}

export function saveSnippetToLibrary(
  name: string,
  description: string,
  program: Program,
  tags: string[] = []
): CodeSnippet {
  const snippet: CodeSnippet = {
    id: `snippet-${Date.now()}`,
    name,
    description,
    explanation: description,
    category: 'custom',
    difficulty: 0,
    program,
    tags,
    isBuiltin: false,
    createdAt: Date.now(),
  };
  const snippets = loadCustomSnippets();
  snippets.unshift(snippet);
  saveCustomSnippets(snippets);
  return snippet;
}

export function deleteSnippetFromLibrary(snippetId: string): void {
  try {
    const snippets = loadCustomSnippets().filter((s) => s.id !== snippetId);
    saveCustomSnippets(snippets);
  } catch (e) {
    console.error('Failed to delete snippet:', e);
  }
}

export function updateSnippetInLibrary(
  snippetId: string,
  updates: Partial<CodeSnippet>
): void {
  try {
    const snippets = loadCustomSnippets();
    const index = snippets.findIndex((s) => s.id === snippetId);
    if (index >= 0) {
      snippets[index] = { ...snippets[index], ...updates };
      saveCustomSnippets(snippets);
    }
  } catch (e) {
    console.error('Failed to update snippet:', e);
  }
}
