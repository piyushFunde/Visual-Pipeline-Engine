import '@testing-library/jest-dom/extend-expect';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import AuthPage from './AuthPage';
import * as authApi from '../services/authApi';

jest.mock('react-router-dom', () => ({
  useLocation: () => ({ pathname: '/signup' }),
  useNavigate: () => jest.fn(),
  Link: 'a',
}));

jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({ login: jest.fn() }),
}));

jest.mock('../services/authApi', () => ({
  register: jest.fn(),
  login: jest.fn(),
}));

describe('AuthPage signup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('shows an enabled password field and registers the supplied name', async () => {
    authApi.register.mockResolvedValue({ id: 1, name: 'Taylor User', email: 'taylor@example.com' });
    render(<AuthPage />);

    const nameInput = screen.getByLabelText(/full name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText('Password', { exact: true });

    expect(passwordInput).toBeVisible();
    expect(passwordInput).toBeEnabled();

    fireEvent.change(nameInput, { target: { value: 'Taylor User' } });
    fireEvent.change(emailInput, { target: { value: 'taylor@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'secure-password' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /sign up/i }));
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(authApi.register).toHaveBeenCalledWith({
        name: 'Taylor User',
        email: 'taylor@example.com',
        password: 'secure-password',
        marketingOptIn: true,
      });
    });
  });
});
