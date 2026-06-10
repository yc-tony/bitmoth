import { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { decodeDna } from '@bitmoth/core';
import { Text, View } from '@/components/Themed';
import { lookupPokedex, registerPokedex, fetchStats, type PokedexEntry } from '@/lib/pokedex';

type Phase = 'identifying' | 'identified' | 'hatching' | 'hatched' | 'offline';

export default function HatchScreen() {
  const { hash } = useLocalSearchParams<{ hash: string }>();
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('identifying');
  const [entry, setEntry] = useState<PokedexEntry | null>(null);
  const glow = useState(new Animated.Value(0))[0];

  useEffect(() => {
    if (hash) identify(hash);
  }, [hash]);

  function startGlow() {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0.3, duration: 600, useNativeDriver: true }),
      ])
    ).start();
  }

  async function identify(h: string) {
    setPhase('identifying');
    try {
      const dna = decodeDna(h);
      let result = await lookupPokedex(h);

      if (!result) {
        const stats = await fetchStats(h);
        const reg = await registerPokedex({
          hash: h,
          schemaVersion: dna.schemaVersion,
          raceId: dna.raceId,
          ...stats,
        });
        result = reg.entry;
      }

      setEntry(result);
      setPhase('identified');
      startGlow();

      setTimeout(() => {
        setPhase('hatching');
        setTimeout(() => setPhase('hatched'), 2000);
      }, 2000);
    } catch {
      setPhase('offline');
    }
  }

  if (!hash) return null;

  const dna = decodeDna(hash);

  return (
    <View style={styles.container}>
      {/* 蛋（以 DNA 主色顯示） */}
      <Animated.View style={[
        styles.egg,
        { backgroundColor: dna.primaryColor, borderColor: dna.secondaryColor },
        phase === 'identified' || phase === 'hatching' ? { opacity: glow } : {},
      ]} />

      {phase === 'identifying' && <Text style={styles.status}>🔍 識別中…</Text>}
      {phase === 'identified'  && <Text style={styles.status}>✨ 識別完成，準備孵化！</Text>}
      {phase === 'hatching'    && <Text style={styles.status}>🥚 孵化中…</Text>}

      {phase === 'hatched' && entry && (
        <View style={styles.card}>
          <Text style={styles.name}>{entry.title} {entry.name}</Text>
          <Text style={styles.flavor}>{entry.flavor}</Text>
          <Text style={styles.stats}>HP {entry.hp}　ATK {entry.atk}　DEF {entry.def}　SPD {entry.spd}</Text>
        </View>
      )}

      {phase === 'offline' && (
        <View style={styles.offlineBox}>
          <Text style={styles.offlineText}>⚠️ 無法連線圖鑑伺服器</Text>
          <Text>需要網路才能識別彼魔</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => identify(hash)}>
            <Text style={{ color: '#fff' }}>重試</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backText}>← 返回</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  egg:         { width: 140, height: 180, borderRadius: 70, borderWidth: 4, marginBottom: 24 },
  status:      { fontSize: 18, marginBottom: 16, textAlign: 'center' },
  card:        { alignItems: 'center', marginTop: 16, padding: 16, borderRadius: 12, backgroundColor: 'rgba(123,44,191,0.1)', width: '100%' },
  name:        { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  flavor:      { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 8 },
  stats:       { fontSize: 14, fontWeight: '600' },
  offlineBox:  { alignItems: 'center', gap: 8 },
  offlineText: { fontSize: 16, fontWeight: 'bold', color: '#c0392b' },
  retryBtn:    { backgroundColor: '#7b2cbf', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8, marginTop: 8 },
  backBtn:     { position: 'absolute', top: 60, left: 20 },
  backText:    { fontSize: 16, color: '#7b2cbf' },
});
