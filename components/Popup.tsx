import React, { useState } from "react";
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    Dimensions,
} from "react-native";
import { Device } from "react-native-ble-plx";

const Popup = ({ visible, onClose, devices, onSelectDevice }) => {
    const renderDevice = ({ item }) => {
        return (
            <TouchableOpacity
                style={styles.deviceContainer}
                onPress={() => {
                    onSelectDevice(item);
                    onClose();
                }}
            >
                <View style={styles.deviceInfo}>
                    <Text style={styles.deviceName}>
                        {item.name || "Unknown Device"}
                    </Text>
                    <Text style={styles.deviceId}>{item.id}</Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.centeredView}>
                <View style={styles.modalView}>
                    <Text style={styles.modalTitle}>Select BLE Device</Text>
                    <FlatList
                        data={devices}
                        renderItem={renderDevice}
                        keyExtractor={(item) => item.id}
                        ListEmptyComponent={() => (
                            <Text style={styles.emptyListText}>
                                No devices found
                            </Text>
                        )}
                        contentContainerStyle={styles.listContainer}
                    />
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={onClose}
                    >
                        <Text style={styles.closeButtonText}>Close</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.5)",
    },
    modalView: {
        width: Dimensions.get("window").width * 0.8,
        backgroundColor: "white",
        borderRadius: 20,
        padding: 20,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalTitle: {
        marginBottom: 15,
        textAlign: "center",
        fontSize: 18,
        fontWeight: "bold",
    },
    listContainer: {
        width: "100%",
    },
    deviceContainer: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
        width: "100%",
    },
    deviceInfo: {
        flexDirection: "column",
    },
    deviceName: {
        fontSize: 16,
        fontWeight: "bold",
    },
    deviceId: {
        fontSize: 12,
        color: "gray",
    },
    emptyListText: {
        textAlign: "center",
        color: "gray",
        padding: 20,
    },
    closeButton: {
        marginTop: 15,
        padding: 10,
        backgroundColor: "#2196F3",
        borderRadius: 10,
    },
    closeButtonText: {
        color: "white",
        textAlign: "center",
    },
});

export default Popup;

// Example Usage:
// const App = () => {
//   const [devices, setDevices] = useState([]);
//   const [isVisible, setIsVisible] = useState(false);
//
//   const scanAndUpdateDevices = async () => {
//     const discoveredDevices = await bleManager.startDeviceScan(
//       null,
//       null,
//       (error, device) => {
//         if (error) {
//           console.log(error);
//           return;
//         }
//         setDevices(prevDevices => {
//           // Ensure unique devices
//           const exists = prevDevices.some(d => d.id === device.id);
//           return exists
//             ? prevDevices
//             : [...prevDevices, device];
//         });
//       }
//     );
//   };
//
//   return (
//     <BLEDevicePopup
//       visible={isVisible}
//       onClose={() => setIsVisible(false)}
//       devices={devices}
//       onSelectDevice={(device) => {
//         console.log('Selected device:', device);
//         // Perform connection or other actions
//       }}
//     />
//   );
// };
