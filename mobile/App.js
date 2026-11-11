import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import NovaSolicitacao from './src/telas/NovaSolicitacao';
import { cores } from './src/tema';

export default function App() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.tela} edges={['top', 'left', 'right']}>
        <StatusBar style="light" backgroundColor={cores.primaria} />
        <View style={styles.barra}>
          <Text style={styles.marca}>CPTM</Text>
          <Text style={styles.sistema}>SSL · Manutenção</Text>
        </View>
        <View style={styles.corpo}>
          <NovaSolicitacao />
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.primaria },
  barra: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: cores.primaria,
  },
  marca: { color: '#FFFFFF', fontSize: 22, fontWeight: '900', letterSpacing: 1 },
  sistema: { color: '#FFFFFF', fontSize: 15, opacity: 0.9 },
  corpo: { flex: 1, backgroundColor: cores.fundo },
});
