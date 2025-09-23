import { render, screen } from '@testing-library/react';
import Home from '../pages/index';
import { AuthProvider } from '../contexts/AuthContext';

jest.mock('next/router', () => require('next-router-mock'));

describe('Home Page', () => {
  it('renders the main heading', () => {
    render(
      <AuthProvider>
        <Home />
      </AuthProvider>
    );
    expect(screen.getByRole('heading')).toBeInTheDocument();
  });
});
