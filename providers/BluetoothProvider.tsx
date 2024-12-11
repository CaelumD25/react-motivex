import { useSettings } from "./SettingsProvider";
import { createContext, useState } from "react";

const BluetoothContext = createContext({});
export const BluetoothProvider = ({ children }) => {
    const { settings, updateSetting } = useSettings();

    const [connectedDevice, setConnectedDevice] = useState(null);
    const [batteryLevel, setBatteryLevel] = useState(null);
    const [crankRevCount, setCrankRevCount] = useState(0);
    const [connectionStatus, setConnectionStatus] = useState("disconnected");

    // Method to handle device pairing
    const pairDevice = async (deviceInfo) => {
        try {
            // Set connected device
            setConnectedDevice(deviceInfo);
            setConnectionStatus("connected");
        } catch (error) {
            console.error("Pairing failed", error);
            setConnectionStatus("pairing_failed");
        }
    };

    // Method to disconnect device
    const disconnectDevice = () => {
        setConnectedDevice(null);
        setConnectionStatus("disconnected");

        // Clear sensor name in settings
        updateSettings({
            cadenceSensorName: "",
            isPaired: false,
        });
    };

    // Bluetooth connection logic would go here
    // This is a placeholder for actual Bluetooth connection methods
    useEffect(() => {
        // Example of how you might automatically try to connect
        if (settings.cadenceSensorName && !connectedDevice) {
            // Attempt to reconnect to previously paired device
            // Implement your Bluetooth reconnection logic here
        }
    }, [settings.cadenceSensorName]);

    return (
        <BluetoothContext.Provider
            value={{
                connectedDevice,
                batteryLevel,
                crankRevCount,
                connectionStatus,
                pairDevice,
                disconnectDevice,
                setBatteryLevel,
                setCrankRevCount,
            }}
        >
            {children}
        </BluetoothContext.Provider>
    );
};

// Hook to use Bluetooth context
export const useBluetooth = () => {
    const context = useContext(BluetoothContext);
    if (!context) {
        throw new Error("useBluetooth must be used within a BluetoothProvider");
    }
    return context;
};
