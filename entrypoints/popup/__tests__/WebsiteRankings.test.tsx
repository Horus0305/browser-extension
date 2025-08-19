/**
 * Tests for the WebsiteRankings component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { WebsiteRankings } from '../components/WebsiteRankings';
import { WebsiteUsage } from '../../../lib/types';

describe('WebsiteRankings Component', () => {
  const mockWebsites: WebsiteUsage[] = [
    {
      domain: 'github.com',
      timeSpent: 7200000, // 2 hours
      visitCount: 5,
      lastVisited: new Date('2024-01-01T12:00:00Z')
    },
    {
      domain: 'stackoverflow.com',
      timeSpent: 3600000, // 1 hour
      visitCount: 3,
      lastVisited: new Date('2024-01-01T11:00:00Z')
    },
    {
      domain: 'youtube.com',
      timeSpent: 1800000, // 30 minutes
      visitCount: 2,
      lastVisited: new Date('2024-01-01T10:00:00Z')
    }
  ];

  const totalTime = 10800000; // 3 hours

  it('renders loading state correctly', () => {
    render(
      <WebsiteRankings 
        websites={[]} 
        totalTime={0} 
        isLoading={true} 
      />
    );

    expect(screen.getByText('Top Websites')).toBeInTheDocument();
    expect(screen.getByText('Today')).toBeInTheDocument();
    
    // Should show skeleton loaders (check for skeleton class)
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders empty state when no websites', () => {
    render(
      <WebsiteRankings 
        websites={[]} 
        totalTime={0} 
        isLoading={false} 
      />
    );

    expect(screen.getByText('No browsing data for today')).toBeInTheDocument();
    expect(screen.getByText('Start browsing to see your usage statistics')).toBeInTheDocument();
  });

  it('renders website rankings correctly', () => {
    render(
      <WebsiteRankings 
        websites={mockWebsites} 
        totalTime={totalTime} 
        isLoading={false} 
      />
    );

    // Check if all websites are displayed
    expect(screen.getByText('github.com')).toBeInTheDocument();
    expect(screen.getByText('stackoverflow.com')).toBeInTheDocument();
    expect(screen.getByText('youtube.com')).toBeInTheDocument();

    // Check time formatting
    expect(screen.getByText('2h')).toBeInTheDocument(); // github.com
    expect(screen.getByText('1h')).toBeInTheDocument(); // stackoverflow.com
    expect(screen.getByText('30m')).toBeInTheDocument(); // youtube.com

    // Check visit counts
    expect(screen.getByText('5 visits')).toBeInTheDocument();
    expect(screen.getByText('3 visits')).toBeInTheDocument();
    expect(screen.getByText('2 visits')).toBeInTheDocument();

    // Check percentages (github: 2h/3h = 66.7%, stackoverflow: 1h/3h = 33.3%, youtube: 0.5h/3h = 16.7%)
    expect(screen.getByText('66.7%')).toBeInTheDocument();
    expect(screen.getByText('33.3%')).toBeInTheDocument();
    expect(screen.getByText('16.7%')).toBeInTheDocument();
  });

  it('shows ranking numbers correctly', () => {
    render(
      <WebsiteRankings 
        websites={mockWebsites} 
        totalTime={totalTime} 
        isLoading={false} 
      />
    );

    expect(screen.getByText('1')).toBeInTheDocument(); // github.com rank
    expect(screen.getByText('2')).toBeInTheDocument(); // stackoverflow.com rank
    expect(screen.getByText('3')).toBeInTheDocument(); // youtube.com rank
  });

  it('limits display to top 5 websites', () => {
    const manyWebsites: WebsiteUsage[] = Array.from({ length: 10 }, (_, i) => ({
      domain: `site${i + 1}.com`,
      timeSpent: (10 - i) * 600000, // Decreasing time
      visitCount: 10 - i,
      lastVisited: new Date()
    }));

    render(
      <WebsiteRankings 
        websites={manyWebsites} 
        totalTime={totalTime} 
        isLoading={false} 
      />
    );

    // Should show first 5 websites
    expect(screen.getByText('site1.com')).toBeInTheDocument();
    expect(screen.getByText('site2.com')).toBeInTheDocument();
    expect(screen.getByText('site3.com')).toBeInTheDocument();
    expect(screen.getByText('site4.com')).toBeInTheDocument();
    expect(screen.getByText('site5.com')).toBeInTheDocument();

    // Should not show 6th website
    expect(screen.queryByText('site6.com')).not.toBeInTheDocument();

    // Should show "more websites" message
    expect(screen.getByText('+5 more websites in detailed report')).toBeInTheDocument();
  });

  it('handles singular visit count correctly', () => {
    const singleVisitWebsite: WebsiteUsage[] = [{
      domain: 'example.com',
      timeSpent: 1800000,
      visitCount: 1,
      lastVisited: new Date()
    }];

    render(
      <WebsiteRankings 
        websites={singleVisitWebsite} 
        totalTime={1800000} 
        isLoading={false} 
      />
    );

    expect(screen.getByText('1 visit')).toBeInTheDocument();
  });
});