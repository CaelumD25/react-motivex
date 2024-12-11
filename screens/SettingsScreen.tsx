import React, { useEffect, useState } from "react";
import { View, Text, Switch, Button, StyleSheet } from "react-native";
import { Picker } from "@react-native-picker/picker";
import styles from "../Styles";
import { SettingsHandler } from "../util/SettingsHandler";

const SettingsScreen = ({ navigation, route }) => {
    const settings = new SettingsHandler();
    const [effortBar, setEffortBar] = useState(false);
    const [distance, setDistance] = useState(false);
    const [speedometer, setSpeedometer] = useState(false);
    const [difficulty, setDifficulty] = useState("novice");
    const [playbackSpeed, setPlaybackSpeed] = useState(1);

    useEffect(() => {
        const initializeSettings = async () => {
            setEffortBar(await settings.getEffortBarEnabled());
            setDistance(await settings.getDistanceEnabled());
            setSpeedometer(await settings.getSpeedometerEnabled());
            setDifficulty(await settings.getDifficulty());
            setPlaybackSpeed(await settings.getPlaybackSpeedModifier());
        };
        initializeSettings();
    }, []);

    const updateEffortBar = async (value: boolean) => {
        await settings.setEffortBarEnabled(value);
        setEffortBar(value);
    };

    const updateDistanceEnabled = async (value: boolean) => {
        await settings.setDistanceEnabled(value);
        setDistance(value);
    };
    const updateSpeedometerEnabled = async (value: boolean) => {
        await settings.setSpeedometerEnabled(value);
        setSpeedometer(value);
    };
    const updateDifficulty = async () => {
        if (difficulty === "novice") {
            await settings.setDifficulty("intermediate");
            setDifficulty("intermediate");
        } else if (difficulty === "intermediate") {
            await settings.setDifficulty("advanced");
            setDifficulty("advanced");
        } else {
            await settings.setDifficulty("novice");
            setDifficulty("novice");
        }
    };

    const updateDefaultPlaybackSpeed = async (value: number) => {
        setPlaybackSpeed(playbackSpeed === 1 ? 2 : 1);
        await settings.setPlaybackSpeedModifier(playbackSpeed === 1 ? 2 : 1);
    };

    return (
        <View style={styles.settingsContainer}>
            <Text style={styles.title}>Settings</Text>

            <View style={styles.settingsOption}>
                <Text style={styles.textBox}>Effort Bar Enabled:</Text>
                <Switch value={effortBar} onValueChange={updateEffortBar} />
            </View>

            <View style={styles.settingsOption}>
                <Text style={styles.textBox}>Distance Enabled:</Text>
                <Switch
                    value={distance}
                    onValueChange={updateDistanceEnabled}
                />
            </View>

            <View style={styles.settingsOption}>
                <Text style={styles.textBox}>Speedometer Enabled:</Text>
                <Switch
                    value={speedometer}
                    onValueChange={updateSpeedometerEnabled}
                />
            </View>

            <View style={styles.settingsOption}>
                <Text style={styles.textBox}>Difficulty Setting:</Text>
                <Button
                    title={`Difficulty: ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}`}
                    onPress={updateDifficulty}
                />
            </View>

            <View style={styles.settingsOption}>
                <Text style={styles.textBox}>Default Playback Speed:</Text>
                <Button
                    title={`Playback: ${playbackSpeed}x`}
                    onPress={updateDefaultPlaybackSpeed}
                />
            </View>

            <View style={styles.field}>
                <Text style={styles.textBox}>Display Status:</Text>
                <Text style={styles.textBox}>Enabled</Text>
            </View>

            <View style={styles.field}>
                <Text style={styles.textBox}>Cadence Sensor:</Text>
                <Text style={styles.textBox}>Not Connected</Text>
            </View>

            <Button
                title="Pair Cadence Sensor"
                onPress={() => alert("Pairing cadence sensor...")}
            />
        </View>
    );
};

export default SettingsScreen;
