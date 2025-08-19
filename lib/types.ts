/**
 * Simplified data models for UI demonstration
 */

export interface WebsiteUsage {
  domain: string;
  timeSpent: number; // milliseconds
  lastVisited: Date;
  visitCount: number;
  favicon?: string;
}