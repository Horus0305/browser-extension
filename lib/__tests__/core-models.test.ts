/**
 * Tests for core data models and utilities
 */

import {
  extractDomain,
  shouldTrackUrl,
  isValidDomain,
  normalizeDomain,
} from '../domain-utils';

import {
  formatTime,
  formatHoursMinutes,
  calculatePercentage,
  getCurrentDateString,
  isSameDay,
} from '../time-utils';

import {
  validateWebsiteUsage,
  validateUserSettings,
  sanitizeDomain,
  sanitizeTime,
  createDefaultUserSettings,
  createDefaultUsageData,
} from '../validation';

// Domain utilities tests
describe('Domain Utilities', () => {
  test('extractDomain should extract domain correctly', () => {
    expect(extractDomain('https://www.youtube.com/watch?v=123')).toBe('youtube.com');
    expect(extractDomain('http://facebook.com/page')).toBe('facebook.com');
    expect(extractDomain('https://subdomain.example.com')).toBe('subdomain.example.com');
    expect(extractDomain('invalid-url')).toBe('invalid-url');
  });

  test('shouldTrackUrl should filter URLs correctly', () => {
    expect(shouldTrackUrl('https://youtube.com', [])).toBe(true);
    expect(shouldTrackUrl('chrome://settings', [])).toBe(false);
    expect(shouldTrackUrl('https://youtube.com', ['youtube.com'])).toBe(false);
    expect(shouldTrackUrl('https://www.youtube.com', ['youtube.com'])).toBe(false);
  });

  test('isValidDomain should validate domains', () => {
    expect(isValidDomain('youtube.com')).toBe(true);
    expect(isValidDomain('sub.example.com')).toBe(true);
    expect(isValidDomain('')).toBe(false);
    expect(isValidDomain('invalid..domain')).toBe(false);
  });

  test('normalizeDomain should normalize domains', () => {
    expect(normalizeDomain('m.facebook.com')).toBe('facebook.com');
    expect(normalizeDomain('mobile.twitter.com')).toBe('twitter.com');
    expect(normalizeDomain('www2.example.com')).toBe('example.com');
  });
});

// Time utilities tests
describe('Time Utilities', () => {
  test('formatTime should format time correctly', () => {
    expect(formatTime(1000)).toBe('1s');
    expect(formatTime(60000)).toBe('1m');
    expect(formatTime(3600000)).toBe('1h 0m');
    expect(formatTime(90000)).toBe('1m');
  });

  test('formatHoursMinutes should format time as hours and minutes', () => {
    expect(formatHoursMinutes(3600000)).toBe('1h');
    expect(formatHoursMinutes(5400000)).toBe('1h 30m');
    expect(formatHoursMinutes(1800000)).toBe('30m');
  });

  test('calculatePercentage should calculate percentages correctly', () => {
    expect(calculatePercentage(25, 100)).toBe(25);
    expect(calculatePercentage(33, 100)).toBe(33);
    expect(calculatePercentage(0, 100)).toBe(0);
    expect(calculatePercentage(50, 0)).toBe(0);
  });

  test('getCurrentDateString should return correct date format', () => {
    const date = new Date('2024-01-15T10:30:00Z');
    expect(getCurrentDateString(date)).toBe('2024-01-15');
  });

  test('isSameDay should compare dates correctly', () => {
    const date1 = new Date('2024-01-15T10:30:00Z');
    const date2 = new Date('2024-01-15T15:45:00Z');
    const date3 = new Date('2024-01-16T10:30:00Z');
    
    expect(isSameDay(date1, date2)).toBe(true);
    expect(isSameDay(date1, date3)).toBe(false);
  });
});

// Validation tests
describe('Validation Functions', () => {
  test('validateWebsiteUsage should validate website usage objects', () => {
    const validUsage = {
      domain: 'youtube.com',
      timeSpent: 3600000,
      lastVisited: new Date(),
      visitCount: 5,
    };
    
    const invalidUsage = {
      domain: '',
      timeSpent: -1000,
      lastVisited: 'invalid-date',
      visitCount: 'invalid',
    };
    
    expect(validateWebsiteUsage(validUsage)).toBe(true);
    expect(validateWebsiteUsage(invalidUsage)).toBe(false);
  });

  test('validateUserSettings should validate user settings', () => {
    const validSettings = createDefaultUserSettings();
    const invalidSettings = {
      isLoggedIn: 'not-boolean',
      trackingEnabled: true,
    };
    
    expect(validateUserSettings(validSettings)).toBe(true);
    expect(validateUserSettings(invalidSettings)).toBe(false);
  });

  test('sanitizeDomain should sanitize domains', () => {
    expect(sanitizeDomain('https://www.YouTube.COM/watch')).toBe('youtube.com');
    expect(sanitizeDomain('HTTP://Facebook.com/')).toBe('facebook.com');
    expect(sanitizeDomain('')).toBe(null);
    expect(sanitizeDomain('invalid..domain')).toBe(null);
  });

  test('sanitizeTime should sanitize time values', () => {
    expect(sanitizeTime(1500.7)).toBe(1500);
    expect(sanitizeTime('2000')).toBe(2000);
    expect(sanitizeTime(-500)).toBe(0);
    expect(sanitizeTime('invalid')).toBe(0);
  });

  test('createDefaultUserSettings should create valid default settings', () => {
    const settings = createDefaultUserSettings();
    expect(validateUserSettings(settings)).toBe(true);
    expect(settings.trackingEnabled).toBe(true);
    expect(settings.isLoggedIn).toBe(false);
  });

  test('createDefaultUsageData should create valid default data', () => {
    const data = createDefaultUsageData();
    expect(data.totalTime).toBe(0);
    expect(Object.keys(data.websites)).toHaveLength(0);
    expect(Object.keys(data.dailyStats)).toHaveLength(0);
  });
});