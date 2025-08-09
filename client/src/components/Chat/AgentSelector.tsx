import { useCallback } from 'react';
import { EModelEndpoint } from 'librechat-data-provider';
import { useNewConvo, useLocalize } from '~/hooks';
import { useListAgentsQuery, useGetStartupConfig } from '~/data-provider';
import { processAgentOption } from '~/utils';
import { Button, Spinner } from '@librechat/client';
import { useChatContext } from '~/Providers';

interface AgentSelectorProps {
  onAgentSelect?: (agentId: string) => void;
}

export default function AgentSelector({ onAgentSelect }: AgentSelectorProps) {
  const localize = useLocalize();
  const { newConversation } = useNewConvo();
  const { conversation } = useChatContext();

  const { data: startupConfig } = useGetStartupConfig();
  const { data: agents = [], isLoading } = useListAgentsQuery(undefined, {
    select: (res) =>
      res.data
        .map((agent) =>
          processAgentOption({
            agent: {
              ...agent,
              name: agent.name || agent.id,
            },
            instanceProjectId: startupConfig?.instanceProjectId,
          }),
        )
        .filter((agent) => agent.isGlobal || agent.icon),
  });

  const handleAgentSelect = useCallback(
    (agentId: string) => {
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

  if (isLoading) {
    return (
      <div className="mt-8 flex w-full max-w-4xl items-center justify-center">
        <Spinner className="text-text-primary" />
      </div>
    );
  }

  return (
    <div className="mb-8 w-full max-w-4xl" data-tour="agent-selector">
      <div className="mb-6 grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-4">
        {agents.length > 0 ? (
          agents.map((agent) => (
            <button
              key={agent.id}
              onClick={() => handleAgentSelect(agent.id)}
              className={`hover:border-border-strong group relative flex flex-col items-center rounded-lg border bg-surface-primary p-2 transition-all duration-300 hover:scale-105 hover:bg-surface-secondary hover:shadow-lg md:rounded-xl md:p-4 ${
                conversation?.agent_id === agent.id
                  ? 'border-2 border-blue-500'
                  : 'border border-border-medium'
              }`}
            >
              <div className="mb-1 flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-surface-tertiary transition-transform duration-300 group-hover:scale-110 md:mb-3 md:h-12 md:w-12">
                {agent.avatar?.filepath ? (
                  <img
                    src={agent.avatar.filepath}
                    alt={agent.name || ''}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-lg md:text-2xl">🤖</span>
                )}
              </div>
              <h3 className="mb-1 text-center text-sm font-semibold text-text-primary md:mb-2 md:text-base">
                {agent.name}
              </h3>
              <p className="text-center text-xs leading-relaxed text-text-secondary">
                {agent.description || 'AI Assistant'}
              </p>
            </button>
          ))
        ) : (
          <div className="col-span-full flex items-center justify-center py-8">
            {/* eslint-disable-next-line i18next/no-literal-string */}
            <p className="text-text-secondary">No agents available</p>
          </div>
        )}
      </div>
      {/* <div className="flex justify-center">или просто начните писать</div> */}
    </div>
  );
}
