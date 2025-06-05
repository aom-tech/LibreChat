import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { EModelEndpoint } from 'librechat-data-provider';
import { useNewConvo, useLocalize } from '~/hooks';
import { useYandexMetrica } from '~/hooks/useYandexMetrica';
import { Button } from '~/components/ui';
import useAuthRedirect from './useAuthRedirect';
import { Spinner } from '~/components/svg';

export default function AgentSelectRoute(): JSX.Element | null {
  const navigate = useNavigate();
  const localize = useLocalize();
  const { newConversation } = useNewConvo();
  const { isAuthenticated } = useAuthRedirect();
  const { reachGoal } = useYandexMetrica();

  // Static list of predefined agents
  const availableAgents = [
    {
      id: 'agent_0etaLy7vjo0_TbNSuz5m-',
      name: 'Анализ аудитории',
      description: 'Исследование и анализ целевой аудитории, создание портретов пользователей',
      icon: '👥',
    },
    {
      id: 'agent_5JKQPhWMw3MRi7YEJtJpx',
      name: 'Структура курса',
      description: 'Разработка структуры и плана обучающих курсов',
      icon: '📚',
    },
    {
      id: 'agent_OOz5189g7WffRmclq0E2q',
      name: 'Сценарий видео',
      description: 'Создание сценариев для видеоуроков и обучающего контента',
      icon: '🎬',
    },
    {
      id: 'agent_76sQfuZcgnTskLMTQ5fdb',
      name: 'Текст урока',
      description: 'Написание текстовых материалов для уроков и курсов',
      icon: '📝',
    },
    {
      id: 'agent_mK4EZMGt07OXfCtRBEUfH',
      name: 'Тесты/Квизы',
      description: 'Создание тестов, квизов и заданий для проверки знаний',
      icon: '❓',
    },
  ];

  const handleAgentSelect = (agentId: string): void => {
    // Track predefined agent selection
    reachGoal('predefined-agent-choice');

    // Create new conversation with the selected agent
    newConversation({
      template: {
        agent_id: agentId,
        endpoint: EModelEndpoint.agents,
      },
      buildDefault: true,
    });
  };

  const handleNewChatWithoutAgent = (): void => {
    // Navigate to regular new chat
    navigate('/c/new');
  };

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center" aria-live="polite" role="status">
        <Spinner className="text-text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="w-full max-w-4xl p-4 md:p-8">
        <div className="mb-4 text-center md:mb-8">
          <h1 className="mb-2 text-xl font-bold text-text-primary md:mb-4 md:text-3xl">
            {localize('com_ui_choose_agent')}
          </h1>
          <p className="text-sm text-text-secondary md:text-lg">
            {localize('com_ui_agent_selector_description')}
          </p>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-2 md:mb-8 md:grid-cols-3 md:gap-4">
          {availableAgents.map((agent) => (
            <button
              key={agent.id}
              onClick={() => handleAgentSelect(agent.id)}
              className="hover:border-border-strong group relative flex flex-col items-center rounded-lg border border-border-medium bg-surface-primary p-2 transition-all duration-300 hover:scale-105 hover:bg-surface-secondary hover:shadow-lg md:rounded-xl md:p-4"
            >
              <div className="mb-1 flex h-8 w-8 items-center justify-center rounded-full bg-surface-tertiary transition-transform duration-300 group-hover:scale-110 md:mb-3 md:h-12 md:w-12">
                <span className="text-lg md:text-2xl">{agent.icon}</span>
              </div>
              <h3 className="mb-1 text-center text-sm font-semibold text-text-primary md:mb-2 md:text-lg">
                {agent.name}
              </h3>
              <p className="text-center text-xs leading-relaxed text-text-secondary">
                {agent.description}
              </p>
            </button>
          ))}
        </div>

        <div className="flex justify-center">
          <Button
            onClick={handleNewChatWithoutAgent}
            variant="outline"
            size="lg"
            className="px-8 py-3 text-base"
          >
            {localize('com_ui_continue_yourself')}
          </Button>
        </div>
      </div>
    </div>
  );
}
