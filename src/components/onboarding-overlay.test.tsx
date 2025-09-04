/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import OnboardingOverlay from './onboarding-overlay';

describe('OnboardingOverlay', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it('shows overlay on first visit', () => {
    const { getByTestId } = render(<OnboardingOverlay />);
    expect(getByTestId('onboarding-overlay')).toBeTruthy();
  });

  it('hides overlay after dismissal and stores flag', () => {
    const { getByTestId, queryByTestId } = render(<OnboardingOverlay />);
    fireEvent.click(getByTestId('onboarding-overlay'));
    expect(window.localStorage.getItem('onboardingSeen')).toBe('true');
    expect(queryByTestId('onboarding-overlay')).toBeNull();
  });

  it('does not show overlay when already seen', () => {
    window.localStorage.setItem('onboardingSeen', 'true');
    const { queryByTestId } = render(<OnboardingOverlay />);
    expect(queryByTestId('onboarding-overlay')).toBeNull();
  });
});
