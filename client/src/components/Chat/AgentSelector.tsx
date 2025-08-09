import { useState, useCallback, useMemo } from 'react';
import { EModelEndpoint } from 'librechat-data-provider';
import { useNewConvo, useLocalize } from '~/hooks';
import { Button } from '@librechat/client';

interface AgentSelectorProps {
  onAgentSelect?: (agentId: string) => void;
}

export default function AgentSelector({ onAgentSelect }: AgentSelectorProps) {
  const localize = useLocalize();
  const { newConversation } = useNewConvo();
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  // Static list of predefined agents
  const availableAgents = useMemo(
    () => [
      {
        id: 'agent_bNZpHfG2lSdsrDinene0M',
        name: 'Маркетолог',
        description: 'Специалист по маркетингу, рекламе и продвижению продуктов',
        icon: '📊',
      },
      {
        id: 'slide-designer',
        name: 'СлайдДизайнер',
        description: 'Создание презентаций и дизайн слайдов',
        icon: '🎨',
      },
      {
        id: 'copywriter',
        name: 'Текстовик',
        description: 'Копирайтер и редактор текстового контента',
        icon: '✍️',
      },
      {
        id: 'producer',
        name: 'Продюсер',
        description: 'Управление проектами и координация команды',
        icon: '🎬',
      },
    ],
    [],
  );

  const handleAgentSelect = useCallback(
    (agentId: string) => {
      setSelectedAgentId(agentId);

      // Create new conversation with the selected agent
      newConversation({
        template: {
          agent_id: agentId,
          endpoint: EModelEndpoint.agents,
        },
        buildDefault: true,
      });

      // Call optional callback
      if (onAgentSelect) {
        onAgentSelect(agentId);
      }
    },
    [newConversation, onAgentSelect],
  );

  const handleNewChatWithoutAgent = useCallback(() => {
    newConversation({
      buildDefault: true,
    });
  }, [newConversation]);

  // Always show static agents
  if (!availableAgents.length) {
    return null;
  }

  return (
    <div className="mt-8 w-full max-w-4xl">
      <div className="mb-6 text-center">
        <h2 className="mb-2 text-lg font-semibold text-text-primary">
          {localize('com_ui_choose_agent')}
        </h2>
        <p className="text-sm text-text-secondary">
          {localize('com_ui_agent_selector_description')}
        </p>
      </div>
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3">
        {availableAgents.map((agent) => {
          return (
            <button
              key={agent.id}
              onClick={() => handleAgentSelect(agent.id)}
              className={`hover:border-border-strong relative flex flex-col items-center rounded-xl border p-4 transition-all duration-200 hover:bg-surface-secondary ${
                selectedAgentId === agent.id
                  ? 'border-border-strong bg-surface-secondary shadow-md'
                  : 'border-border-medium bg-surface-primary'
              } `}
            >
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-surface-tertiary">
                <span className="text-2xl">{agent.icon}</span>
              </div>
              <h3 className="mb-1 line-clamp-2 text-center text-sm font-medium text-text-primary">
                {agent.name}
              </h3>
              {agent.description && (
                <p className="line-clamp-2 text-center text-xs text-text-secondary">
                  {agent.description}
                </p>
              )}
            </button>
          );
        })}
      </div>
      <div className="flex justify-center">
        <Button onClick={handleNewChatWithoutAgent} variant="outline" className="px-6 py-2">
          {localize('com_ui_start_new_chat')}
        </Button>
      </div>
    </div>
  );
}
