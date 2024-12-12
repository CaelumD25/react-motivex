import React, { createContext, useState, useContext, useEffect } from "react";
import { BleManager, Device } from "react-native-ble-plx";
import { Platform } from "react-native";
import { check, request, PERMISSIONS, RESULTS } from "react-native-permissions";

// Define UUIDs for services and characteristics
const CYCLING_SPEED_CADENCE_SERVICE = "00001816-0000-1000-8000-00805f9b34fb";
const BATTERY_SERVICE = "0000180f-0000-1000-8000-00805f9b34fb";
const CSC_MEASUREMENT_CHARACTERISTIC = "00002A5B-0000-1000-8000-00805f9b34fb";
const BATTERY_LEVEL_CHARACTERISTIC = "00002A19-0000-1000-8000-00805f9b34fb";

// Bluetooth Provider Context Interface
interface BluetoothContextType {
    isDiscovering: boolean;
    isDeviceConnected: boolean;
    batteryLevel: string;
    crankRevCount: number;
    pairingProgressInfo: string;
    startDeviceDiscovery: () => void;
    stopDeviceDiscovery: () => void;
    pairNewDevice: () => void;
}

// Create React Context
const BluetoothContext = createContext<BluetoothContextType | undefined>(
    undefined,
);

export const BluetoothProvider = ({ children }) => {
    const [bleManager] = useState(new BleManager());
    const [isDiscovering, setIsDiscovering] = useState(false);
    const [isDeviceConnected, setIsDeviceConnected] = useState(false);
    const [batteryLevel, setBatteryLevel] = useState("");
    const [crankRevCount, setCrankRevCount] = useState(0);
    const [pairingProgressInfo, setPairingProgressInfo] = useState("");
    const [currentDevice, setCurrentDevice] = useState<Device | null>(null);
    const [isPairing, setIsPairing] = useState(false);

    // Comprehensive Bluetooth Permissions Request
    const requestBluetoothPermissions = async () => {
        if (Platform.OS === "android") {
            try {
                // List of permissions to check and request
                const bluetoothPermissions = [
                    PERMISSIONS.ANDROID.BLUETOOTH_SCAN,
                    PERMISSIONS.ANDROID.BLUETOOTH_CONNECT,
                    PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
                ];

                // Check and request each permission
                const permissionResults = await Promise.all(
                    bluetoothPermissions.map(async (permission) => {
                        try {
                            // First check the current status
                            const checkResult = await check(permission);
                            console.log(
                                `Permission ${permission} current status:`,
                                checkResult,
                            );

                            // If not determined or denied, request the permission
                            if (
                                checkResult === RESULTS.DENIED ||
                                checkResult === RESULTS.BLOCKED
                            ) {
                                const requestResult = await request(permission);
                                console.log(
                                    `Permission ${permission} request result:`,
                                    requestResult,
                                );
                                return requestResult;
                            }
                            return checkResult;
                        } catch (err) {
                            console.error(
                                `Error checking/requesting ${permission}:`,
                                err,
                            );
                            return null;
                        }
                    }),
                );

                // Check if all critical permissions are granted
                const allGranted = permissionResults.every(
                    (result) => result === RESULTS.GRANTED,
                );

                console.log("All Bluetooth Permissions Granted:", allGranted);
                return allGranted;
            } catch (error) {
                console.error(
                    "Comprehensive Bluetooth Permission Error:",
                    error,
                );
                return false;
            }
        }
        return true;
    };

    // Usage in a component or effect
    const setupBluetooth = async () => {
        try {
            const permissionsGranted = await requestBluetoothPermissions();
            if (permissionsGranted) {
                // Proceed with Bluetooth initialization
                console.log("Bluetooth permissions successfully granted");
            } else {
                console.warn("Bluetooth permissions not fully granted");
                // Handle permission denial
                // Maybe show a dialog to the user explaining why permissions are needed
            }
        } catch (error) {
            console.error("Bluetooth setup error:", error);
        }
    };

    useEffect(() => {
        const initializeBluetooth = async () => {
            try {
                const hasPermissions = await requestBluetoothPermissions();
                if (!hasPermissions) {
                    console.warn("Bluetooth permissions not granted");
                }
            } catch (error) {
                console.error("Bluetooth initialization error:", error);
            }
        };

        initializeBluetooth();
    }, []);

    const exploreDevice = async (device) => {
        const services = await device.services();

        for (const service of services) {
            console.log("Service UUID:", service.uuid);

            const characteristics = await device.characteristicsForService(
                service.uuid,
            );

            for (const characteristic of characteristics) {
                console.log("- Characteristic UUID:", characteristic.uuid);
            }
        }
    };

    // Start Device Discovery
    const startDeviceDiscovery = async () => {
        const hasPermissions = await requestBluetoothPermissions();
        console.log(`Has Permissions: ${hasPermissions}`);
        if (!hasPermissions) {
            setPairingProgressInfo("Permission denied");
            return;
        }

        setIsDiscovering(true);
        setPairingProgressInfo("Scanning for devices...");

        bleManager.startDeviceScan(
            [CYCLING_SPEED_CADENCE_SERVICE],
            null,
            async (error, device) => {
                if (error) {
                    console.error("Scan error:", error);
                    setIsDiscovering(false);
                    setPairingProgressInfo("Error occurred");
                    return;
                }
                console.log(device);

                if (device && !isPairing) {
                    // Connection logic for non-pairing mode
                    if (device.name === "Your Cadence Sensor Name") {
                        await connectToDevice(device);
                    }
                } else if (device && isPairing) {
                    exploreDevice(device);
                    // Pairing logic
                    const services = await device.services();
                    /*if (services.includes(CYCLING_SPEED_CADENCE_SERVICE)) {
                        setPairingProgressInfo("Pairing Completed");
                        setIsPairing(false);
                        await connectToDevice(device);
                    }*/
                }
            },
        );
    };

    // Stop Device Discovery
    const stopDeviceDiscovery = () => {
        bleManager.stopDeviceScan();
        setIsDiscovering(false);
    };

    // Connect to Device
    const connectToDevice = async (device: Device) => {
        try {
            stopDeviceDiscovery();

            const connectedDevice = await bleManager.connectToDevice(device.id);
            await connectedDevice.discoverAllServicesAndCharacteristics();

            setCurrentDevice(connectedDevice);
            setIsDeviceConnected(true);
            setPairingProgressInfo("Device Connected");

            // Subscribe to Characteristics
            await subscribeToCharacteristics(connectedDevice);
        } catch (error) {
            console.error("Connection error:", error);
            setIsDeviceConnected(false);
            startDeviceDiscovery();
        }
    };

    // Subscribe to Characteristics
    const subscribeToCharacteristics = async (device: Device) => {
        try {
            // CSC Measurement Characteristic
            device.monitorCharacteristicForService(
                CYCLING_SPEED_CADENCE_SERVICE,
                CSC_MEASUREMENT_CHARACTERISTIC,
                (error, characteristic) => {
                    if (error) {
                        console.error("CSC Characteristic error:", error);
                        return;
                    }

                    if (characteristic?.value) {
                        // Parse Crank Revolution Count from characteristic
                        const rawValue = Buffer.from(
                            characteristic.value,
                            "base64",
                        );
                        const crankCount = rawValue.readUInt16LE(1); // Adjust based on exact byte positioning
                        setCrankRevCount(crankCount);
                    }
                },
            );

            // Battery Level Characteristic
            device.monitorCharacteristicForService(
                BATTERY_SERVICE,
                BATTERY_LEVEL_CHARACTERISTIC,
                (error, characteristic) => {
                    if (error) {
                        console.error("Battery Characteristic error:", error);
                        return;
                    }

                    if (characteristic?.value) {
                        const batteryLevelValue = Buffer.from(
                            characteristic.value,
                            "base64",
                        )[0];
                        setBatteryLevel(batteryLevelValue.toString());
                    }
                },
            );
        } catch (error) {
            console.error("Subscription error:", error);
        }
    };

    // Pair New Device
    const pairNewDevice = () => {
        setIsPairing(true);
        setPairingProgressInfo("Start pedaling to pair...");
        startDeviceDiscovery();
    };

    // Handle Disconnection
    useEffect(() => {
        const subscription = bleManager.onDeviceDisconnected(
            currentDevice?.id || "",
            (error, device) => {
                setIsDeviceConnected(false);
                setCurrentDevice(null);
                startDeviceDiscovery();
            },
        );

        return () => {
            subscription.remove();
            bleManager.destroy();
        };
    }, [currentDevice]);

    // Context Value
    const contextValue: BluetoothContextType = {
        isDiscovering,
        isDeviceConnected,
        batteryLevel,
        crankRevCount,
        pairingProgressInfo,
        startDeviceDiscovery,
        stopDeviceDiscovery,
        pairNewDevice,
    };

    return (
        <BluetoothContext.Provider value={contextValue}>
            {children}
        </BluetoothContext.Provider>
    );
};

// Custom Hook for using Bluetooth Context
export const useBluetooth = () => {
    const context = useContext(BluetoothContext);
    if (context === undefined) {
        throw new Error("useBluetooth must be used within a BluetoothProvider");
    }
    return context;
};
