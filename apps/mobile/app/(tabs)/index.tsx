import { useState, useRef } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Text, View } from '@/components/Themed';
import { sha256 } from '@/lib/hash';

export default function ScanScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [mode, setMode] = useState<'camera' | 'text'>('camera');
  const [input, setInput] = useState('');
  const [scanning, setScanning] = useState(true);

  async function handleHash(value: string) {
    const hash = await sha256(value.trim());
    router.push({ pathname: '/(tabs)/hatch', params: { hash } });
  }

  function handleScan({ data }: { data: string }) {
    if (!scanning) return;
    setScanning(false);
    handleHash(data);
  }

  if (mode === 'text') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>輸入召喚咒語</Text>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="輸入任意字串…"
          autoFocus
          returnKeyType="go"
          onSubmitEditing={() => input.trim() && handleHash(input)}
        />
        <TouchableOpacity style={styles.btn} onPress={() => input.trim() && handleHash(input)}>
          <Text style={styles.btnText}>召喚</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setMode('camera')}>
          <Text style={styles.link}>改用掃描</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text>需要相機權限才能掃描</Text>
        <TouchableOpacity style={styles.btn} onPress={requestPermission}>
          <Text style={styles.btnText}>授予權限</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setMode('text')}>
          <Text style={styles.link}>改用文字輸入</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        onBarcodeScanned={handleScan}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      />
      <TouchableOpacity style={styles.textSwitch} onPress={() => setMode('text')}>
        <Text style={styles.link}>改用文字輸入</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  title:     { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  camera:    { flex: 1, width: '100%' },
  input:     { width: '100%', borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 12 },
  btn:       { backgroundColor: '#7b2cbf', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 8, marginBottom: 12 },
  btnText:   { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  link:      { color: '#7b2cbf', fontSize: 14, marginTop: 8 },
  textSwitch:{ position: 'absolute', bottom: 40 },
});
