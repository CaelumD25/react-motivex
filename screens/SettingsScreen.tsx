import React, { useEffect, useState } from "react";
import { View, Text, Switch, Button } from "react-native";
import styles from "../Styles";
import { useSettings } from "../providers/SettingsProvider";
import { useBluetooth } from "../providers/BluetoothProvider";
import Popup from "../components/Popup";
import { Device } from "react-native-ble-plx";

const SettingsScreen = () => {
    const {
        scannedDevices,
        discoverDevices,
        stopDiscoveringDevices,
        selectDevice,
        currentDevice,
        connectToDevice,
        disconnectFromDevice,
    } = useBluetooth();

    const {
        settings,
        setEffortBarEnabled,
        setDistanceEnabled,
        setSpeedometerEnabled,
        setDifficulty,
        setPlaybackSpeedModifier,
    } = useSettings();

    const [popupVisible, setPopupVisible] = useState(false);
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

    const handleSelectDevice = async (device: Device) => {
        // Add extensive logging
        console.log("Selected Device:", JSON.stringify(device, null, 2));
        console.log("Device ID:", device.id);
        console.log("Device Name:", device.name);

        try {
            // Add null checks
            if (!device || !device.id) {
                console.error("Invalid device selected");
                return;
            }

            stopDiscoveringDevices();
            const connected = await connectToDevice(device.id);

            if (!connected) {
                console.error("Failed to connect to device");
            }
        } catch (error) {
            console.error("Error connecting to device:", error);
        }
    };

    useEffect(() => {
        // If devices are found while popup is open, ensure it stays open
        if (scannedDevices.length > 0) {
            setPopupVisible(true);
        }
    }, [scannedDevices]);

    return (
        <View style={styles.settingsContainer}>
            <Popup
                visible={popupVisible}
                onClose={() => {
                    setPopupVisible(false);
                    stopDiscoveringDevices();
                }}
                devices={scannedDevices}
                onSelectDevice={handleSelectDevice}
            />
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
                    onPress={() => {
                        setPopupVisible((visible) => !visible);
                        discoverDevices();
                    }}
                />
                <Button
                    title="Stop Scanning"
                    onPress={() => stopDiscoveringDevices()}
                />
                <Button
                    title="Start watching sensor"
                    onPress={() => console.log("Error")}
                />
                <Button
                    title="Disconnect"
                    onPress={() => disconnectFromDevice(currentDevice.id)}
                />
            </View>
        </View>
    );
};

export default SettingsScreen;
