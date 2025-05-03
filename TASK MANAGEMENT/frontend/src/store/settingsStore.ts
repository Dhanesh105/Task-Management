import { create } from 'zustand';
import { persist, PersistOptions } from 'zustand/middleware';

export interface Settings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: boolean;
  defaultView: 'tasks' | 'calendar' | 'statistics';
  dateFormat: string;
  timeFormat: '12h' | '24h';
  startDayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
}

interface SettingsState {
  settings: Settings;
  isLoading: boolean;
  error: string | null;
  fetchSettings: () => Promise<void>;
  updateSettings: (newSettings: Partial<Settings>) => Promise<void>;
  setTheme: (theme: Settings['theme']) => Promise<void>;
  toggleNotifications: () => Promise<void>;
}

const defaultSettings: Settings = {
  theme: 'system',
  language: 'en',
  notifications: true,
  defaultView: 'tasks',
  dateFormat: 'MM/DD/YYYY',
  timeFormat: '12h',
  startDayOfWeek: 0,
};

const persistConfig: PersistOptions<SettingsState> = {
  name: 'pearl-settings',
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      settings: defaultSettings,
      isLoading: false,
      error: null,
      
      fetchSettings: async () => {
        try {
          set({ isLoading: true, error: null });
          console.log('Attempting to fetch settings from backend...');
          const response = await fetch('http://localhost:5000/settings');
          
          console.log('Response status:', response.status);
          
          if (!response.ok) {
            throw new Error(`Failed to fetch settings: ${response.status} ${response.statusText}`);
          }
          
          const data = await response.json();
          console.log('Settings data received:', data);
          
          // Transform backend data to frontend format
          const settings: Settings = {
            theme: data.theme || defaultSettings.theme,
            language: data.language || defaultSettings.language,
            notifications: data.notifications === 1,
            defaultView: (data.default_view as Settings['defaultView']) || defaultSettings.defaultView,
            dateFormat: data.date_format || defaultSettings.dateFormat,
            timeFormat: (data.time_format as Settings['timeFormat']) || defaultSettings.timeFormat,
            startDayOfWeek: data.start_day_of_week ?? defaultSettings.startDayOfWeek,
          };
          
          set({ settings, isLoading: false });
        } catch (error) {
          console.error('Error fetching settings:', error);
          set({ 
            error: error instanceof Error ? error.message : 'An unknown error occurred', 
            isLoading: false 
          });
        }
      },
      
      updateSettings: async (newSettings) => {
        try {
          set({ isLoading: true, error: null });
          const currentSettings = get().settings;
          const updatedSettings = { ...currentSettings, ...newSettings };
          
          // Transform frontend data to backend format
          const backendData = {
            theme: updatedSettings.theme,
            language: updatedSettings.language,
            notifications: updatedSettings.notifications ? 1 : 0,
            default_view: updatedSettings.defaultView,
            date_format: updatedSettings.dateFormat,
            time_format: updatedSettings.timeFormat,
            start_day_of_week: updatedSettings.startDayOfWeek,
          };
          
          const response = await fetch('http://localhost:5000/settings', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(backendData),
          });
          
          if (!response.ok) {
            throw new Error('Failed to update settings');
          }
          
          // Get the updated settings from the backend response
          const data = await response.json();
          
          // Transform backend data to frontend format
          const backendSettings: Settings = {
            theme: data.theme || defaultSettings.theme,
            language: data.language || defaultSettings.language,
            notifications: data.notifications === 1,
            defaultView: (data.default_view as Settings['defaultView']) || defaultSettings.defaultView,
            dateFormat: data.date_format || defaultSettings.dateFormat,
            timeFormat: (data.time_format as Settings['timeFormat']) || defaultSettings.timeFormat,
            startDayOfWeek: data.start_day_of_week ?? defaultSettings.startDayOfWeek,
          };
          
          set({ settings: backendSettings, isLoading: false });
        } catch (error) {
          console.error('Error updating settings:', error);
          set({ 
            error: error instanceof Error ? error.message : 'An unknown error occurred', 
            isLoading: false 
          });
          throw error; // Re-throw to allow component to handle the error
        }
      },
      
      setTheme: async (theme) => {
        await get().updateSettings({ theme });
      },
      
      toggleNotifications: async () => {
        const currentSettings = get().settings;
        await get().updateSettings({ notifications: !currentSettings.notifications });
      },
    }),
    persistConfig
  )
);