import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertTriangle, Loader2, CheckCircle, ExternalLink } from 'lucide-react';
import { Button } from '@librechat/client';
import { useGetSubscriptionPlans, useGetSubscriptionStatus } from '~/data-provider/subscription';
import { useLocalize } from '~/hooks';

const BuyPlan: React.FC = () => {
  const { plan_id } = useParams<{ plan_id: string }>();
  const navigate = useNavigate();
  const localize = useLocalize();
  const { data: plans, isLoading, error } = useGetSubscriptionPlans();
  const [checkingStatus, setCheckingStatus] = useState(false);
  const { data: subscriptionStatus, refetch: refetchStatus } = useGetSubscriptionStatus();

  // Helper function to normalize payment link
  const normalizePaymentLink = (link: string): string => {
    if (link.startsWith('http://') || link.startsWith('https://')) {
      return link;
    }
    return `https://${link}`;
  };
  
  const [paymentOpened, setPaymentOpened] = useState(false);
  const [subscriptionSuccessful, setSubscriptionSuccessful] = useState(false);
  const [currentPaymentLink, setCurrentPaymentLink] = useState<string>('');
  const initialSubscriptionRef = useRef<any>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    console.log('plans:', plans);
    if (!isLoading && plans && plan_id && !paymentOpened) {
      // Find the plan by ID
      const plan = plans.find((p) => p._id === plan_id);

      if (plan && plan.paymentLink) {
        // Save initial subscription state
        if (!initialSubscriptionRef.current && subscriptionStatus) {
          initialSubscriptionRef.current = subscriptionStatus;
        }

        // Save payment link and open in new tab
        const normalizedLink = normalizePaymentLink(plan.paymentLink);
        setCurrentPaymentLink(normalizedLink);
        window.open(normalizedLink, '_blank');
        setPaymentOpened(true);
        setCheckingStatus(true);

        // Start checking subscription status every 3 seconds
        intervalRef.current = setInterval(() => {
          refetchStatus();
        }, 3000);
      }
    }
  }, [plans, isLoading, plan_id, paymentOpened, subscriptionStatus, refetchStatus]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);
  
  // Check for subscription changes
  useEffect(() => {
    if (checkingStatus && subscriptionStatus && initialSubscriptionRef.current) {
      // Check if subscription status has changed
      const oldStatus = initialSubscriptionRef.current;
      const newStatus = subscriptionStatus;

      // Compare subscription status - check if user now has active subscription
      if (
        (oldStatus.subscription?.isActive !== newStatus.subscription?.isActive &&
          newStatus.subscription?.isActive) ||
        (oldStatus.subscription?.tier !== newStatus.subscription?.tier &&
          newStatus.subscription?.tier)
      ) {
        setSubscriptionSuccessful(true);
        // Stop checking once successful
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      }
    }
  }, [subscriptionStatus, checkingStatus]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center text-center">
          <Loader2 className="mb-4 h-8 w-8 animate-spin text-green-500" />
          <p className="text-gray-600 dark:text-gray-400">
            {localize('com_ui_paywall_loading') || 'Загрузка тарифных планов...'}
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
            {localize('com_ui_paywall_error_loading') ||
              'Не удалось загрузить тарифные планы'}
          </h3>
          <p className="mb-4 text-gray-600 dark:text-gray-400">
            {localize('com_ui_paywall_contact_support') || 'Пожалуйста, обратитесь в службу поддержки'}
          </p>
          <Button onClick={() => navigate('/subscription/plans')} variant="outline">
            {'Посмотреть все планы'}
          </Button>
        </div>
      </div>
    );
  }

  // Find the plan
  const plan = plans?.find((p) => p._id === plan_id);

  // Plan not found
  if (!plan) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-yellow-500" />
          <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
            {'Тарифный план не найден'}
          </h3>
          <p className="mb-4 text-gray-600 dark:text-gray-400">
            {'Запрашиваемый тарифный план не существует или больше не доступен.'}
          </p>
          <Button onClick={() => navigate('/subscription/plans')} variant="default">
            {'Посмотреть доступные планы'}
          </Button>
        </div>
      </div>
    );
  }

  // Plan found but no payment link
  if (!plan.paymentLink) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-yellow-500" />
          <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
            {'Оплата недоступна'}
          </h3>
          <p className="mb-4 text-gray-600 dark:text-gray-400">
            {`Ссылка на оплату для плана ${plan.name} в данный момент недоступна.`}
          </p>
          <Button onClick={() => navigate('/subscription/plans')} variant="default">
            {'Посмотреть другие планы'}
          </Button>
        </div>
      </div>
    );
  }

  // Success state
  if (subscriptionSuccessful) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center text-center">
          <CheckCircle className="mb-4 h-16 w-16 text-green-500" />
          <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
            {'Оплата прошла успешно!'}
          </h2>
          <p className="mb-6 text-gray-600 dark:text-gray-400">
            {`Ваша подписка ${plan.name} успешно активирована.`}
          </p>
          <div className="flex gap-4">
            <Button onClick={() => navigate('/c/new')} variant="default">
              {'Начать общение'}
            </Button>
            <Button onClick={() => navigate('/dashboard')} variant="outline">
              {'Перейти в панель управления'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Waiting for payment state
  if (paymentOpened) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center text-center">
          <Loader2 className="mb-4 h-12 w-12 animate-spin text-blue-500" />
          <h2 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
            {'Ожидание подтверждения оплаты'}
          </h2>
          <p className="mb-4 text-gray-600 dark:text-gray-400">
            {'Пожалуйста, завершите оплату в новой открывшейся вкладке.'}
          </p>
          <div className="mb-4 flex items-center gap-2 text-sm text-gray-500">
            <ExternalLink className="h-4 w-4" />
            <span>{'Окно оплаты открыто в новой вкладке'}</span>
          </div>
          <p className="text-sm text-gray-500">
            {'Эта страница автоматически обновится после подтверждения оплаты.'}
          </p>
          <div className="mt-6 border-t border-gray-200 pt-6 dark:border-gray-700">
            <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
              {'Если окно оплаты закрылось или не открылось:'}
            </p>
            <Button 
              onClick={() => window.open(currentPaymentLink, '_blank')} 
              variant="outline"
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              {'Открыть страницу оплаты снова'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Initial loading/redirecting state
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="flex flex-col items-center text-center">
        <Loader2 className="mb-4 h-8 w-8 animate-spin text-green-500" />
        <p className="text-lg font-semibold text-gray-900 dark:text-white">
          {'Подготовка к оплате...'}
        </p>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          {`Настройка вашей подписки ${plan.name}.`}
        </p>
      </div>
    </div>
  );
};

export default BuyPlan;
