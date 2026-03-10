import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building2, ArrowLeft, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { Button } from '@/design-system/components/Button';
import { FormField, Input } from '@/design-system/components/FormField';
import { authApi } from '@/api/auth';
import { t } from '@/i18n';

const getResetSchema = () =>
  z
    .object({
      newPassword: z
        .string()
        .min(1, t('auth.validation.passwordRequired'))
        .min(8, t('auth.validation.passwordMin')),
      confirmPassword: z.string().min(1, t('auth.validation.confirmPasswordRequired')),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: t('auth.validation.passwordsMismatch'),
      path: ['confirmPassword'],
    });

type ResetFormData = z.infer<ReturnType<typeof getResetSchema>>;

const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetFormData>({
    resolver: zodResolver(getResetSchema()),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  const onSubmit = async (data: ResetFormData) => {
    if (!token) return;
    setIsLoading(true);
    setServerError(null);
    try {
      await authApi.resetPassword(token, data.newPassword);
      setIsSuccess(true);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setServerError(error.response?.data?.message ?? t('auth.resetPasswordError'));
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 p-4">
        <div className="w-full max-w-[420px] bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-8 text-center">
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
            {t('auth.invalidResetLink')}
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
            {t('auth.invalidResetLinkDesc')}
          </p>
          <Link
            to="/forgot-password"
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            {t('auth.requestNewLink')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 p-4">
      <div className="w-full max-w-[420px]">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 bg-primary-500 rounded-lg flex items-center justify-center">
            <Building2 size={20} className="text-white" />
          </div>
          <span className="text-lg font-bold text-neutral-900 dark:text-neutral-100 tracking-wide">
            {t('auth.brandName')}
          </span>
        </div>

        {isSuccess ? (
          /* Success state */
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-8">
            <div className="flex items-center justify-center w-12 h-12 bg-success-100 dark:bg-success-900/30 rounded-full mb-4 mx-auto">
              <CheckCircle size={24} className="text-success-600 dark:text-success-400" />
            </div>
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 text-center mb-2">
              {t('auth.passwordResetSuccess')}
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center mb-6">
              {t('auth.passwordResetSuccessDesc')}
            </p>
            <Link to="/login">
              <Button fullWidth size="lg">
                {t('auth.login')}
              </Button>
            </Link>
          </div>
        ) : (
          /* Form */
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-8">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
              {t('auth.resetPasswordTitle')}
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
              {t('auth.resetPasswordDesc')}
            </p>

            {serverError && (
              <div className="mb-4 p-3 bg-danger-50 border border-danger-200 text-danger-700 text-sm rounded-lg">
                {serverError}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                label={t('auth.newPassword')}
                htmlFor="new-password"
                error={errors.newPassword?.message}
                required
              >
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder={t('auth.passwordPlaceholder')}
                    autoComplete="new-password"
                    hasError={!!errors.newPassword}
                    className="pr-10"
                    {...register('newPassword')}
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
                htmlFor="confirm-password"
                error={errors.confirmPassword?.message}
                required
              >
                <Input
                  id="confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('auth.confirmPasswordPlaceholder')}
                  autoComplete="new-password"
                  hasError={!!errors.confirmPassword}
                  {...register('confirmPassword')}
                />
              </FormField>

              <Button type="submit" fullWidth loading={isLoading} size="lg">
                {t('auth.resetPassword')}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                <ArrowLeft size={16} />
                {t('auth.backToLogin')}
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordPage;
