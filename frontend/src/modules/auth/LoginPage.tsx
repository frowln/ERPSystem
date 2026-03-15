import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building2, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { Button } from '@/design-system/components/Button';
import { FormField, Input } from '@/design-system/components/FormField';
import { useAuthStore } from '@/stores/authStore';
import { usePortalBrandingStore } from '@/stores/portalBrandingStore';
import { authApi, type TwoFactorRequired } from '@/api/auth';
import toast from 'react-hot-toast';
import { t } from '@/i18n';

const getLoginSchema = () => z.object({
  email: z
    .string()
    .min(1, t('auth.validation.emailRequired'))
    .email(t('auth.validation.emailInvalid')),
  password: z
    .string()
    .min(1, t('auth.validation.passwordRequired'))
    .min(6, t('auth.validation.passwordMin')),
});

type LoginFormData = z.infer<ReturnType<typeof getLoginSchema>>;

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { setAuth, redirectAfterLogin, setRedirectAfterLogin } = useAuthStore();
  const { logoUrl, primaryColor, companyName } = usePortalBrandingStore();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [twoFactorState, setTwoFactorState] = useState<TwoFactorRequired | null>(null);
  const [otpCode, setOtpCode] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(getLoginSchema()),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const completeLogin = (response: { user: any; token: string }) => {
    setAuth(response.user, response.token);
    toast.success(t('auth.welcomeMessage'));
    const redirectTo = redirectAfterLogin ?? '/';
    setRedirectAfterLogin(null);
    navigate(redirectTo, { replace: true });
  };

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setServerError(null);

    try {
      const response = await authApi.login(data);
      if ('requiresTwoFactor' in response && response.requiresTwoFactor) {
        setTwoFactorState(response);
        setIsLoading(false);
        return;
      }
      completeLogin(response as { user: any; token: string });
    } catch (err: unknown) {
      const error = err as { response?: { status?: number; data?: { message?: string } } };
      if (error.response?.status === 401) {
        setServerError(t('auth.invalidCredentials'));
      } else if (error.response?.status === 423) {
        setServerError(error.response?.data?.message ?? t('auth.accountLocked'));
      } else {
        setServerError(error.response?.data?.message ?? t('auth.loginError'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit2fa = async () => {
    if (!twoFactorState || !otpCode.trim()) return;
    setIsLoading(true);
    setServerError(null);

    try {
      const response = await authApi.verify2fa(twoFactorState.tempToken, otpCode.trim());
      completeLogin(response);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setServerError(error.response?.data?.message ?? t('auth.invalid2faCode'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left: Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-neutral-900 relative overflow-hidden">
        <div
          className="absolute inset-0 bg-gradient-to-br from-primary-900/30 via-transparent to-primary-600/10"
          style={primaryColor && primaryColor !== '#6366f1' ? { background: `linear-gradient(to bottom right, ${primaryColor}4D, transparent, ${primaryColor}1A)` } : undefined}
        />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary-500/5 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <img src={logoUrl} alt={companyName || t('auth.brandName')} className="w-10 h-10 rounded-xl object-contain" />
            ) : (
              <div
                className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center"
                style={primaryColor && primaryColor !== '#6366f1' ? { backgroundColor: primaryColor } : undefined}
              >
                <Building2 size={22} className="text-white" />
              </div>
            )}
            <span className="text-xl font-bold text-white tracking-wide">
              {companyName || t('auth.brandName')}
            </span>
          </div>

          <div className="max-w-md">
            <h1 className="text-4xl font-bold text-white leading-tight mb-4">
              {t('auth.brandingTitleLine1')}
              <br />
              {t('auth.brandingTitleLine2')}
            </h1>
            <p className="text-lg text-neutral-400 leading-relaxed">
              {t('auth.brandingSubtitle')}
            </p>

            <div className="mt-10 grid grid-cols-2 gap-6">
              {[
                { value: '500+', label: t('auth.stats.projects') },
                { value: t('auth.stats.budgetValue'), label: t('auth.stats.budget') },
                { value: '2 000+', label: t('auth.stats.users') },
                { value: '99.9%', label: t('auth.stats.uptime') },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-neutral-600">
            &copy; {new Date().getFullYear()} {t('auth.copyright')}
          </p>
        </div>
      </div>

      {/* Right: Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white dark:bg-neutral-950">
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            {logoUrl ? (
              <img src={logoUrl} alt={companyName || t('auth.brandName')} className="w-9 h-9 rounded-lg object-contain" />
            ) : (
              <div
                className="w-9 h-9 bg-primary-500 rounded-lg flex items-center justify-center"
                style={primaryColor && primaryColor !== '#6366f1' ? { backgroundColor: primaryColor } : undefined}
              >
                <Building2 size={20} className="text-white" />
              </div>
            )}
            <span className="text-lg font-bold text-neutral-900 dark:text-neutral-100 tracking-wide">
              {companyName || t('auth.brandName')}
            </span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">{t('auth.loginTitle')}</h2>
            <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
              {t('auth.loginSubtitle')}
            </p>
          </div>

          {serverError && (
            <div className="mb-6 p-3 bg-danger-50 border border-danger-200 text-danger-700 text-sm rounded-lg animate-fade-in">
              {serverError}
            </div>
          )}

          {/* 2FA Code Entry */}
          {twoFactorState ? (
            <div className="space-y-5">
              <div className="flex items-center gap-3 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800">
                <ShieldCheck className="h-6 w-6 text-primary-600 dark:text-primary-400 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-primary-800 dark:text-primary-300">{t('auth.twoFactorRequired')}</p>
                  <p className="text-xs text-primary-600 dark:text-primary-400 mt-0.5">{t('auth.twoFactorHint')}</p>
                </div>
              </div>

              <FormField label={t('auth.twoFactorCode')} htmlFor="otp-code">
                <Input
                  id="otp-code"
                  type="text"
                  inputMode="numeric"
                  maxLength={8}
                  placeholder="000000"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  autoFocus
                  className="text-center text-lg tracking-[0.3em] font-mono"
                />
              </FormField>

              <Button type="button" fullWidth loading={isLoading} size="lg" onClick={onSubmit2fa} disabled={otpCode.length < 6}>
                {t('auth.verifyCode')}
              </Button>

              <button
                type="button"
                onClick={() => { setTwoFactorState(null); setOtpCode(''); setServerError(null); }}
                className="w-full text-sm text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
              >
                {t('auth.backToLogin')}
              </button>
            </div>
          ) : (

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <FormField label={t('auth.email')} htmlFor="login-email" error={errors.email?.message} required>
              <Input
                id="login-email"
                type="email"
                placeholder="name@company.ru"
                autoComplete="email"
                hasError={!!errors.email}
                {...register('email')}
              />
            </FormField>

            <FormField label={t('auth.password')} htmlFor="login-password" error={errors.password?.message} required>
              <div className="relative">
                <Input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('auth.passwordPlaceholder')}
                  autoComplete="current-password"
                  hasError={!!errors.password}
                  className="pr-10"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </FormField>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 rounded border-neutral-300 dark:border-neutral-600 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-neutral-600 dark:text-neutral-400">{t('auth.rememberMe')}</span>
              </label>
              <Link to="/forgot-password" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                {t('auth.forgotPassword')}
              </Link>
            </div>

            <Button type="submit" fullWidth loading={isLoading} size="lg">
              {t('auth.login')}
            </Button>
          </form>
          )}

          <p className="mt-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
            {t('auth.noAccount')}{' '}
            <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium">
              {t('auth.register')}
            </Link>
          </p>

          {import.meta.env.DEV && (
            <div className="mt-4 rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 text-xs text-primary-700">
              {t('auth.testCredentials')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
