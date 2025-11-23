/**
 * Enhanced Auth Page - Rebuilt with Clean Architecture
 *
 * Uses the new authentication system with proper separation of concerns.
 * Presentation logic only - business logic lives in use cases.
 */

import { LogIn, Mail, Lock, Eye, EyeOff, User } from 'lucide-react';
import { useState, useEffect } from 'react';

import {
  registerUser,
  requestOTP,
  verifyOTP,
  validateEmail,
  validatePassword,
  validateDisplayName,
  validatePasswordMatch,
  requestPasswordReset,
  getErrorDisplayInfo,
  type RegisterUserInput,
} from '../../lib/auth';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';

import { EmailVerificationStatus } from './EmailVerificationStatus';

type AuthMode = 'login' | 'register' | 'forgot-password' | 'verify-email';
type LoginMethod = 'password' | 'pin';
type LoginStep = 'credentials' | 'pin-verify';

export function EnhancedAuthPage() {
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('password');
  const [loginStep, setLoginStep] = useState<LoginStep>('credentials');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [pin, setPin] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verificationEmail, setVerificationEmail] = useState('');

  const { addToast } = useToastStore();

  const resetForm = () => {
    setError('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setDisplayName('');
    setPin('');
    setLoginStep('credentials');
  };

  useEffect(() => {
    resetForm();
  }, []);

  // Clear password mismatch error when passwords match
  useEffect(() => {
    if (authMode === 'register' && password && confirmPassword && password === confirmPassword) {
      // Only clear the error if it's a password mismatch error
      if (error === 'Passwords do not match') {
        setError('');
      }
    }
  }, [password, confirmPassword, authMode, error]);

  // ========================================================================
  // PASSWORD LOGIN
  // ========================================================================

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Microsoft Enterprise pattern: Use auth store signIn
    const { signIn } = useAuthStore.getState();
    const { error: loginError } = await signIn(email, password);

    if (loginError) {
      const errorInfo = getErrorDisplayInfo(loginError.message);
      setError(errorInfo.message);
      setLoading(false);
    } else {
      addToast('Login successful!', 'success');
      setLoading(false);
      // Session is automatically set by auth store
    }
  };

  // ========================================================================
  // PIN LOGIN
  // ========================================================================

  const handlePINRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email) {
      setError('Email is required');
      return;
    }
    setLoading(true);

    const result = await requestOTP(email);

    if (result.success) {
      setLoginStep('pin-verify');
      addToast('Check your email for your 6-digit PIN code!', 'success');
    } else {
      // Use the detailed service error if available, otherwise fall back to error display info
      const errorMessage = result.serviceError || getErrorDisplayInfo(result.error || 'An unknown error occurred').message;
      setError(errorMessage);

      // Show helpful toast for common issues
      if (result.error === 'EMAIL_SERVICE_UNAVAILABLE') {
        addToast('Email service not configured. Use password login.', 'error');
      } else if (result.error === 'RATE_LIMIT_EXCEEDED') {
        addToast('Too many requests. Please wait before trying again.', 'error');
      } else if (result.error === 'USER_NOT_FOUND') {
        addToast('Account not found. Please register or use password login.', 'error');
      }
    }

    setLoading(false);
  };

  const handlePINVerify = async (e?: React.FormEvent, pinValue?: string) => {
    if (e) e.preventDefault();
    if (!email) {
      setError('Email is required');
      return;
    }
    setError('');
    setLoading(true);

    const pinToVerify = pinValue || pin;
    const result = await verifyOTP(email, pinToVerify);

    if (result.success && result.user) {
      // Microsoft Enterprise pattern: Set session in auth store after OTP verification
      const { setSession } = useAuthStore.getState();
      setSession({ 
        user: result.user, 
        access_token: '', 
        refresh_token: '',
        expires_in: 3600,
        token_type: 'bearer'
      });
      addToast('Login successful!', 'success');
      resetForm();
    } else {
      const errorInfo = getErrorDisplayInfo(result.error || 'An unknown error occurred');
      setError(errorInfo.message);
    }

    setLoading(false);
  };

  const handlePinChange = (value: string) => {
    const numericValue = value.replace(/\D/g, '').slice(0, 6);
    setPin(numericValue);

    if (numericValue.length === 6 && !loading) {
      handlePINVerify(undefined, numericValue);
    }
  };

  // ========================================================================
  // FORGOT PASSWORD
  // ========================================================================

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      setError(emailValidation.error || 'Invalid email');
      return;
    }

    setLoading(true);

    const result = await requestPasswordReset(email);

    if (result.success) {
      addToast('Password reset email sent! Check your inbox.', 'success');
      setAuthMode('login');
      resetForm();
      } else {
      setError(result.error || 'Failed to send reset email');
      }

      setLoading(false);
  };

  // ========================================================================
  // REGISTRATION
  // ========================================================================

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Client-side validation
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      setError(emailValidation.error || 'Invalid email');
      return;
    }

    const nameValidation = validateDisplayName(displayName);
    if (!nameValidation.valid) {
      setError(nameValidation.error || 'Invalid display name');
      return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      setError(passwordValidation.errors[0] || 'Invalid password');
      return;
    }

    const matchValidation = validatePasswordMatch(password, confirmPassword);
    if (!matchValidation.valid) {
      setError(matchValidation.error || 'Passwords do not match');
      return;
    }

    setLoading(true);

    const input: RegisterUserInput = {
      email,
      password,
      confirmPassword,
      displayName,
    };

    const result = await registerUser(input);

    if (result.success) {
      addToast('Registration successful! Please check your email (including spam folder) to verify your account before logging in.', 'success');
      setAuthMode('login');
      resetForm();
    } else {
      const errorInfo = getErrorDisplayInfo(result.error || 'An unknown error occurred');
      setError(errorInfo.message);
    }

    setLoading(false);
  };

  // ========================================================================
  // RENDER
  // ========================================================================

  if (authMode === 'verify-email') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <EmailVerificationStatus
          email={verificationEmail}
          onBack={() => {
            setAuthMode('login');
            setVerificationEmail('');
            resetForm();
          }}
        />
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
              <LogIn className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Trading Room</h1>
            <p className="text-slate-300">Professional live trading platform</p>
          </div>

          {authMode === 'login' && (
            <>
              {loginMethod === 'password' ? (
                loginStep === 'credentials' ? (
                  <form onSubmit={handlePasswordLogin} className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-slate-200 mb-2">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          id="password-login-email"
                          name="password-login-email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full pl-11 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="your@email.com"
                          required
                          disabled={loading}
                          autoComplete="email"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-200 mb-2">
                        Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full pl-11 pr-11 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter your password"
                          required
                          disabled={loading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    {error && (
                      <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-sm text-red-200">
                        {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-semibold py-3 rounded-lg transition-colors duration-200"
                    >
                      {loading ? 'Signing In...' : 'Sign In with Password'}
                    </button>

                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => {
                          resetForm();
                          setAuthMode('forgot-password');
                        }}
                        className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        Forgot password?
                      </button>
                    </div>
                  </form>
                ) : undefined
              ) : (
                loginStep === 'credentials' ? (
                  <form onSubmit={handlePINRequest} className="space-y-5">
                    <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg mb-4">
                      <p className="text-blue-200 text-xs text-center">
                        💡 We'll send a 6-digit PIN code to your email. Make sure to check your spam folder!
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-200 mb-2">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          id="pin-request-email"
                          name="pin-request-email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full pl-11 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="your@email.com"
                          required
                          disabled={loading}
                          autoComplete="email"
                        />
                      </div>
                    </div>

                    {error && (
                      <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-sm text-red-200">
                        {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-semibold py-3 rounded-lg transition-colors duration-200"
                    >
                      {loading ? 'Sending PIN...' : 'Send PIN to Email'}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handlePINVerify} className="space-y-5">
                    <div className="p-4 bg-blue-500/20 border border-blue-500/50 rounded-lg space-y-2">
                      <p className="text-blue-200 text-sm text-center">
                        📧 Check your email <span className="font-semibold">{email}</span> for your 6-digit PIN code
                      </p>
                      <p className="text-blue-300/70 text-xs text-center">
                        💡 Don't forget to check your spam/junk folder
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-200 mb-2">
                        Enter PIN from Email
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          id="pin-code"
                          name="pin-code"
                          type="text"
                          inputMode="numeric"
                          value={pin}
                          onChange={(e) => handlePinChange(e.target.value)}
                          className="w-full pl-11 pr-4 py-4 bg-white/10 border-2 border-white/20 rounded-lg text-white placeholder-slate-400 text-center text-3xl tracking-[0.5em] font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                          placeholder="______"
                          maxLength={6}
                          required
                          disabled={loading}
                          autoFocus
                          autoComplete="one-time-code"
                        />
                      </div>
                      <p className="text-xs text-slate-400 mt-2 text-center">
                        {pin.length}/6 digits • Auto-submits when complete
                      </p>
                    </div>

                    {error && (
                      <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-sm text-red-200">
                        {error}
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setLoginStep('credentials');
                          setPin('');
                          setError('');
                        }}
                        disabled={loading}
                        className="flex-1 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-700 text-white font-semibold py-3 rounded-lg transition-colors duration-200"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={loading || pin.length !== 6}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-semibold py-3 rounded-lg transition-colors duration-200"
                      >
                        {loading ? 'Verifying...' : 'Verify PIN'}
                      </button>
                    </div>

                    <div className="text-center">
                      <button
                        type="button"
                        onClick={async () => {
                          setPin('');
                          setError('');
                          setLoading(true);
                          const result = await requestOTP(email);
                          if (result.success) {
                            addToast('New PIN code sent to your email!', 'success');
                          } else {
                            const errorMessage = result.serviceError || 'Failed to resend PIN';
                            setError(errorMessage);
                          }
                          setLoading(false);
                        }}
                        disabled={loading}
                        className="text-sm text-blue-400 hover:text-blue-300 transition-colors disabled:text-slate-500"
                      >
                        Didn't receive the code? Resend PIN
                      </button>
                    </div>
                  </form>
                )
              )}

              <div className="mt-6 space-y-3">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-600"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-slate-700/50 text-slate-400">Or</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    resetForm();
                    setLoginMethod(loginMethod === 'password' ? 'pin' : 'password');
                  }}
                  className="w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 rounded-lg transition-colors duration-200"
                >
                  {loginMethod === 'password' ? 'Sign In with PIN Code' : 'Sign In with Password'}
                </button>

                <div className="text-center pt-2">
                  <p className="text-sm text-slate-400">
                    Don't have an account?{' '}
                    <button
                      onClick={() => {
                        resetForm();
                        setAuthMode('register');
                      }}
                      className="text-blue-400 hover:text-blue-300 font-semibold"
                    >
                      Create Account
                    </button>
                  </p>
                </div>
              </div>
            </>
          )}

          {authMode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Display Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="How should we call you?"
                    required
                    disabled={loading}
                    maxLength={50}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="your@email.com"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-11 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Create a strong password"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  8+ chars with uppercase, lowercase, and numbers
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-11 pr-11 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Confirm your password"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-200 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-semibold py-3 rounded-lg transition-colors duration-200"
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>

              <div className="text-center">
                <p className="text-sm text-slate-400">
                  Already have an account?{' '}
                  <button
                    onClick={() => {
                      resetForm();
                      setAuthMode('login');
                    }}
                    className="text-blue-400 hover:text-blue-300 font-semibold"
                  >
                    Sign In
                  </button>
                </p>
              </div>
            </form>
          )}

          {authMode === 'forgot-password' && (
            <form onSubmit={handleForgotPassword} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="your@email.com"
                    required
                    disabled={loading}
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  We'll send you a password reset link
                </p>
              </div>

              {error && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-200 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-semibold py-3 rounded-lg transition-colors duration-200"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setAuthMode('login');
                  }}
                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Back to Sign In
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="mt-6 text-center text-sm text-slate-400">
          <p>Check your email for verification links and PIN codes</p>
        </div>
      </div>
    </div>
  );
}