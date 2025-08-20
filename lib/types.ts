/**
 * Simplified data models for UI demonstration
 */
import type { Category } from './categories';

export interface WebsiteUsage {
  domain: string;
  timeSpent: number; // milliseconds
  lastVisited: Date;
  visitCount: number;
  category?: Category;
  favicon?: string;
}