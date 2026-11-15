import React, { useState, useEffect } from 'react';
import {
  Key,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Cpu,
  Trash2,
  X,
  Eye,
  EyeOff,
  RefreshCw,
} from 'lucide-react';
import {
  getStoredGeminiApiKey,
  setStoredGeminiApiKey,
  hasGeminiApiKey,
} from '../services/geminiService';
import { Language } from '../types/agro';

interface GeminiApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

export const GeminiApiKeyModal: React.FC<GeminiApiKeyModalProps> = ({
  isOpen,
  onClose,
  language,
}) => {
  const isAr = language === 'ar';
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      setApiKey(getStoredGeminiApiKey());
      setTestStatus('idle');
      setStatusMessage('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestAndSave = async () => {
    const trimmed = apiKey.trim();
    if (!trimmed) {
      setStoredGeminiApiKey('');
      setTestStatus('idle');
      setStatusMessage(isAr ? 'تم مسح المفتاح والعودة للمحرك المحلي' : 'Key cleared, using local engine');
      return;
    }

    setTestStatus('testing');
    setStatusMessage(isAr ? 'جاري الاتصال بنماذج Google Gemini...' : 'Connecting to Google Gemini models...');

    try {
      // Test with official gemini-2.5-flash
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(trimmed)}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: 'ping' }] }],
          generationConfig: { maxOutputTokens: 5 },
        }),
        signal: AbortSignal.timeout(10000),
      });

      if (res.ok) {
        setStoredGeminiApiKey(trimmed);
        setTestStatus('success');
        setStatusMessage(
          isAr
            ? 'تم الاتصال بنجاح بنموذج Gemini 2.5 Flash الرسمي وتم حفظ المفتاح بأمان!'
            : 'Successfully connected to official Gemini 2.5 Flash and saved key!'
        );
      } else {
        const errorData = await res.json().catch(() => ({}));
        const msg = errorData?.error?.message || `HTTP ${res.status}`;
        setTestStatus('error');
        setStatusMessage(
          isAr
            ? `فشل الاتصال: ${msg}. تأكد من صحة المفتاح من Google AI Studio.`
            : `Connection failed: ${msg}. Verify your key at Google AI Studio.`
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setTestStatus('error');
      setStatusMessage(
        isAr
          ? `تعذر الاتصال بالخادم: ${msg}`
          : `Network error connecting to Gemini: ${msg}`
      );
    }
  };

  const handleClear = () => {
    setStoredGeminiApiKey('');
    setApiKey('');
    setTestStatus('idle');
    setStatusMessage(
      isAr
        ? 'تمت إزالة المفتاح. سيعتمد GeoAgri ai على محرك المعرفة الزراعي الخبير المدمج.'
        : 'Key removed. GeoAgri ai will rely on the built-in local agronomic expert engine.'
    );
  };

  const activeKeyExists = hasGeminiApiKey();

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>{isAr ? 'تكامل Google Gemini Live' : 'Google Gemini Live Setup'}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  v2.5 Flash
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isAr
                  ? 'أحدث نماذج الذكاء الاصطناعي المدعومة رسمياً من Google'
                  : "Google's latest officially supported production AI models"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={isAr ? 'إغلاق' : 'Close'}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs sm:text-sm">
          {/* Models status cards */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20">
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="font-bold text-emerald-800 dark:text-emerald-300">
                  Gemini 2.5 Flash
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                {isAr
                  ? 'النموذج الأساسي فائق السرعة والدقة متعدد الوسائط (صور، فيديو، نصوص)'
                  : 'Primary ultra-fast multimodal model (vision, video, text)'}
              </p>
            </div>

            <div className="p-3 rounded-xl border border-sky-500/30 bg-sky-50/50 dark:bg-sky-950/20">
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="font-bold text-sky-800 dark:text-sky-300">
                  Gemini 1.5 Flash
                </span>
                <span className="w-2 h-2 rounded-full bg-sky-500" />
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                {isAr
                  ? 'النموذج الاحتياطي التلقائي لضمان استمرارية الرد دون توقف'
                  : 'Automatic high-efficiency failover fallback'}
              </p>
            </div>
          </div>

          {/* Explanation */}
          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
              <Cpu className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{isAr ? 'كيف يعمل الذكاء الاصطناعي في GeoAgri Pro؟' : 'How GeoAgri AI Works'}</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              {isAr ? (
                <>
                  عند إضافة مفتاح API الخاص بك من Google AI Studio، يجيب <strong>Gemini 2.5 Flash</strong> مباشرة وبذكاء على أي سؤال زراعي أو استفسار عام ويتحكم بكافة أدوات الموقع. بدون مفتاح، يعمل <strong>المحرك الزراعي الخبير المدمج</strong> محلياً لتقديم أدلة زراعة المحاصيل والتوصيات المباشرة.
                </>
              ) : (
                <>
                  With your Google AI Studio API key, <strong>Gemini 2.5 Flash</strong> answers any agronomic question dynamically and operates site tools. Without a key, GeoAgri uses its built-in expert agronomic knowledge engine.
                </>
              )}
            </p>
          </div>

          {/* Key Input Field */}
          <div className="space-y-1.5">
            <label className="block font-bold text-slate-800 dark:text-slate-200 text-xs">
              {isAr ? 'مفتاح Google Gemini API Key:' : 'Google Gemini API Key:'}
            </label>
            <div className="relative flex items-center">
              <div className="absolute start-3 text-slate-400">
                <Key className="w-4 h-4" />
              </div>
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full ps-9 pe-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute end-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                aria-label={showKey ? 'Hide key' : 'Show key'}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* AI Studio Link */}
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
            <span className="flex items-center gap-1 text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              {isAr ? 'يتم حفظ المفتاح محلياً في متصفحك فقط' : 'Key saved locally in your browser'}
            </span>
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              <span>{isAr ? 'احصل على مفتاح مجاني' : 'Get free API Key'}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Status Message */}
          {statusMessage && (
            <div
              className={`p-3 rounded-xl border flex items-center gap-2 text-xs ${
                testStatus === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500/40 text-emerald-800 dark:text-emerald-300'
                  : testStatus === 'error'
                  ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-500/40 text-rose-800 dark:text-rose-300'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              {testStatus === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : testStatus === 'error' ? (
                <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
              ) : (
                <RefreshCw className="w-4 h-4 text-slate-500 shrink-0 animate-spin" />
              )}
              <span className="leading-snug">{statusMessage}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 flex items-center justify-between gap-2">
          {activeKeyExists && (
            <button
              type="button"
              onClick={handleClear}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isAr ? 'إزالة المفتاح' : 'Clear Key'}</span>
            </button>
          )}

          <div className="flex items-center gap-2 ms-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 transition cursor-pointer"
            >
              {isAr ? 'إغلاق' : 'Close'}
            </button>
            <button
              type="button"
              onClick={handleTestAndSave}
              disabled={testStatus === 'testing'}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md shadow-emerald-600/20"
            >
              {testStatus === 'testing' ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" />
              )}
              <span>{isAr ? 'حفظ واختبار الاتصال' : 'Save & Test'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
