import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import DrawerNavigator from './DrawerNavigator';
import BancadaDetalheScreen from './screens/BancadaDetalheScreen';

const Stack = createStackNavigator();

export default function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Drawer" component={DrawerNavigator} />
      <Stack.Screen name="BancadaDetalhe" component={BancadaDetalheScreen} />
    </Stack.Navigator>
  );
} 