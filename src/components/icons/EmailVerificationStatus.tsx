import { Mail, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';

import { resendVerificationEmail } from '../../lib/auth';
import { useToastStore } from '../../store/toastStore';

interface EmailVerificationStatusProps {
  email: string;
  onBack: () => void;
}

export function EmailVerificationStatus({ email, onBack }: EmailVerificationStatusProps) {
  const [loading, setLoading] = useState(false);
  const [canResend, setCanResend] = useState(true);
  const [countdown, setCountdown] = useState(0);
  const { addToast } = useToastStore();

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(Number(countdown) - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
      return undefined;
    }
  }, [countdown]);

  const handleResendEmail = async () => {
    if (!canResend || loading) return;

    setLoading(true);
    const result = await resendVerificationEmail(email);
    setLoading(false);

    if (result.success) {
      addToast('Verification email sent! Please check your inbox and spam folder.', 'success');
      setCanResend(false);
      setCountdown(20);
    } else {
      addToast(result.error || 'Failed to resend email. Please try again.', 'error');
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/20 rounded-full mb-4">
            <Mail className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Check Your Email</h1>
          <p className="text-slate-300">We've sent a verification link to</p>
          <p className="text-white font-semibold mt-1">{email}</p>
        </div>

        <div className="space-y-4 mb-8">
          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-white font-medium">Check your inbox</p>
                <p className="text-sm text-slate-400 mt-1">
                  Look for an email from Trading Room with your verification link
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Clock className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-white font-medium">Check your spam folder</p>
                <p className="text-sm text-slate-400 mt-1">
                  Sometimes verification emails end up in spam or junk folders
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <RefreshCw className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-white font-medium">Didn't receive it?</p>
                <p className="text-sm text-slate-400 mt-1">
                  Click the button below to resend the verification email
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleResendEmail}
            disabled={!canResend || loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Sending...</span>
              </>
            ) : countdown > 0 ? (
              <>
                <Clock className="w-5 h-5" />
                <span>Resend in {countdown}s</span>
              </>
            ) : (
              <>
                <Mail className="w-5 h-5" />
                <span>Resend Verification Email</span>
              </>
            )}
          </button>

          <button
            onClick={onBack}
            className="w-full bg-white/10 hover:bg-white/20 text-white font-semibold py-3 rounded-lg transition-colors duration-200"
          >
            Back to Login
          </button>
        </div>

        <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <div className="flex items-start space-x-3">
            <XCircle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="text-yellow-200 font-medium">Still having issues?</p>
              <p className="text-yellow-300/80 mt-1">
                Contact our support team for assistance with email verification.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
