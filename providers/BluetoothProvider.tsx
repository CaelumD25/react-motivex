import React, {
    createContext,
    useState,
    useContext,
    useEffect,
    useCallback,
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
    const manager = new BleManager();
    const [isDiscovering, setIsDiscovering] = useState(false);
    const [isDeviceConnected, setIsDeviceConnected] = useState(false);
    const [batteryLevel, setBatteryLevel] = useState("");
    const [crankRevCount, setCrankRevCount] = useState(0);
    const [pairingProgressInfo, setPairingProgressInfo] = useState("");
    const [currentDevice, setCurrentDevice] = useState<Device | null>(null);
    const [isPairing, setIsPairing] = useState(false);

    // Comprehensive Bluetooth Permissions Request

    useEffect(() => {
        const initializeBluetooth = async () => {
            try {
            } catch (error) {
                console.error("Bluetooth initialization error:", error);
            }
        };

        initializeBluetooth();
    }, []);

    const [scannedDevices, setScannedDevices] = useState([]);

    const startDeviceDiscovery = useCallback(() => {
        console.log("Starting device discovery");
        manager.startDeviceScan(null, null, (error, scannedDevice) => {
            if (error) {
                throw new Error(error.message);
            }
            if (
                scannedDevice.name != null &&
                scannedDevice.name.startsWith("CAD")
            ) {
                connectToDevice(scannedDevice.id).then((r) =>
                    stopDeviceDiscovery(),
                );
            }
            scannedDevices.push(scannedDevice);
        });
    }, [scannedDevices]);

    const connectToDevice = useCallback(
        async (deviceId: string): Promise<boolean> => {
            try {
                if (await manager.isDeviceConnected(deviceId)) {
                    await disconnectFromDevice(deviceId);
                }
                const newDevice = await manager.connectToDevice(deviceId);
                setCurrentDevice(newDevice);

                console.info(`Connected to ${newDevice.name}`);
                return true;
            } catch (error) {
                console.error(error);
                return false;
            }
        },
        [],
    );

    const discoverDeviceServices = useCallback(async () => {
        if (!currentDevice) {
            throw new Error("Device is not connected to the app");
        }
        try {
            console.log(
                await currentDevice.discoverAllServicesAndCharacteristics(),
            );
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
            for (const device in devices) {
                await disconnectFromDevice(device);
                console.log("Disconnected device:", device);
            }
        } catch (error) {
            console.error(error);
        }
    }, [disconnectFromDevice]);

    const monitorMovementSensor = useCallback(async () => {
        if (!currentDevice) {
            throw new Error("No device connected");
        }
        try {
            currentDevice.monitorCharacteristicForService(
                CYCLING_SPEED_CADENCE_SERVICE,
                CSC_MEASUREMENT_CHARACTERISTIC,
                (error, characteristic) => {
                    console.log(
                        "Received device characteristic for service:",
                        error,
                        error,
                    );
                    console.log(characteristic.value);
                    console.log(
                        decodeCharacteristicValueToDecimal(
                            characteristic.value,
                        ),
                    );
                    console.log(
                        Buffer.from(characteristic.value, "base64").toString(
                            "utf8",
                        ),
                    );
                },
            );
        } catch (error) {
            console.error(error);
        }
    }, [currentDevice]);

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

    const stopDeviceDiscovery = useCallback(() => {
        manager.stopDeviceScan().then(() => console.log("Stopped scanning"));
    }, []);
    const pairNewDevice = () => {};
    // Start Device Discovery

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
