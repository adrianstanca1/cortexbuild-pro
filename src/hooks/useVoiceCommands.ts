import { useCallback, useEffect, useRef } from 'react';
import { useVoice, VoiceLanguage, VoiceCommand } from './useVoice';

export interface NavigationCommand extends VoiceCommand {
  route: string;
  keywords: string[];
}

export interface VoiceCommandsConfig {
  commands?: VoiceCommand[];
  navigationCommands?: NavigationCommand[];
  onUnknownCommand?: (transcript: string) => void;
  language?: VoiceLanguage;
}

// Default navigation commands
const defaultNavigationCommands: NavigationCommand[] = [
  {
    command: 'go to dashboard',
    route: '/dashboard',
    keywords: ['dashboard', 'home', 'main'],
    action: () => {},
    description: 'Navigate to dashboard'
  },
  {
    command: 'go to projects',
    route: '/projects',
    keywords: ['projects', 'project list', 'all projects'],
    action: () => {},
    description: 'Navigate to projects'
  },
  {
    command: 'go to companies',
    route: '/companies',
    keywords: ['companies', 'company list', 'clients'],
    action: () => {},
    description: 'Navigate to companies'
  },
  {
    command: 'go to team',
    route: '/team',
    keywords: ['team', 'members', 'staff'],
    action: () => {},
    description: 'Navigate to team'
  },
  {
    command: 'go to calendar',
    route: '/calendar',
    keywords: ['calendar', 'schedule', 'events'],
    action: () => {},
    description: 'Navigate to calendar'
  },
  {
    command: 'go to reports',
    route: '/reports',
    keywords: ['reports', 'analytics', 'statistics'],
    action: () => {},
    description: 'Navigate to reports'
  },
  {
    command: 'go to settings',
    route: '/settings',
    keywords: ['settings', 'preferences', 'configuration'],
    action: () => {},
    description: 'Navigate to settings'
  },
  {
    command: 'go to profile',
    route: '/profile',
    keywords: ['profile', 'my account', 'user settings'],
    action: () => {},
    description: 'Navigate to profile'
  },
  {
    command: 'go to notifications',
    route: '/notifications',
    keywords: ['notifications', 'alerts', 'messages'],
    action: () => {},
    description: 'Navigate to notifications'
  },
  {
    command: 'go to search',
    route: '/search',
    keywords: ['search', 'find', 'lookup'],
    action: () => {},
    description: 'Navigate to search'
  }
];

// Default action commands
const defaultActionCommands: VoiceCommand[] = [
  {
    command: 'create new project',
    action: () => {},
    description: 'Create a new project'
  },
  {
    command: 'create new company',
    action: () => {},
    description: 'Create a new company'
  },
  {
    command: 'add new task',
    action: () => {},
    description: 'Add a new task'
  },
  {
    command: 'refresh page',
    action: () => window.location.reload(),
    description: 'Refresh the current page'
  },
  {
    command: 'go back',
    action: () => window.history.back(),
    description: 'Go back to previous page'
  },
  {
    command: 'scroll down',
    action: () => window.scrollBy({ top: 500, behavior: 'smooth' }),
    description: 'Scroll down the page'
  },
  {
    command: 'scroll up',
    action: () => window.scrollBy({ top: -500, behavior: 'smooth' }),
    description: 'Scroll up the page'
  },
  {
    command: 'scroll to top',
    action: () => window.scrollTo({ top: 0, behavior: 'smooth' }),
    description: 'Scroll to top of page'
  },
  {
    command: 'scroll to bottom',
    action: () => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }),
    description: 'Scroll to bottom of page'
  },
  {
    command: 'open help',
    action: () => {},
    description: 'Open help documentation'
  },
  {
    command: 'toggle dark mode',
    action: () => {
      document.documentElement.classList.toggle('dark');
    },
    description: 'Toggle dark mode'
  },
  {
    command: 'log out',
    action: () => {},
    description: 'Log out of the application'
  }
];

export function useVoiceCommands(config: VoiceCommandsConfig = {}) {
  const {
    commands = [],
    navigationCommands = [],
    onUnknownCommand,
    language = 'en-US'
  } = config;

  const navigateRef = useRef<((route: string) => void) | null>(null);
  const allCommandsRef = useRef<VoiceCommand[]>([]);
  const allNavCommandsRef = useRef<NavigationCommand[]>([]);

  // Combine default and custom commands
  useEffect(() => {
    allCommandsRef.current = [...defaultActionCommands, ...commands];
    allNavCommandsRef.current = [...defaultNavigationCommands, ...navigationCommands];
  }, [commands, navigationCommands]);

  const processCommand = useCallback((transcript: string) => {
    const normalizedTranscript = transcript.toLowerCase().trim();
    
    // Check navigation commands first
    for (const navCmd of allNavCommandsRef.current) {
      if (navCmd.keywords.some(keyword => normalizedTranscript.includes(keyword))) {
        navCmd.action();
        if (navigateRef.current) {
          navigateRef.current(navCmd.route);
        }
        return { type: 'navigation', command: navCmd, matched: true };
      }
    }

    // Check action commands
    for (const cmd of allCommandsRef.current) {
      if (normalizedTranscript.includes(cmd.command.toLowerCase())) {
        cmd.action();
        return { type: 'action', command: cmd, matched: true };
      }
    }

    // Unknown command
    onUnknownCommand?.(transcript);
    return { type: 'unknown', transcript, matched: false };
  }, [onUnknownCommand]);

  const voice = useVoice({
    language,
    continuous: true,
    interimResults: true,
    onResult: (transcript, isFinal) => {
      if (isFinal) {
        processCommand(transcript);
      }
    }
  });

  const setNavigator = useCallback((navigate: (route: string) => void) => {
    navigateRef.current = navigate;
  }, []);

  const registerCommand = useCallback((command: VoiceCommand) => {
    allCommandsRef.current.push(command);
  }, []);

  const registerNavigationCommand = useCallback((command: NavigationCommand) => {
    allNavCommandsRef.current.push(command);
  }, []);

  const unregisterCommand = useCallback((commandText: string) => {
    allCommandsRef.current = allCommandsRef.current.filter(
      cmd => cmd.command !== commandText
    );
  }, []);

  return {
    ...voice,
    setNavigator,
    registerCommand,
    registerNavigationCommand,
    unregisterCommand,
    processCommand,
    availableCommands: [...allCommandsRef.current, ...allNavCommandsRef.current]
  };
}

export default useVoiceCommands;
