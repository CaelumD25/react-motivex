import React, { useEffect, useState } from "react";
import {
    Text,
    View,
    TouchableOpacity,
    PermissionsAndroid,
    FlatList,
} from "react-native";
import * as FileSystem from "expo-file-system";
import * as VideoThumbnails from "expo-video-thumbnails";
import styles from "../Styles";
import VideoCard from "../components/VideoCard";
import { useSettings } from "../providers/SettingsProvider";
import { formatNumber } from "../Util";

type VideoFileWithThumbnail = {
    fileName: string;
    thumbnailUri: string | null;
};

const HomeScreen = ({ navigation }) => {
    const { settings, updateSetting } = useSettings();
    const [videoFiles, setVideoFiles] = useState<VideoFileWithThumbnail[]>([]);

    useEffect(() => {
        navigation.setOptions({ title: "Select a video, or start moving!" });

        const checkPermissions = async () => {
            const permissionsGranted = await requestStoragePermission();
            if (permissionsGranted) {
                await getFilesList();
            }
        };

        checkPermissions().then((r) =>
            console.debug(
                `Video Files Retrieved: ${videoFiles.length != 0 ? videoFiles[0] : "No Video Files Found"}`,
            ),
        );
    }, []);

    const requestStoragePermission = async () => {
        try {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
                {
                    title: "Storage Permission",
                    message:
                        "App needs access to your storage to read video files",
                    buttonNeutral: "Ask Me Later",
                    buttonNegative: "Cancel",
                    buttonPositive: "OK",
                },
            );
            return granted === PermissionsAndroid.RESULTS.GRANTED;
        } catch (err) {
            console.warn(err);
            return false;
        }
    };

    const getFilesList = async (): Promise<void> => {
        try {
            const downloadsPath = "file:///sdcard/Download/";
            const files = await FileSystem.readDirectoryAsync(downloadsPath);

            const videoExtensions = [".mp4", ".avi", ".mov", ".mkv"];
            const filteredVideoFiles = files.filter((file) =>
                videoExtensions.some((ext) => file.toLowerCase().endsWith(ext)),
            );

            const videosWithThumbnails = await Promise.all(
                filteredVideoFiles.map(async (fileName) => {
                    const thumbnailUri = await generateThumbnail(fileName);
                    return { fileName, thumbnailUri };
                }),
            );

            setVideoFiles(videosWithThumbnails);
        } catch (error) {
            console.error("Error reading directory:", error);
        }
    };

    const navigateToVideo = (path: string) => {
        navigation.navigate("Video", { path: path });
    };

    const generateThumbnail = async (
        fileName: string,
    ): Promise<string | null> => {
        try {
            const { uri } = await VideoThumbnails.getThumbnailAsync(
                `file:///sdcard/Download/${fileName}`,
                {
                    time: 15000,
                    quality: 0.8,
                },
            );
            return uri;
        } catch (e) {
            console.warn("Thumbnail generation error:", e);
            return null;
        }
    };

    const re = new RegExp(/^(.*?)\.\w{3}$/);
    const parseFilename = (filename: string): string | null => {
        const name = filename.match(re);
        if (name !== null) {
            return name[1];
        }
        return null;
    };

    return (
        <View style={styles.homeContainer}>
            {videoFiles.length > 0 ? (
                <FlatList
                    data={videoFiles}
                    keyExtractor={(item, index) => index.toString()}
                    numColumns={3}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            onPress={() =>
                                navigateToVideo(
                                    `/sdcard/Download/${item.fileName}`,
                                )
                            }
                            style={styles.videoCardWrapper}
                        >
                            {item.thumbnailUri ? (
                                <VideoCard
                                    thumbnailUri={item.thumbnailUri}
                                    name={parseFilename(item.fileName)}
                                />
                            ) : (
                                <Text>{item.fileName.split(".")[0]}</Text>
                            )}
                        </TouchableOpacity>
                    )}
                    contentContainerStyle={styles.flatListContent}
                />
            ) : (
                <Text>No video files found</Text>
            )}
            <View
                style={{
                    position: "absolute",
                    bottom: 10,
                    left: 10,
                    padding: 10,
                    ...styles.exitContainer,
                }}
            >
                <Text style={styles.videoText}>
                    Total: {formatNumber(settings.totalDistance)} km
                </Text>
            </View>
        </View>
    );
};

export default HomeScreen;
