import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import Login from './Login';
import { ThemeProvider } from '../contexts/ThemeContext';

jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    login: jest.fn(),
    user: null,
    loading: false
  })
}));

const renderLoginStatic = () => {
  return ReactDOMServer.renderToStaticMarkup(
    <MemoryRouter>
      <ThemeProvider>
        <Login />
      </ThemeProvider>
    </MemoryRouter>
  );
};

describe('Login Page Professional Redesign', () => {
  test('renders authentic Aleen Clothing branding without AI slop elements', () => {
    const html = renderLoginStatic();

    // Verify brand name is present
    expect(html).toContain('Aleen Clothing');

    // Verify tagline
    expect(html).toContain('CONSCIOUSLY CURATED');

    // Verify email and password fields exist
    expect(html).toContain('Email Address');
    expect(html).toContain('Password');
    expect(html).toContain('name@aleen.com');

    // Verify AI slop elements are removed
    expect(html).not.toContain('Couture Atelier POS &amp; CRM');
    expect(html).not.toContain('Couture Atelier POS & CRM');
  });

  test('contains demo credentials fill option and terminal security indicators', () => {
    const html = renderLoginStatic();

    // Verify demo credentials quick fill option is present
    expect(html).toContain('admin@aleen.com');

    // Verify enterprise security indicators
    expect(html).toContain('Sign In to Atelier');
  });
});
