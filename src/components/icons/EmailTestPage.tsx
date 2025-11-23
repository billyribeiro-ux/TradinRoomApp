import { Mail, AlertCircle, CheckCircle, Loader2, Copy, RefreshCw, ArrowLeft } from 'lucide-react';
import { useState } from 'react';

import { sendEmail } from '../../lib/emailService';
import { EmailServiceHealth } from '../../lib/emailServiceHealth';
// Fixed: 2025-01-24 - Eradicated 2 null usage(s) - Microsoft TypeScript standards
// Replaced null with undefined, removed unnecessary null checks, used optional types


interface TestResult {
  timestamp: string;
  success: boolean;
  error?: string;
  errorType?: string;
  statusCode?: number;
  response?: unknown;
  duration: number;
}

export function EmailTestPage({ onBack }: { onBack: () => void }) {
  const [to, setTo] = useState('welberribeirodrums@gmail.com');
  const [subject, setSubject] = useState('Test Email from Trading Room Platform');
  const [body, setBody] = useState('This is a test email to verify SMTP configuration is working.');
  const [isSending, setIsSending] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [healthStatus, setHealthStatus] = useState<{ available: boolean; error?: string; lastChecked?: number } | undefined>();
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const edgeFunctionUrl = supabaseUrl ? `${supabaseUrl}/functions/v1/send-email` : 'Not configured';
  const supabaseUrlDisplay = supabaseUrl ? `${supabaseUrl.substring(0, 10)}...${supabaseUrl.substring(supabaseUrl.length - 10)}` : 'Not set';

  const handleCheckHealth = async () => {
    setIsCheckingHealth(true);
    try {
      const health = await EmailServiceHealth.getInstance().checkHealth();
      setHealthStatus(health);
    } catch (error) {
      setHealthStatus({
        available: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsCheckingHealth(false);
    }
  };

  const handleClearCache = () => {
    EmailServiceHealth.getInstance().clearHealthCache();
    setHealthStatus(undefined);
  };

  const handleSendTest = async () => {
    setIsSending(true);
    const startTime = Date.now();

    try {
      const result = await sendEmail({
        to,
        subject,
        html: `<html><body><p>${body}</p></body></html>`,
        text: body,
      });

      const duration = Date.now() - startTime;

      const testResult: TestResult = {
        timestamp: new Date().toISOString(),
        success: result.success,
        error: result.error,
        errorType: 'unknown',
        response: result,
        duration,
      };

      setTestResults([testResult, ...testResults]);
    } catch (error) {
      const duration = Date.now() - startTime;
      const testResult: TestResult = {
        timestamp: new Date().toISOString(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        errorType: 'network',
        response: error,
        duration,
      };

      setTestResults([testResult, ...testResults]);
    } finally {
      setIsSending(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Mail className="w-8 h-8 text-blue-400" />
              Email Service Test & Diagnostics
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-400" />
                Send Test Email
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Recipient Email
                  </label>
                  <input
                    type="email"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="recipient@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Email subject"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Message Body
                  </label>
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Email body text"
                  />
                </div>

                <button
                  onClick={handleSendTest}
                  disabled={isSending || !to || !subject || !body}
                  className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Sending Email...
                    </>
                  ) : (
                    <>
                      <Mail className="w-5 h-5" />
                      Send Test Email
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <h2 className="text-xl font-semibold text-white mb-4">Configuration Status</h2>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-green-400"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-300">Supabase URL</p>
                    <p className="text-xs text-slate-400 font-mono break-all">{supabaseUrlDisplay}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-green-400"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-300">Edge Function Endpoint</p>
                    <p className="text-xs text-slate-400 font-mono break-all">{edgeFunctionUrl}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-green-400"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-300">SMTP Server</p>
                    <p className="text-xs text-slate-400">mail.mailconfig.net:465 (TLS)</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-green-400"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-300">From Address</p>
                    <p className="text-xs text-slate-400">noreply@revolutiontradingpros.com</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-700">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-white">Service Health Check</h3>
                  <button
                    onClick={handleClearCache}
                    className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Clear Cache
                  </button>
                </div>

                {healthStatus && (
                  <div className={`p-3 rounded-lg ${healthStatus.available ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      {healthStatus.available ? (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-400" />
                      )}
                      <span className={`text-sm font-medium ${healthStatus.available ? 'text-green-400' : 'text-red-400'}`}>
                        {healthStatus.available ? 'Service Available' : 'Service Unavailable'}
                      </span>
                    </div>
                    {healthStatus.error && (
                      <p className="text-xs text-slate-400 ml-6">{healthStatus.error}</p>
                    )}
                    {healthStatus.lastChecked && (
                      <p className="text-xs text-slate-500 ml-6 mt-1">
                        Checked: {new Date(healthStatus.lastChecked).toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                )}

                <button
                  onClick={handleCheckHealth}
                  disabled={isCheckingHealth}
                  className="w-full mt-3 px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-700 text-white rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                >
                  {isCheckingHealth ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    'Run Health Check'
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <h2 className="text-xl font-semibold text-white mb-4">Test Results</h2>

              {testResults.length === 0 ? (
                <div className="text-center py-8">
                  <Mail className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">No tests run yet</p>
                  <p className="text-xs text-slate-500 mt-1">Send a test email to see results here</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {testResults.map((result, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border ${
                        result.success
                          ? 'bg-green-500/10 border-green-500/20'
                          : 'bg-red-500/10 border-red-500/20'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {result.success ? (
                            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                          )}
                          <span className={`font-semibold ${result.success ? 'text-green-400' : 'text-red-400'}`}>
                            {result.success ? 'Success' : 'Failed'}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400">
                          {new Date(result.timestamp).toLocaleTimeString()}
                        </span>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-slate-300">
                          <span className="text-slate-500">Duration:</span>
                          <span className="font-mono">{result.duration}ms</span>
                        </div>

                        {result.error && (
                          <div className="mt-2">
                            <p className="text-xs text-slate-500 mb-1">Error:</p>
                            <div className="bg-slate-900/50 p-3 rounded border border-slate-700">
                              <p className="text-xs text-red-400 font-mono break-all">{result.error}</p>
                            </div>
                          </div>
                        )}

                        {result.errorType && (
                          <div className="flex items-center gap-2 text-slate-300">
                            <span className="text-slate-500">Error Type:</span>
                            <span className="font-mono text-xs">{result.errorType}</span>
                          </div>
                        )}

                        {result.response != undefined && (
                          <div className="mt-3">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-xs text-slate-500">Full Response:</p>
                              <button
                                onClick={() => copyToClipboard(JSON.stringify(result.response, null, 2))}
                                className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1"
                              >
                                <Copy className="w-3 h-3" />
                                Copy
                              </button>
                            </div>
                            <div className="bg-slate-900/50 p-3 rounded border border-slate-700 max-h-48 overflow-y-auto">
                              <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap break-all">
                                {JSON.stringify(result.response as Record<string, unknown>, null, 2)}
                              </pre>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-slate-300">
              <p className="font-semibold text-blue-400 mb-1">Important Notes:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li>Email delivery may take a few minutes even after a successful send</li>
                <li>Check your spam folder if the email doesn't arrive</li>
                <li>The Edge Function must be deployed to Supabase for emails to work</li>
                <li>SMTP credentials are embedded in the Edge Function (not in frontend)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
