import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building2, ArrowLeft, Mail } from 'lucide-react';
import { Button } from '@/design-system/components/Button';
import { FormField, Input } from '@/design-system/components/FormField';
import { authApi } from '@/api/auth';
import { t } from '@/i18n';

const getForgotSchema = () =>
  z.object({
    email: z
      .string()
      .min(1, t('auth.validation.emailRequired'))
      .email(t('auth.validation.emailInvalid')),
  });

type ForgotFormData = z.infer<ReturnType<typeof getForgotSchema>>;

const ForgotPasswordPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotFormData>({
    resolver: zodResolver(getForgotSchema()),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: ForgotFormData) => {
    setIsLoading(true);
    setServerError(null);
    try {
      await authApi.forgotPassword(data.email);
      setIsSent(true);
    } catch {
      setServerError(t('auth.forgotPasswordError'));
    } finally {
      setIsLoading(false);
    }
  };

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

        {isSent ? (
          /* Success state */
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-8">
            <div className="flex items-center justify-center w-12 h-12 bg-success-100 dark:bg-success-900/30 rounded-full mb-4 mx-auto">
              <Mail size={24} className="text-success-600 dark:text-success-400" />
            </div>
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 text-center mb-2">
              {t('auth.resetEmailSent')}
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center mb-6">
              {t('auth.resetEmailSentDesc')}
            </p>
            <Link
              to="/login"
              className="flex items-center justify-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              <ArrowLeft size={16} />
              {t('auth.backToLogin')}
            </Link>
          </div>
        ) : (
          /* Form */
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-8">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
              {t('auth.forgotPasswordTitle')}
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
              {t('auth.forgotPasswordDesc')}
            </p>

            {serverError && (
              <div className="mb-4 p-3 bg-danger-50 border border-danger-200 text-danger-700 text-sm rounded-lg">
                {serverError}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                label={t('auth.email')}
                htmlFor="forgot-email"
                error={errors.email?.message}
                required
              >
                <Input
                  id="forgot-email"
                  type="email"
                  placeholder="name@company.ru"
                  autoComplete="email"
                  hasError={!!errors.email}
                  {...register('email')}
                />
              </FormField>

              <Button type="submit" fullWidth loading={isLoading} size="lg">
                {t('auth.sendResetLink')}
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

export default ForgotPasswordPage;
