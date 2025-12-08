import { Star, Group, AsteroidBelt, ProtoplanetaryDisk } from '../types';

const STORAGE_KEY = 'nested-solar-system';

export interface SystemData {
  stars: Record<string, Star>;
  rootIds: string[];
  groups?: Record<string, Group>;
  rootGroupIds?: string[];
  belts?: Record<string, AsteroidBelt>;
  protoplanetaryDisks?: Record<string, ProtoplanetaryDisk>;
}

export function saveSystem(data: SystemData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save system:', error);
  }
}

export function loadSystem(): SystemData | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error('Failed to load system:', error);
  }
  return null;
}

export function clearSystem(): void {
  localStorage.removeItem(STORAGE_KEY);
}

