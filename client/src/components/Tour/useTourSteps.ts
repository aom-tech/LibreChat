import { useCallback } from 'react';
import type { StepType } from '@reactour/tour';
import { useTourContext } from './TourProvider';

export const useTourSteps = () => {
  const { startTour } = useTourContext();

  const startAgentSelectionTour = useCallback(() => {
    const steps: StepType[] = [
      {
        selector: '[data-tour="agent-select"]',
        content:
          'Choose an AI agent that best fits your task. Each agent is specialized for different purposes like coding, writing, or research.',
      },
      {
        selector: '[data-tour="agent-option"]',
        content:
          "Click on any agent to select it. You can see the agent's name, description, and avatar.",
      },
      {
        selector: '[data-tour="new-chat"]',
        content: 'Or click here to start a conversation without selecting a specific agent.',
      },
    ];
    startTour(steps);
  }, [startTour]);

  const startMainAppTour = useCallback(() => {
    const steps: StepType[] = [
      {
        selector: '[data-tour="sidebar-toggle"]',
        content:
          'Click here to toggle the sidebar and access your chat history, settings, and other features.',
      },
      {
        selector: '[data-tour="model-selector"]',
        content:
          'Select different AI models or agents for your conversations. Each has unique capabilities.',
      },
      {
        selector: '[data-tour="chat-input"]',
        content:
          'Type your messages here. You can ask questions, request help with tasks, or have conversations.',
      },
      {
        selector: '[data-tour="send-button"]',
        content: 'Click here or press Enter to send your message to the AI.',
      },
    ];
    startTour(steps);
  }, [startTour]);

  const startAgentTour = useCallback(() => {
    const steps: StepType[] = [
      {
        selector: '[data-tour="agent-panel"]',
        content: 'Configure your AI agent settings, including name, description, and instructions.',
      },
      {
        selector: '[data-tour="agent-capabilities"]',
        content:
          'Enable or disable specific capabilities like web search, code execution, and file analysis.',
      },
      {
        selector: '[data-tour="agent-save"]',
        content: 'Save your agent configuration to use it in future conversations.',
      },
    ];
    startTour(steps);
  }, [startTour]);

  return {
    startAgentSelectionTour,
    startMainAppTour,
    startAgentTour,
  };
};

export default useTourSteps;
