import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";
import { Base64, BleManager, Device } from "react-native-ble-plx";
import { Buffer } from "buffer";

// Define UUIDs for services and characteristics
const CYCLING_SPEED_CADENCE_SERVICE = "00001816-0000-1000-8000-00805f9b34fb";
const BATTERY_SERVICE = "0000180f-0000-1000-8000-00805f9b34fb";
const CSC_MEASUREMENT_CHARACTERISTIC = "00002A5B-0000-1000-8000-00805f9b34fb";
const BATTERY_LEVEL_CHARACTERISTIC = "00002A19-0000-1000-8000-00805f9b34fb";

// Bluetooth Provider Context Interface
interface BluetoothContextType {
    rpm: number;
    isDiscovering: boolean;
    isDeviceConnected: boolean;
    batteryLevel: string;
    crankRevCount: number;
    pairingProgressInfo: string;
    startDeviceDiscovery: () => void;
    stopDeviceDiscovery: () => void;
    pairNewDevice: () => void;
    exploreDevice: () => void;
    monitorMovementSensor: () => void;
    disconnectFromCurrentDevices: () => void;
}

// Create React Context
const BluetoothContext = createContext<BluetoothContextType | undefined>(
    undefined,
);

export const BluetoothProvider = ({ children }) => {
    const manager = useMemo(() => new BleManager(), []);
    const [isDiscovering, setIsDiscovering] = useState(false);
    const [isDeviceConnected, setIsDeviceConnected] = useState(false);
    const [batteryLevel, setBatteryLevel] = useState("");
    const [pairingProgressInfo, setPairingProgressInfo] = useState("");
    const [currentDevice, setCurrentDevice] = useState<Device | null>(null);
    const [isPairing, setIsPairing] = useState(false);

    const [rpm, setRpm] = useState(0);
    const [crankRevCount, setCrankRevCount] = useState(0);
    const [crankTimeEvent, setCrankTimeEvent] = useState(0);

    const [scannedDevices, setScannedDevices] = useState([]);

    const connectToDevice = useCallback(
        async (deviceId: string): Promise<boolean> => {
            try {
                const connectedDevices = await manager.devices(null);
                for (let dev of connectedDevices) {
                    if (dev.id === deviceId) {
                        setCurrentDevice(dev);
                        console.info(`Already connected to ${dev.name}`);
                        return true;
                    }
                }
                const newDevice = await manager.connectToDevice(deviceId);
                setCurrentDevice(newDevice);

                console.info(`Connected to ${newDevice.name}`);
                return true;
            } catch (error) {
                console.error(`Error with connecting to device ${error}`);
                return false;
            }
        },
        [],
    );

    const stopDeviceDiscovery = useCallback(async () => {
        await manager.stopDeviceScan();
        setIsDiscovering(false);
    }, []);

    const startDeviceDiscovery = useCallback(async () => {
        if (isDiscovering) return;
        setIsDiscovering(true);
        console.log("Starting device discovery");
        try {
            await manager.stopDeviceScan();

            await manager.startDeviceScan(
                null,
                null,
                (error, scannedDevice) => {
                    if (error) {
                        throw new Error(error.message);
                    }
                    if (
                        scannedDevice.name != null &&
                        scannedDevice.name.startsWith("CAD")
                    ) {
                        connectToDevice(scannedDevice.id).then(
                            async (r) => await stopDeviceDiscovery(),
                        );
                    }
                },
            );
        } catch (error) {
            console.error(error);
        }
    }, []);

    const discoverDeviceServices = useCallback(async () => {
        if (!currentDevice) {
            throw new Error("Device is not connected to the app");
        }
        try {
            await currentDevice.discoverAllServicesAndCharacteristics();
        } catch (error) {
            console.log(`discover all services ${error}`);
            try {
                await (
                    await manager.connectToDevice(currentDevice.id)
                ).discoverAllServicesAndCharacteristics();
            } catch (error) {
                console.error(error);
            }
        }
    }, [currentDevice]);

    const disconnectFromDevice = useCallback(async (deviceId: string) => {
        try {
            await manager.cancelDeviceConnection(deviceId);
            setCurrentDevice(undefined);
        } catch (error) {
            throw new Error(error);
        }
    }, []);

    const disconnectFromCurrentDevices = useCallback(async () => {
        try {
            const devices: Device[] = await manager.connectedDevices(null);
            for (const device of devices) {
                await disconnectFromDevice(device.id);
                console.log("Disconnected device:", device.name);
            }
        } catch (error) {
            console.error(error);
        }
    }, [disconnectFromDevice]);

    // Todo The original CSC characteristic is a notification that a revolution has occured

    const [latestRpm, setLatestRpm] = useState(0);

    const [previousCrankRevCount, setPreviousCrankRevCount] = useState(0);
    const [previousTimeEvent, setPreviousTimeEvent] = useState(0);

    const [timeDelta, setTimeDelta] = useState(0);

    const monitorMovementSensorWrapper = useCallback(
        (device: Device) => {
            if (!device) {
                throw new Error("No device connected");
            }

            const updateSensorData = (characteristic) => {
                const hexResult = Buffer.from(
                    characteristic.value,
                    "base64",
                ).toString("hex");

                const result: string[] = [];
                for (let i = 0; i < hexResult.length; i += 2) {
                    result.push(hexResult.slice(i, i + 2));
                }

                result.reverse();

                const CumulativeCrankRevolutionsHex =
                    result[result.length - 3] + result[result.length - 2];

                const CumulativeCrankRevolutions = parseInt(
                    CumulativeCrankRevolutionsHex,
                    16,
                );

                const LastCrankEventTimeHex =
                    result[result.length - 5] + result[result.length - 4];

                const LastCrankEventTime =
                    parseInt(LastCrankEventTimeHex, 16) / 1024;

                // Update state using the current state values
                setCrankRevCount((currentCrankRevCount) => {
                    setPreviousCrankRevCount(currentCrankRevCount);
                    return CumulativeCrankRevolutions;
                });

                setCrankTimeEvent((currentCrankTimeEvent) => {
                    setPreviousTimeEvent(currentCrankTimeEvent);
                    return LastCrankEventTime;
                });

                // Calculate time delta in the callback
                const timeDelta = LastCrankEventTime - crankTimeEvent;
                setTimeDelta(timeDelta);
            };

            try {
                device.monitorCharacteristicForService(
                    CYCLING_SPEED_CADENCE_SERVICE,
                    CSC_MEASUREMENT_CHARACTERISTIC,
                    (error, characteristic) => {
                        if (error) {
                            console.error(
                                "Characteristic monitoring error:",
                                error,
                            );
                            return;
                        }

                        updateSensorData(characteristic);
                    },
                );
            } catch (error) {
                console.error("Movement sensor monitoring error:", error);
            }

            return () => {};
        },
        [], // Empty dependency array
    );

    useEffect(() => {
        if (timeDelta <= 0 || crankRevCount <= previousCrankRevCount) {
            setRpm((prevState) => prevState * 0.9);
        } else {
            setRpm((crankRevCount - previousCrankRevCount / timeDelta) * 60);
        }
    }, [timeDelta]);

    const monitorMovementSensor = async () => {
        monitorMovementSensorWrapper(currentDevice);
    };

    const exploreDevice = async () => {
        console.log(`Explore device ${currentDevice}`);
        await discoverDeviceServices();
        const device = currentDevice;
        console.log(`Device Name: ${device.name}`);
        console.log(`Device ID: ${device.id}`);

        const services = await device.services();
        if (services.length === 0) console.log("No services");
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

    const decodeCharacteristicValueToString = (value: Base64) => {
        return Buffer.from(value, "base64").toString();
    };

    const decodeCharacteristicValueToDecimal = (value: Base64) => {
        return parseInt(Buffer.from(value, "base64").toString("hex"), 10);
    };

    const encodeStringToBase64 = (value: string) => {
        console.log(Buffer.from(value).toString("base64"));
        return Buffer.from(value).toString("base64");
    };

    const pairNewDevice = () => {};
    // Start Device Discovery

    // Context Value
    const contextValue: BluetoothContextType = {
        rpm,
        isDiscovering,
        isDeviceConnected,
        batteryLevel,
        crankRevCount,
        pairingProgressInfo,
        startDeviceDiscovery,
        stopDeviceDiscovery,
        pairNewDevice,
        exploreDevice,
        monitorMovementSensor,
        disconnectFromCurrentDevices,
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
