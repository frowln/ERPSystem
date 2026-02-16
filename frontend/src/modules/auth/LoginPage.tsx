import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/design-system/components/Button';
import { FormField, Input } from '@/design-system/components/FormField';
import { useAuthStore } from '@/stores/authStore';
import { authApi } from '@/api/auth';
import toast from 'react-hot-toast';

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Введите email')
    .email('Некорректный формат email'),
  password: z
    .string()
    .min(1, 'Введите пароль')
    .min(6, 'Минимум 6 символов'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { setAuth, redirectAfterLogin, setRedirectAfterLogin } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setServerError(null);

    try {
      const response = await authApi.login(data);
      setAuth(response.user, response.token);
      toast.success('Добро пожаловать!');
      const redirectTo = redirectAfterLogin ?? '/';
      setRedirectAfterLogin(null);
      navigate(redirectTo, { replace: true });
    } catch (err: unknown) {
      const error = err as { response?: { status?: number; data?: { message?: string } } };
      if (error.response?.status === 401) {
        setServerError('Неверный email или пароль');
      } else {
        setServerError(error.response?.data?.message ?? 'Ошибка входа. Попробуйте позже.');
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
            <span className="text-xl font-bold text-white tracking-wide">ПРИВОД</span>
          </div>

          <div className="max-w-md">
            <h1 className="text-4xl font-bold text-white leading-tight mb-4">
              Строительная
              <br />
              платформа
            </h1>
            <p className="text-lg text-neutral-400 leading-relaxed">
              Управление проектами, документами, снабжением и финансами
              строительной компании в едином пространстве.
            </p>

            <div className="mt-10 grid grid-cols-2 gap-6">
              {[
                { value: '500+', label: 'Проектов' },
                { value: '12 млрд ₽', label: 'Бюджет' },
                { value: '2 000+', label: 'Пользователей' },
                { value: '99.9%', label: 'Аптайм' },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-neutral-600">
            &copy; {new Date().getFullYear()} Привод. Все права защищены.
          </p>
        </div>
      </div>

      {/* Right: Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white dark:bg-neutral-950">
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-9 h-9 bg-primary-500 rounded-lg flex items-center justify-center">
              <Building2 size={20} className="text-white" />
            </div>
            <span className="text-lg font-bold text-neutral-900 dark:text-neutral-100 tracking-wide">ПРИВОД</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">Вход в систему</h2>
            <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
              Введите данные для доступа к платформе
            </p>
          </div>

          {serverError && (
            <div className="mb-6 p-3 bg-danger-50 border border-danger-200 text-danger-700 text-sm rounded-lg animate-fade-in">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <FormField label="Email" htmlFor="login-email" error={errors.email?.message} required>
              <Input
                id="login-email"
                type="email"
                placeholder="name@company.ru"
                autoComplete="email"
                hasError={!!errors.email}
                {...register('email')}
              />
            </FormField>

            <FormField label="Пароль" htmlFor="login-password" error={errors.password?.message} required>
              <div className="relative">
                <Input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Введите пароль"
                  autoComplete="current-password"
                  hasError={!!errors.password}
                  className="pr-10"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
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
                <span className="text-sm text-neutral-600 dark:text-neutral-400">Запомнить меня</span>
              </label>
              <button type="button" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                Забыли пароль?
              </button>
            </div>

            <Button type="submit" fullWidth loading={isLoading} size="lg">
              Войти
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
            Нет аккаунта?{' '}
            <button className="text-primary-600 hover:text-primary-700 font-medium">
              Свяжитесь с администратором
            </button>
          </p>

          {import.meta.env.DEV && (
            <div className="mt-4 rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 text-xs text-primary-700">
              Тестовый вход: admin@privod.com / admin123
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
