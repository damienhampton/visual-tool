import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../test/test-utils';
import userEvent from '@testing-library/user-event';
import { AuthModal } from '../AuthModal';
import { mockDiagramApi, mockAuthResponse } from '../../test/mocks/api';

vi.mock('../../lib/api', () => ({
  diagramApi: mockDiagramApi,
}));

describe('AuthModal', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Login Form', () => {
    it('should render login form by default', () => {
      render(<AuthModal isOpen={true} onClose={mockOnClose} />);

      expect(screen.getByText(/sign in/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });

    it('should validate email format', async () => {
      const user = userEvent.setup();
      render(<AuthModal isOpen={true} onClose={mockOnClose} />);

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'invalid-email');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/valid email/i)).toBeInTheDocument();
      });
    });

    it('should validate password is required', async () => {
      const user = userEvent.setup();
      render(<AuthModal isOpen={true} onClose={mockOnClose} />);

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/password.*required/i)).toBeInTheDocument();
      });
    });

    it('should call login API with correct credentials', async () => {
      const user = userEvent.setup();
      mockDiagramApi.login.mockResolvedValue(mockAuthResponse);

      render(<AuthModal isOpen={true} onClose={mockOnClose} />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'Password123!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockDiagramApi.login).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'Password123!',
        });
      });
    });

    it('should display error message on login failure', async () => {
      const user = userEvent.setup();
      mockDiagramApi.login.mockRejectedValue(new Error('Invalid credentials'));

      render(<AuthModal isOpen={true} onClose={mockOnClose} />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
      });
    });
  });

  describe('Register Form', () => {
    it('should switch to register form', async () => {
      const user = userEvent.setup();
      render(<AuthModal isOpen={true} onClose={mockOnClose} />);

      const registerLink = screen.getByText(/create account/i);
      await user.click(registerLink);

      expect(screen.getByText(/sign up/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    });

    it('should validate password strength on register', async () => {
      const user = userEvent.setup();
      render(<AuthModal isOpen={true} onClose={mockOnClose} />);

      const registerLink = screen.getByText(/create account/i);
      await user.click(registerLink);

      const passwordInput = screen.getByLabelText(/^password/i);
      const submitButton = screen.getByRole('button', { name: /sign up/i });

      await user.type(passwordInput, '123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/password.*8 characters/i)).toBeInTheDocument();
      });
    });

    it('should call register API with correct data', async () => {
      const user = userEvent.setup();
      mockDiagramApi.register.mockResolvedValue(mockAuthResponse);

      render(<AuthModal isOpen={true} onClose={mockOnClose} />);

      const registerLink = screen.getByText(/create account/i);
      await user.click(registerLink);

      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/^password/i);
      const submitButton = screen.getByRole('button', { name: /sign up/i });

      await user.type(nameInput, 'Test User');
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'Password123!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockDiagramApi.register).toHaveBeenCalledWith({
          name: 'Test User',
          email: 'test@example.com',
          password: 'Password123!',
        });
      });
    });
  });

  describe('Guest Access', () => {
    it('should allow guest login', async () => {
      const user = userEvent.setup();
      mockDiagramApi.createGuest.mockResolvedValue({
        ...mockAuthResponse,
        user: { ...mockAuthResponse.user, isGuest: true },
      });

      render(<AuthModal isOpen={true} onClose={mockOnClose} />);

      const guestButton = screen.getByText(/continue as guest/i);
      await user.click(guestButton);

      await waitFor(() => {
        expect(mockDiagramApi.createGuest).toHaveBeenCalled();
      });
    });
  });

  describe('Modal Behavior', () => {
    it('should not render when isOpen is false', () => {
      render(<AuthModal isOpen={false} onClose={mockOnClose} />);

      expect(screen.queryByText(/sign in/i)).not.toBeInTheDocument();
    });

    it('should call onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      render(<AuthModal isOpen={true} onClose={mockOnClose} />);

      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});
