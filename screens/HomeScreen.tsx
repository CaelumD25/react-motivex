import React, { useCallback, useEffect, useState } from "react";
import {
    Text,
    View,
    TouchableOpacity,
    Image,
    PermissionsAndroid,
    FlatList,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as FileSystem from "expo-file-system";
import * as VideoThumbnails from "expo-video-thumbnails";
import styles from "../Styles";
import VideoCard from "../components/VideoCard";
import { SettingsHandler } from "../util/SettingsHandler";
import { useFocusEffect } from "@react-navigation/native";

type VideoFileWithThumbnail = {
    fileName: string;
    thumbnailUri: string | null;
};

const HomeScreen = ({ navigation }) => {
    const [videoFiles, setVideoFiles] = useState<VideoFileWithThumbnail[]>([]);
    const [totalDistance, setTotalDistance] = useState<number>(0);
    const settings = new SettingsHandler();

    useEffect(() => {
        // Set navigation options inside useEffect
        navigation.setOptions({ title: "Select a video, or start moving!" });

        const checkPermissions = async () => {
            const permissionsGranted = await requestStoragePermission();
            if (permissionsGranted) {
                getFilesList();
            }
            setTotalDistance(await settings.getTotalDistance());
        };

        checkPermissions();
    }, []); // Empty dependency array ensures this runs only once

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

    useFocusEffect(
        useCallback(() => {
            const fetchTotalDistance = async () => {
                setTotalDistance(await settings.getTotalDistance());
            };

            fetchTotalDistance();
        }, []),
    );
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

    const formatNumber = (numberToFormat: number): string => {
        const newString = numberToFormat.toString().split(".");
        return newString.length > 1
            ? newString[0] +
                  (newString[1].length > 2
                      ? "." + newString[1].slice(0, 3)
                      : "." + newString[1])
            : numberToFormat.toString();
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
                    Total: {formatNumber(totalDistance)} km
                </Text>
            </View>
        </View>
    );
};

export default HomeScreen;