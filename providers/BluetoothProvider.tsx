import React, {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
} from "react";
import {
    Base64,
    BleError,
    BleManager,
    Characteristic,
    Device,
    ScanMode,
} from "react-native-ble-plx";
import { Buffer } from "buffer";

// Define UUIDs for services and characteristics
const CYCLING_SPEED_CADENCE_SERVICE = "00001816-0000-1000-8000-00805f9b34fb";
const BATTERY_SERVICE = "0000180f-0000-1000-8000-00805f9b34fb";
const CSC_MEASUREMENT_CHARACTERISTIC = "00002A5B-0000-1000-8000-00805f9b34fb";
const BATTERY_LEVEL_CHARACTERISTIC = "00002A19-0000-1000-8000-00805f9b34fb";

// Bluetooth Provider Context Interface
interface BluetoothContextType {
    rpm: number;
    selectDevice: (device: Device | null) => void;
    currentDevice: Device;
    discoverDevices: () => void;
    stopDiscoveringDevices: () => void;
    connectToDevice: (deviceId: string) => Promise<boolean>;
    disconnectFromDevice: (deviceId: string) => Promise<void>;
    scannedDevices: Device[];
}

// Create React Context
const BluetoothContext = createContext<BluetoothContextType | undefined>(
    undefined,
);

interface CSC_DATA {
    flags: string; // Config Flags
    CumulativeCrankRevolutions: number; // Current Crank Rotations
    LastCrankEventTime: number; // Last Crank Event Time
}

export const BluetoothProvider = ({ children }) => {
    const manager = useMemo(() => new BleManager(), []);
    const [pairingProgressInfo, setPairingProgressInfo] = useState("");
    const [currentDevice, setCurrentDevice] = useState<Device | null>(null);

    const [rpm, setRpm] = useState(0);
    const [crankRevCount, setCrankRevCount] = useState(0);

    ///// New

    const [scannedDevices, setScannedDevices] = useState<Device[]>([]);
    const [isDiscovering, setIsDiscovering] = useState(false);
    const bufferCCR: number[] = [0, 0, 0, 0];
    const bufferLCET: number[] = [0, 0, 0, 0];
    const [bufferPointer, setBufferPointer] = useState<number>(0);

    const discoverDevices = useCallback(() => {
        if (isDiscovering) {
            return;
        } else {
            setIsDiscovering(true);
            //setScannedDevices([]);
        }
        try {
            const deviceScanTimeout = setTimeout(async () => {
                await stopDiscoveringDevices();
                clearTimeout(deviceScanTimeout);
            }, 15000);
            manager.startDeviceScan(
                null,
                { allowDuplicates: false, scanMode: ScanMode.LowLatency },
                onScannedDevice,
            );
        } catch (error) {
            console.log("Error starting device scan:", error);
        }
    }, [manager, isDiscovering]);

    const selectDevice = (device: Device | null) => {
        setCurrentDevice(device);
    };

    const stopDiscoveringDevices = () => {
        if (!isDiscovering) {
            return;
        } else {
            setIsDiscovering(false);
        }
        try {
            manager.stopDeviceScan();
        } catch (error) {
            console.log("Error stopping device scan:", error);
        }
    };

    const isDuplicated = (devices: Device[], nextDevice: Device | null) => {
        return devices.some((device) => device.id === nextDevice?.id);
    };

    const onScannedDevice = useCallback(
        async (error: BleError, device: Device) => {
            if (error) {
                console.error(error);
                return;
            } else if (
                device &&
                !scannedDevices.includes(device) &&
                device.isConnectable == true &&
                device.name !== null
            ) {
                setScannedDevices((prevState) => {
                    if (!isDuplicated(prevState, device)) {
                        return [...prevState, device];
                    }
                    return prevState;
                });
                console.info("Found Device:", device.name);
            }
        },
        [],
    );

    const connectToDevice = useCallback(
        async (deviceId: string): Promise<boolean> => {
            try {
                try {
                    const connectedDevice =
                        await manager.connectToDevice(deviceId);
                    await connectedDevice.discoverAllServicesAndCharacteristics();
                    setCurrentDevice(connectedDevice);
                    console.info(`Connected to: ${connectedDevice.name}`);
                } catch (error) {
                    const connectedDevices = await manager.devices([deviceId]);
                    if (connectedDevices.length > 0)
                        console.log(connectedDevices[0].name);
                }

                return true;
            } catch (error) {
                console.error("Error with connecting to device:", error);
                return false;
            }
        },
        [manager],
    );

    const disconnectFromDevice = async (deviceId: string) => {
        try {
            await manager.cancelDeviceConnection(deviceId);
            setCurrentDevice(undefined);
        } catch (error) {
            console.error("Error disconnecting from device:", error);
        }
    };

    // Todo The original CSC characteristic is a notification that a revolution has occured

    const [CCR, setCCR] = useState(0);
    const [LCET, setLCET] = useState(0);

    const [timeDelta, setTimeDelta] = useState(0);

    const extractCSCData = (
        rawCharacteristicOutput: Characteristic,
    ): CSC_DATA => {
        const hexResult = Buffer.from(
            rawCharacteristicOutput.value,
            "base64",
        ).toString("hex");

        const result: string[] = [];
        for (let i = 0; i < hexResult.length; i += 2) {
            result.push(hexResult.slice(i, i + 2));
        }

        result.reverse();

        const flags = result[result.length - 1];

        const CumulativeCrankRevolutionsHex =
            result[result.length - 3] + result[result.length - 2];

        const CumulativeCrankRevolutions = parseInt(
            CumulativeCrankRevolutionsHex,
            16,
        );

        const LastCrankEventTimeHex =
            result[result.length - 5] + result[result.length - 4];

        const LastCrankEventTime = parseInt(LastCrankEventTimeHex, 16) / 1024;

        return { flags, CumulativeCrankRevolutions, LastCrankEventTime };
    };

    const updateRpm = (
        prevCCR: number,
        curCCR: number,
        prevLCET: number,
        curLCET: number,
    ) => {
        if (curCCR <= prevCCR || curLCET <= prevLCET) {
            return;
        } else {
            bufferCCR[bufferPointer] = curCCR - prevCCR;
            bufferLCET[bufferPointer] = curLCET - prevLCET;
            setBufferPointer((prevState) => (prevState += 1) % 4);
            let averageCCR = 0;
            for (let i = 0; i < bufferCCR.length; ++i) {
                averageCCR += i;
            }
            averageCCR = averageCCR / 4;
            setRpm(averageCCR / (curLCET - prevLCET));
            return;
        }
    };

    const onCSCNotification = (
        error: BleError,
        characteristic: Characteristic,
    ) => {
        if (error) {
            console.error("Error from CCR notification:", error);
            return;
        } else if (!characteristic?.value) {
            console.error("Error receiving data:", error);
            return;
        }

        const { CumulativeCrankRevolutions, LastCrankEventTime } =
            extractCSCData(characteristic);

        setCCR((prevCCR) => {
            setLCET((prevLCET) => {
                updateRpm(
                    prevCCR,
                    CumulativeCrankRevolutions,
                    prevLCET,
                    LastCrankEventTime,
                );
                return LastCrankEventTime;
            });
            return CumulativeCrankRevolutions;
        });
        setLCET(LastCrankEventTime);
        return;
    };

    const monitorMovementSensorWrapper = (device: Device) => {
        if (!device) {
            throw new Error("No device connected");
        }

        try {
            device.monitorCharacteristicForService(
                CYCLING_SPEED_CADENCE_SERVICE,
                CSC_MEASUREMENT_CHARACTERISTIC,
                onCSCNotification,
            );
        } catch (error) {
            console.error("Movement sensor monitoring error:", error);
        }

        return () => {};
    };

    const monitorMovementSensor = async () => {
        monitorMovementSensorWrapper(currentDevice);
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
        currentDevice,
        selectDevice,
        discoverDevices,
        stopDiscoveringDevices,
        connectToDevice,
        disconnectFromDevice,
        scannedDevices,
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
