import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from './App';
import React from 'react';

// Mock Modules
vi.mock('./lib/AuthContext', () => ({
    useAuth: () => ({
        user: null,
        loading: false,
        signOut: vi.fn()
    }),
    AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

vi.mock('./lib/LanguageContext', () => ({
    useLanguage: () => ({
        language: 'English',
        setLanguage: vi.fn()
    }),
    LanguageProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

vi.mock('./components/ui/BackgroundEffects', () => ({
    default: () => <div data-testid="bg-effects" />
}));

vi.mock('./components/VoiceAssistant', () => ({
    default: () => <div data-testid="voice-assistant" />
}));

vi.mock('./lib/firebase', () => ({
    auth: {},
    db: {}
}));

describe('App Smoke Test', () => {
    it('renders without crashing', () => {
        render(<App />);
        // Use a more robust check for the brand name
        const brandElements = screen.getAllByText(/CE Power/i);
        expect(brandElements.length).toBeGreaterThan(0);
    });

    it('shows the main navigation', () => {
        render(<App />);
        expect(screen.getByRole('navigation')).toBeInTheDocument();
    });
});
