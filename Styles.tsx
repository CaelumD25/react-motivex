import { StyleSheet, Dimensions } from "react-native";

const screenWidth = Dimensions.get("window").width;
const screenHeight = Dimensions.get("window").height;

const styles = StyleSheet.create({
    title: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 20,
        color: "#fff",
    },
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#3e3e3e",
    },
    settingsContainer: {
        padding: 20,
        backgroundColor: "#3e3e3e",
        flex: 1,
    },
    flatListContent: {
        padding: 0,
        margin: 0,
    },
    homeContainer: {
        display: "flex",
        flex: 3,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "flex-start",
        backgroundColor: "#3e3e3e",
        flexGrow: 3,
    },
    videoCard: {
        borderRadius: 10,
        alignItems: "center",
    },
    videoCardWrapper: {
        margin: 10,
        borderRadius: 20,
        width: "30%",
        overflow: "hidden",
        borderWidth: 1,
        backgroundColor: "#FFF",
    },
    videoThumbnail: {
        width: "100%",
        height: (screenHeight * 0.9) / 3,
    },
    videoContainer: {
        width: "100%",
        height: "100%",
        position: "absolute",
        top: 0,
        left: 0,
        alignItems: "center",
    },
    topVideoContainer: {
        width: "50%",
        textAlign: "center",
        alignItems: "center",
        fontSize: 20,
        marginTop: 10,
    },
    bottomVideoContainer: {
        position: "absolute",
        bottom: 0,
        right: 0,
        padding: 10,
    },
    videoTextBox: {
        backgroundColor: "#fff",
        marginVertical: 10,
        opacity: 0.7,
        borderRadius: 100,
        color: "#000",
        paddingLeft: 100,
        paddingRight: 100,
    },
    videoText: {
        fontSize: 20,
        color: "#000",
        fontWeight: "bold",
    },
    videoProgressBar: {
        opacity: 0.8,
        borderRadius: 100,
        color: "limegreen",
        height: 50,
        width: "50%",
    },
    video: {
        width: "100%",
        height: "100%",
        zIndex: -1,
    },
    controlsContainer: {
        marginTop: 20,
        alignItems: "center",
    },
    exitContainer: {
        marginTop: 20,
        alignItems: "center",
        backgroundColor: "#fff",
        opacity: 0.7,
        borderRadius: 100,
        paddingVertical: 10,
        paddingHorizontal: 30,
    },
    button: {
        backgroundColor: "#007bff",
        padding: 10,
        borderRadius: 5,
        margin: 10,
        height: 40,
        fontSize: 20,
    },
    homeButton: {
        backgroundColor: "#fff",
        opacity: 0.6,
        position: "absolute",
        aspectRatio: 1,
        height: "10%",
        left: 10,
        top: 10,
        borderRadius: 10,
        padding: 10,
        alignItems: "center",
    },
    buttonText: {
        color: "white",
        textAlign: "center",
    },
    speedControlContainer: {
        flexDirection: "row",
        justifyContent: "center",
    },
    speedButton: {
        backgroundColor: "#e9ecef",
        padding: 10,
        margin: 5,
        borderRadius: 5,
    },
    activeSpeedButton: {
        backgroundColor: "#007bff",
    },
    speedButtonText: {
        color: "black",
    },
    pickVideoButton: {
        backgroundColor: "#007bff",
        padding: 15,
        borderRadius: 10,
    },
    pickVideoText: {
        color: "white",
        textAlign: "center",
    },
    settingsOption: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 15,
    },
    field: {
        marginBottom: 15,
    },
    textBox: {
        color: "white",
    },
});

export default styles;
