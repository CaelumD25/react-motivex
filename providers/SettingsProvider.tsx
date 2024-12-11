import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface settings_t {
    distanceEnabled: boolean;
    totalDistance: number;
    effortBarEnabled: boolean;
    speedometerEnabled: boolean;
    difficulty: string;
    playbackSpeedModifier: number;
}

const DEFAULT_SETTINGS: settings_t = {
    distanceEnabled: true,
    totalDistance: 0,
    effortBarEnabled: true,
    speedometerEnabled: true,
    difficulty: "Intermediate",
    playbackSpeedModifier: 1,
};

interface SettingsContextType {
    settings: settings_t;
    setSettings: React.Dispatch<React.SetStateAction<settings_t>>;
    isLoading: boolean;
    updateSetting: (
        key: string,
        value: boolean | string | number,
    ) => Promise<void>;
    setDistanceEnabled: (value: boolean) => Promise<void>;
    setTotalDistance: (value: number) => Promise<void>;
    setEffortBarEnabled: (value: boolean) => Promise<void>;
    setSpeedometerEnabled: (value: boolean) => Promise<void>;
    setDifficulty: (value: string) => Promise<void>;
    setPlaybackSpeedModifier: (value: number) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(
    undefined,
);

export const SettingsProvider = ({ children }) => {
    const [settings, setSettings] = useState(DEFAULT_SETTINGS);
    const [isLoading, setIsLoading] = useState(true);

    const _distanceEnabledKey: string = "distanceEnabled";
    const _totalDistanceKey: string = "totalDistance";
    const _effortBarEnabledKey: string = "effortBarEnabled";
    const _speedometerEnabledKey: string = "speedometerEnabled";
    const _difficultyKey: string = "difficulty";
    const _playbackSpeedModifier: string = "playbackSpeedModifier";

    useEffect(() => {
        const initializeSettings = async () => {
            try {
                // Iterate through default settings and load from AsyncStorage
                const loadedSettings: settings_t = DEFAULT_SETTINGS;

                for (const [key, _defaultValue] of Object.entries(
                    DEFAULT_SETTINGS,
                )) {
                    const storedValue = await AsyncStorage.getItem(key);
                    if (storedValue === null) {
                    } else if (
                        key === _distanceEnabledKey ||
                        key === _effortBarEnabledKey ||
                        key === _speedometerEnabledKey
                    ) {
                        loadedSettings[key] = storedValue === "true";
                    } else if (
                        key === _totalDistanceKey ||
                        key === _playbackSpeedModifier
                    ) {
                        loadedSettings[key] = parseFloat(storedValue);
                    } else if (key === _difficultyKey) {
                        loadedSettings[key] = storedValue;
                    } else {
                        console.error(`Unexpected key in settings: ${key}`);
                    }
                }

                setSettings(loadedSettings);
                setIsLoading(false);
            } catch (error) {
                console.error("Failed to initialize settings", error);
                setIsLoading(false);
            }
        };

        initializeSettings().then((_) => console.debug("Loaded Settings"));
    }, []);

    // Generic method to update any setting
    const updateSetting = async (
        key: string,
        value: boolean | string | number,
    ) => {
        try {
            // Update AsyncStorage
            await AsyncStorage.setItem(key, value.toString());

            // Update local state
            setSettings((prev) => ({
                ...prev,
                [key]: value,
            }));
        } catch (error) {
            console.error(`Failed to update setting ${key}`, error);
        }
    };

    // Specific methods for each setting
    const methods = {
        setDistanceEnabled: (value: boolean) =>
            updateSetting("distanceEnabled", value),
        setTotalDistance: (value: number) =>
            updateSetting("totalDistance", value),
        setEffortBarEnabled: (value: boolean) =>
            updateSetting("effortBarEnabled", value),
        setSpeedometerEnabled: (value: boolean) =>
            updateSetting("speedometerEnabled", value),
        setDifficulty: (value: string) => updateSetting("difficulty", value),
        setPlaybackSpeedModifier: (value: number) =>
            updateSetting("playbackSpeedModifier", value),
    };

    return (
        <SettingsContext.Provider
            value={{
                settings,
                setSettings,
                ...methods,
                isLoading,
                updateSetting,
            }}
        >
            {children}
        </SettingsContext.Provider>
    );
};

// Custom hook to use settings context
export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error("useSettings must be used within a SettingsProvider");
    }
    return context;
};
