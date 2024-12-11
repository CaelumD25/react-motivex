import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import VideoPlayerScreen from "./pages/VideoPlayerScreen";
import HomeScreen from "./pages/HomeScreen";
import { TouchableOpacity, Text } from "react-native";
import SettingsScreen from "./pages/SettingsScreen";

const Stack = createNativeStackNavigator();

export default function App() {
    return (
        <NavigationContainer>
            <Stack.Navigator id={undefined} initialRouteName="Home">
                <Stack.Screen
                    name="Home"
                    component={HomeScreen}
                    options={({ navigation }) => ({
                        headerRight: () => (
                            <TouchableOpacity
                                onPress={() => navigation.navigate("Settings")}
                            >
                                <Text style={{ fontSize: 24 }}>Settings</Text>
                            </TouchableOpacity>
                        ),
                        headerTitleStyle: { fontSize: 30 },
                    })}
                />
                <Stack.Screen
                    name="Video"
                    component={VideoPlayerScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="Settings"
                    component={SettingsScreen}
                    options={{ title: "Settings" }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
