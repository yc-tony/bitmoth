import { SymbolView } from 'expo-symbols';
import { Tabs } from 'expo-router';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: Colors[colorScheme].tint,
      headerShown: useClientOnlyValue(false, true),
    }}>
      <Tabs.Screen
        name="index"
        options={{
          title: '掃描',
          tabBarIcon: ({ color }) => (
            <SymbolView name={{ ios: 'qrcode.viewfinder', android: 'qr_code_scanner', web: 'qr_code_scanner' }} tintColor={color} size={28} />
          ),
        }}
      />
      <Tabs.Screen
        name="hatch"
        options={{
          title: '孵化',
          tabBarIcon: ({ color }) => (
            <SymbolView name={{ ios: 'seal', android: 'egg_alt', web: 'egg_alt' }} tintColor={color} size={28} />
          ),
        }}
      />
      <Tabs.Screen
        name="collection"
        options={{
          title: '收藏',
          tabBarIcon: ({ color }) => (
            <SymbolView name={{ ios: 'square.grid.2x2', android: 'grid_view', web: 'grid_view' }} tintColor={color} size={28} />
          ),
        }}
      />
    </Tabs>
  );
}
