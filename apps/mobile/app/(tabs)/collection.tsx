import { StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Text, View } from '@/components/Themed';

// 未來從 local storage（AsyncStorage / SQLite）讀取
// 目前先用空陣列當佔位
const MOCK_COLLECTION: never[] = [];

export default function CollectionScreen() {
  const router = useRouter();

  if (MOCK_COLLECTION.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>還沒有任何彼魔</Text>
        <TouchableOpacity style={styles.btn} onPress={() => router.push('/(tabs)/')}>
          <Text style={styles.btnText}>去掃描第一隻</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={MOCK_COLLECTION}
        keyExtractor={(item: any) => item.hash}
        numColumns={2}
        renderItem={({ item }: any) => (
          <View style={styles.card}>
            <Text style={styles.cardName}>{item.title} {item.name}</Text>
            <Text style={styles.cardStats}>HP {item.hp} / ATK {item.atk}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, padding: 8 },
  empty:      { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  emptyText:  { fontSize: 18, color: '#888' },
  btn:        { backgroundColor: '#7b2cbf', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  btnText:    { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  card:       { flex: 1, margin: 6, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#ddd' },
  cardName:   { fontSize: 14, fontWeight: 'bold', marginBottom: 4 },
  cardStats:  { fontSize: 12, color: '#666' },
});
