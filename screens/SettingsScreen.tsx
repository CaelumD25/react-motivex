import React from "react";
import { View, Text, Switch, Button } from "react-native";
import styles from "../Styles";
import { useSettings } from "../providers/SettingsProvider";
import { useBluetooth } from "../providers/BluetoothProvider";

const SettingsScreen = () => {
    const {
        startDeviceDiscovery,
        stopDeviceDiscovery,
        exploreDevice,
        monitorMovementSensor,
        disconnectFromCurrentDevices,
    } = useBluetooth();

    const {
        settings,
        setEffortBarEnabled,
        setDistanceEnabled,
        setSpeedometerEnabled,
        setDifficulty,
        setPlaybackSpeedModifier,
    } = useSettings();

    const updateEffortBar = async (value: boolean) => {
        await setEffortBarEnabled(value);
    };

    const updateDistanceEnabled = async (value: boolean) => {
        await setDistanceEnabled(value);
    };
    const updateSpeedometerEnabled = async (value: boolean) => {
        await setSpeedometerEnabled(value);
    };
    const updateDifficulty = async () => {
        switch (settings.difficulty) {
            case "novice":
                await setDifficulty("intermediate");
                break;
            case "intermediate":
                await setDifficulty("advanced");
                break;
            case "advanced":
                await setDifficulty("novice");
                break;
            default:
                console.error("Invalid difficulty");
        }
    };

    const updateDefaultPlaybackSpeed = async () => {
        await setPlaybackSpeedModifier(
            settings.playbackSpeedModifier === 1 ? 2 : 1,
        );
    };

    return (
        <View style={styles.settingsContainer}>
            <Text style={styles.title}>Settings</Text>

            <View style={styles.settingsOption}>
                <Text style={styles.textBox}>Effort Bar Enabled:</Text>
                <Switch
                    value={settings.effortBarEnabled}
                    onValueChange={updateEffortBar}
                />
            </View>

            <View style={styles.settingsOption}>
                <Text style={styles.textBox}>Distance Enabled:</Text>
                <Switch
                    value={settings.distanceEnabled}
                    onValueChange={updateDistanceEnabled}
                />
            </View>

            <View style={styles.settingsOption}>
                <Text style={styles.textBox}>Speedometer Enabled:</Text>
                <Switch
                    value={settings.speedometerEnabled}
                    onValueChange={updateSpeedometerEnabled}
                />
            </View>

            <View style={styles.settingsOption}>
                <Text style={styles.textBox}>Difficulty Setting:</Text>
                <Button
                    title={`Difficulty: ${settings.difficulty.charAt(0).toUpperCase() + settings.difficulty.slice(1)}`}
                    onPress={updateDifficulty}
                />
            </View>

            <View style={styles.settingsOption}>
                <Text style={styles.textBox}>Default Playback Speed:</Text>
                <Button
                    title={`Playback: ${settings.playbackSpeedModifier}x`}
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
            <View
                style={{ flexDirection: "row", flex: 3, alignItems: "center" }}
            >
                <Button
                    title="Start Scanning"
                    onPress={() => startDeviceDiscovery()}
                />
                <Button
                    title="Stop Scanning"
                    onPress={() => stopDeviceDiscovery()}
                />
                <Button title="View Services" onPress={() => exploreDevice()} />
                <Button
                    title="Start watching sensor"
                    onPress={() => monitorMovementSensor()}
                />
                <Button
                    title="Disconnect"
                    onPress={() => disconnectFromCurrentDevices()}
                />
            </View>
        </View>
    );
};

export default SettingsScreen;
