import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import styles from "../Styles";
import { useEvent, useEventListener } from "expo";
import Slider from "@react-native-community/slider";
import { ProgressBar } from "@react-native-community/progress-bar-android";
import * as test from "node:test";
import { useSettings } from "../providers/SettingsProvider";
import { useBluetooth } from "../providers/BluetoothProvider";

export default function VideoPlayerScreen({ navigation, route }) {
    const { rpm } = useBluetooth();
    const { path } = route.params;
    const { settings, setSettings, setTotalDistance } = useSettings();

    const [videoUri] = useState<string | undefined>(path);
    const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
    const [progress, setProgress] = useState<number>(0);

    const player = useVideoPlayer(path, (player) => {
        player.loop = true;
        player.play();
        player.timeUpdateEventInterval = 0.5;
    });

    const { isPlaying } = useEvent(player, "playingChange", {
        isPlaying: player.playing,
    });

    const [currentDistance, setCurrentDistance] = useState<number>(0);
    const [playbackSpeedModifier, setPlaybackSpeedModifier] =
        useState<number>(0.1);
    const [currentRPM, setCurrentRPM] = useState<number>(0);
    const [currentSpeed, setCurrentSpeed] = useState(0);
    const [exitCountdown, setExitCountdown] = useState<number | null>(null);
    const [isInitialized, setIsInitialized] = useState<boolean>(false);

    const totalDistance = settings.totalDistance;
    const incrementDistance = async (addedDistance: number) => {
        if (isInitialized) {
            const newDistance = currentDistance + addedDistance;
            setCurrentDistance(newDistance);
            const newTotalDistance = totalDistance + addedDistance;
            await setTotalDistance(newTotalDistance);
        }
    };

    useEffect(() => {
        const initializeSettings = async () => {
            try {
                setCurrentDistance(0);
                changePlaybackSpeed(playbackSpeed);
                setIsInitialized(true);
            } catch (error) {
                console.error("Error initializing settings:", error);
            }
        };
        initializeSettings().then((r) => console.debug("Implemented"));
    }, []);

    useEffect(() => {
        const distanceIntervalId = setTimeout(() => {
            const distanceIncrement = currentSpeed * 0.000277778;
            incrementDistance(distanceIncrement);
        }, 1000);

        return () => {
            clearTimeout(distanceIntervalId);
        };
    }, [currentDistance]);

    const calculatePlaybackSpeed = (rpm: number): number => {
        return 0.0125 * rpm;
    };

    const updateRPM = async (rpm: number) => {
        setCurrentRPM(rpm);
        setPlaybackSpeed(calculatePlaybackSpeed(rpm));
        const radius = 0.5;
        const speed = (3 / 25) * 3.14 * radius * rpm;
        setCurrentSpeed(speed);
        if (currentRPM == 0) {
            await incrementDistance(speed * 0.000277778);
        }
    };

    useEffect(() => {
        updateRPM(rpm);
    }, [rpm]);

    // RPM-based exit timer logic
    useEffect(() => {
        let intervalId: NodeJS.Timeout;

        if (currentRPM < 2) {
            setExitCountdown(10);

            intervalId = setInterval(() => {
                setExitCountdown((prev) => {
                    if (prev === 1) {
                        clearInterval(intervalId);
                        navigation.goBack();
                        return null;
                    }
                    return prev ? prev - 1 : null;
                });
            }, 1000);
        } else if (currentRPM >= 2) {
            setExitCountdown(null);
            if (intervalId) clearInterval(intervalId);
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [currentRPM, navigation]);

    useEffect(() => {
        changePlaybackSpeed(playbackSpeed * playbackSpeedModifier);
    }, [playbackSpeed]);

    useEventListener(player, "timeUpdate", () => {
        if (player.currentTime > 0 && player.duration > 0) {
            setProgress(player.currentTime / player.duration);
        } else if (player.currentTime > 0 && player.duration == 0) {
            player.replay();
            setProgress(0.99);
        }
    });

    const togglePlayPause = () => {
        if (isPlaying) {
            player.pause();
        } else {
            player.play();
        }
    };

    const changePlaybackSpeed = (speed: number) => {
        if (speed <= 16 && speed > 0) {
            player.playbackRate = speed;
        }
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
    const controlsEnabled =
        !process.env.NODE_ENV || process.env.NODE_ENV === "development";

    return (
        <View style={styles.container}>
            <View
                style={{ width: "100%", height: "100%", position: "relative" }}
            >
                {videoUri ? (
                    <VideoView
                        player={player}
                        style={styles.video}
                        allowsFullscreen={true}
                        nativeControls={false}
                        startsPictureInPictureAutomatically={false}
                    />
                ) : (
                    <Text style={styles.videoText}>Error Loading Video</Text>
                )}
            </View>
            <View style={styles.videoContainer}>
                <View style={styles.topVideoContainer}>
                    <View style={styles.videoTextBox}>
                        <Text style={styles.videoText}>
                            {formatNumber(currentDistance)} km
                        </Text>
                    </View>

                    {settings.effortBarEnabled ? (
                        <ProgressBar
                            styleAttr="Horizontal"
                            progress={progress}
                            indeterminate={false}
                            style={styles.videoProgressBar}
                        />
                    ) : (
                        <View></View>
                    )}
                </View>
                <TouchableOpacity
                    style={styles.homeButton}
                    onPress={() => navigation.goBack()}
                >
                    <Text>Home</Text>
                </TouchableOpacity>

                <View style={styles.bottomVideoContainer}>
                    <View style={styles.videoTextBox}>
                        <Text style={styles.videoText}>
                            RPM {currentRPM} | Km/h:{" "}
                            {formatNumber(currentSpeed)}
                        </Text>
                    </View>
                </View>

                {exitCountdown !== null ? (
                    <View style={styles.exitContainer}>
                        <Text style={styles.videoText}>
                            Exiting in {exitCountdown} seconds. To cancel, keep
                            going!
                        </Text>
                    </View>
                ) : null}
                {controlsEnabled ? (
                    <View style={styles.controlsContainer}>
                        <TouchableOpacity
                            onPress={togglePlayPause}
                            style={styles.button}
                        >
                            <Text style={styles.buttonText}>
                                {isPlaying ? "Pause" : "Play"}
                            </Text>
                        </TouchableOpacity>
                        <View
                            style={{
                                flex: 2,
                                flexDirection: "row",
                            }}
                        >
                            <TouchableOpacity
                                style={{
                                    ...styles.button,
                                    backgroundColor: "green",
                                }}
                                onPress={() => updateRPM(currentRPM + 1)}
                            >
                                <Text style={styles.buttonText}>Petal Up</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={{
                                    ...styles.button,
                                    backgroundColor: "red",
                                }}
                                onPress={() =>
                                    updateRPM(
                                        currentRPM > 0 ? currentRPM - 1 : 0,
                                    )
                                }
                            >
                                <Text style={styles.buttonText}>
                                    Petal Down
                                </Text>
                            </TouchableOpacity>
                        </View>
                        <Slider
                            style={{ width: 200, height: 40 }}
                            minimumValue={0}
                            maximumValue={16}
                            value={playbackSpeed}
                            onValueChange={(value) => setPlaybackSpeed(value)}
                        />
                    </View>
                ) : (
                    <View></View>
                )}
            </View>
        </View>
    );
}
