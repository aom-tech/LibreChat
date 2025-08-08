import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { EModelEndpoint } from 'librechat-data-provider';
import { useNewConvo, useLocalize } from '~/hooks';
import { useYandexMetrica } from '~/hooks/useYandexMetrica';
import { useListAgentsQuery, useGetStartupConfig } from '~/data-provider';
import { processAgentOption } from '~/utils';
import { Button, Spinner } from '@librechat/client';
import useAuthRedirect from './useAuthRedirect';

export default function AgentSelectRoute(): JSX.Element | null {
  const navigate = useNavigate();
  const localize = useLocalize();
  const { newConversation } = useNewConvo();
  const { isAuthenticated } = useAuthRedirect();
  const { reachGoal } = useYandexMetrica();

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

  if (!isAuthenticated || isLoading) {
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
          {agents.length > 0 ? (
            agents.map((agent) => (
              <button
                key={agent.id}
                onClick={() => handleAgentSelect(agent.id)}
                className="hover:border-border-strong group relative flex flex-col items-center rounded-lg border border-border-medium bg-surface-primary p-2 transition-all duration-300 hover:scale-105 hover:bg-surface-secondary hover:shadow-lg md:rounded-xl md:p-4"
              >
                <div className="mb-1 flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-surface-tertiary transition-transform duration-300 group-hover:scale-110 md:mb-3 md:h-12 md:w-12">
                  {agent.avatar?.filepath ? (
                    <img
                      src={agent.avatar.filepath}
                      alt={agent.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-lg md:text-2xl">🤖</span>
                  )}
                </div>
                <h3 className="mb-1 text-center text-sm font-semibold text-text-primary md:mb-2 md:text-lg">
                  {agent.name}
                </h3>
                <p className="text-center text-xs leading-relaxed text-text-secondary">
                  {agent.description || 'AI Assistant'}
                </p>
              </button>
            ))
          ) : (
            <div className="col-span-full flex items-center justify-center py-8">
              <p className="text-text-secondary">{localize('com_ui_no_public_agents_available')}</p>
            </div>
          )}
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
