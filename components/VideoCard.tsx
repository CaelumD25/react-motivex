import { Image, Text, View } from "react-native";
import styles from "../Styles";
import React from "react";

const VideoCard = ({ thumbnailUri, name }) => {
    return (
        <View style={styles.videoCard}>
            <Image
                source={{ uri: thumbnailUri }}
                style={styles.videoThumbnail}
                resizeMode="cover"
            />
            <Text
                style={{
                    color: "#000",
                    marginVertical: 10,
                    overflow: "hidden",
                    borderWidth: 0,
                    borderColor: "transparent",
                    backgroundColor: "transparent",
                    fontSize: 20,
                    fontWeight: "bold",
                    textAlign: "center", // Center align text for a clean look
                }}
            >
                {name}
            </Text>
        </View>
    );
};

export default VideoCard;
