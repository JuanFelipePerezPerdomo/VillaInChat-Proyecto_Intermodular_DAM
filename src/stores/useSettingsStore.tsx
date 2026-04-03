import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { DEFAULT_SETTINGS, type Settings, type ThemeMode } from "../types";

interface SettingState extends Settings {
    setTheme: (theme: ThemeMode) => void,
    setWelcomeShown: (shown: boolean) => void,
    reset: () => void,
    _hasHydrated: boolean,
    setHasHydrated: (state: boolean) => void,
}

const getStorage = () => {
    if (Platform.OS === 'web') {
        return {
            getItem: async (name: string) => {
                const value = localStorage.getItem(name);
                return value;
            },
            setItem: async (name: string, value: string) => {
                localStorage.setItem(name, value);
            },
            removeItem: async (name: string) => {
                localStorage.removeItem(name);
            },
        };
    }
    return AsyncStorage;
};

export const useSettingsStore = create<SettingState>()(
    persist(
        (set) => ({
            ...DEFAULT_SETTINGS,
            _hasHydrated: false,

            setHasHydrated: (state) => set({ _hasHydrated: state }),

            setTheme: (theme) => set({ theme }),

            setWelcomeShown: (shown) => set({ welcomeShown: shown }),

            reset: () => set(DEFAULT_SETTINGS),
        }),
        {
            name: "setting-storage",
            storage: createJSONStorage(() => getStorage()),
            partialize: (state) => ({
                theme: state.theme,
                welcomeShown: state.welcomeShown,
            }),
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true);
            },
        }
    )
);