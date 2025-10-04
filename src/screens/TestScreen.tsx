import React from 'react';
import { View, Text, Pressable } from 'react-native';

export default function TestScreen() {
  console.log("[TestScreen] Rendering test screen");
  
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>Test Screen</Text>
      <Text style={{ fontSize: 16, color: 'green' }}>If you can see this, React Native is working!</Text>
      <Pressable 
        style={{ backgroundColor: 'blue', padding: 10, borderRadius: 5, marginTop: 20 }}
        onPress={() => console.log("Button pressed!")}
      >
        <Text style={{ color: 'white' }}>Test Button</Text>
      </Pressable>
    </View>
  );
}
