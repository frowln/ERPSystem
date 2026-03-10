import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/design-system/components/Button';
import { FormField, Input } from '@/design-system/components/FormField';
import { useAuthStore } from '@/stores/authStore';
import { authApi } from '@/api/auth';
import toast from 'react-hot-toast';
import { t } from '@/i18n';

const getRegisterSchema = () =>
  z
    .object({
      firstName: z.string().min(1, t('auth.validation.emailRequired')),
      lastName: z.string().min(1, t('auth.validation.emailRequired')),
      email: z
        .string()
        .min(1, t('auth.validation.emailRequired'))
        .email(t('auth.validation.emailInvalid')),
      password: z
        .string()
        .min(1, t('auth.validation.passwordRequired'))
        .min(8, t('auth.validation.passwordMin')),
      confirmPassword: z.string().min(1, t('auth.validation.confirmPasswordRequired')),
      organizationName: z.string().optional(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t('auth.validation.passwordsMismatch'),
      path: ['confirmPassword'],
    });

type RegisterFormData = z.infer<ReturnType<typeof getRegisterSchema>>;

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(getRegisterSchema()),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      organizationName: '',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setServerError(null);
    try {
      const response = await authApi.register({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        organizationName: data.organizationName || undefined,
      });
      setAuth(response.user, response.token);
      toast.success(t('auth.registerSuccess'));
      navigate('/', { replace: true });
    } catch (err: unknown) {
      const error = err as { response?: { status?: number; data?: { message?: string } } };
      if (error.response?.status === 400 && error.response?.data?.message?.includes('already')) {
        setServerError(t('auth.emailAlreadyUsed'));
      } else {
        setServerError(error.response?.data?.message ?? t('auth.registerError'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left: Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-neutral-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900/30 via-transparent to-primary-600/10" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary-500/5 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center">
              <Building2 size={22} className="text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-wide">{t('auth.brandName')}</span>
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
          </div>

          <p className="text-xs text-neutral-600">
            &copy; {new Date().getFullYear()} {t('auth.copyright')}
          </p>
        </div>
      </div>

      {/* Right: Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white dark:bg-neutral-950">
        <div className="w-full max-w-[420px]">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-9 h-9 bg-primary-500 rounded-lg flex items-center justify-center">
              <Building2 size={20} className="text-white" />
            </div>
            <span className="text-lg font-bold text-neutral-900 dark:text-neutral-100 tracking-wide">
              {t('auth.brandName')}
            </span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
              {t('auth.registerTitle')}
            </h2>
            <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
              {t('auth.registerSubtitle')}
            </p>
          </div>

          {serverError && (
            <div className="mb-6 p-3 bg-danger-50 border border-danger-200 text-danger-700 text-sm rounded-lg animate-fade-in">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField label={t('auth.firstName')} htmlFor="reg-first" error={errors.firstName?.message} required>
                <Input
                  id="reg-first"
                  autoComplete="given-name"
                  hasError={!!errors.firstName}
                  {...register('firstName')}
                />
              </FormField>
              <FormField label={t('auth.lastName')} htmlFor="reg-last" error={errors.lastName?.message} required>
                <Input
                  id="reg-last"
                  autoComplete="family-name"
                  hasError={!!errors.lastName}
                  {...register('lastName')}
                />
              </FormField>
            </div>

            <FormField label={t('auth.email')} htmlFor="reg-email" error={errors.email?.message} required>
              <Input
                id="reg-email"
                type="email"
                placeholder="name@company.ru"
                autoComplete="email"
                hasError={!!errors.email}
                {...register('email')}
              />
            </FormField>

            <FormField label={t('auth.organizationName')} htmlFor="reg-org" error={errors.organizationName?.message}>
              <Input
                id="reg-org"
                placeholder="ООО «Компания»"
                autoComplete="organization"
                hasError={!!errors.organizationName}
                {...register('organizationName')}
              />
            </FormField>

            <FormField label={t('auth.password')} htmlFor="reg-password" error={errors.password?.message} required>
              <div className="relative">
                <Input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('auth.passwordPlaceholder')}
                  autoComplete="new-password"
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

            <FormField
              label={t('auth.confirmPassword')}
              htmlFor="reg-confirm"
              error={errors.confirmPassword?.message}
              required
            >
              <Input
                id="reg-confirm"
                type={showPassword ? 'text' : 'password'}
                placeholder={t('auth.confirmPasswordPlaceholder')}
                autoComplete="new-password"
                hasError={!!errors.confirmPassword}
                {...register('confirmPassword')}
              />
            </FormField>

            {/* Consent checkbox */}
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                required
                className="mt-1 h-4 w-4 rounded border-neutral-300 dark:border-neutral-600 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                {t('legal.consent.text')}{' '}
                <Link to="/privacy" target="_blank" className="text-primary-600 hover:underline">
                  {t('legal.consent.privacyLink')}
                </Link>{' '}
                {t('legal.consent.and')}{' '}
                <Link to="/terms" target="_blank" className="text-primary-600 hover:underline">
                  {t('legal.consent.termsLink')}
                </Link>.
              </span>
            </label>

            <Button type="submit" fullWidth loading={isLoading} size="lg">
              {t('auth.signUp')}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
            {t('auth.alreadyHaveAccount')}{' '}
            <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
              {t('auth.login')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
