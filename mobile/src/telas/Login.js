import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { mensagemDeErro } from '../../../shared/src/index.js';
import { ErroLogin, useAuth } from '../auth/AuthContext';
import { USAR_MOCK } from '../config';
import { cores, medidas } from '../tema';
import Botao from '../componentes/Botao';
import CampoTexto from '../componentes/CampoTexto';
import { AlertaErro } from '../componentes/Estados';

/** CPTM-57 — login por matrícula e senha. */
export default function Login() {
  const { entrar, aviso } = useAuth();
  const [matricula, setMatricula] = useState('');
  const [senha, setSenha] = useState('');
  const [tentou, setTentou] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState(null);
  const campoSenha = useRef(null);

  const erros = {
    matricula: tentou && !matricula.trim() ? 'Informe a matrícula.' : undefined,
    senha: tentou && !senha ? 'Informe a senha.' : undefined,
  };

  async function enviar() {
    setTentou(true);
    setErro(null);
    if (!matricula.trim() || !senha) return;
    setEnviando(true);
    try {
      await entrar(matricula, senha);
      // sucesso: o AuthContext troca a navegação para a área do perfil
    } catch (e) {
      setErro(e instanceof ErroLogin ? e.message : mensagemDeErro(e));
      setEnviando(false);
    }
  }

  return (
    <SafeAreaView style={styles.tela}>
      <StatusBar style="light" backgroundColor={cores.primaria} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
          <View style={styles.cabecalho}>
            <Text style={styles.marca}>CPTM</Text>
            <Text style={styles.sistema}>SSL · Manutenção</Text>
          </View>

          <View style={styles.cartao}>
            <Text style={styles.titulo} accessibilityRole="header">Entrar</Text>
            <Text style={styles.subtitulo}>Use sua matrícula e senha da CPTM.</Text>

            {aviso && !erro ? <Text style={styles.aviso}>{aviso}</Text> : null}
            <AlertaErro mensagem={erro} />

            <CampoTexto
              rotulo="Matrícula"
              value={matricula}
              onChangeText={setMatricula}
              erro={erros.matricula}
              editable={!enviando}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="username"
              textContentType="username"
              returnKeyType="next"
              onSubmitEditing={() => campoSenha.current?.focus()}
              submitBehavior="submit"
            />
            <CampoTexto
              ref={campoSenha}
              rotulo="Senha"
              value={senha}
              onChangeText={setSenha}
              erro={erros.senha}
              editable={!enviando}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="current-password"
              textContentType="password"
              returnKeyType="go"
              onSubmitEditing={enviar}
            />

            <Botao texto="Entrar" onPress={enviar} carregando={enviando} />

            {USAR_MOCK ? (
              <Text style={styles.dicaMock}>
                MODO MOCK — use comum123, tec123 ou admin123 com a senha "senha".
              </Text>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.primaria },
  flex: { flex: 1 },
  conteudo: { flexGrow: 1, justifyContent: 'center', padding: medidas.espaco },
  cabecalho: { alignItems: 'center', marginBottom: 24 },
  marca: { color: '#FFFFFF', fontSize: 40, fontWeight: '900', letterSpacing: 2 },
  sistema: { color: '#FFFFFF', fontSize: 17, opacity: 0.9 },
  cartao: { backgroundColor: cores.superficie, borderRadius: 14, padding: 20 },
  titulo: { fontSize: 24, fontWeight: '800', color: cores.texto },
  subtitulo: { fontSize: 15, color: cores.textoSecundario, marginTop: 2, marginBottom: medidas.espaco },
  aviso: {
    fontSize: 15,
    color: cores.texto,
    backgroundColor: '#FEF7E6',
    borderLeftWidth: 4,
    borderLeftColor: '#B54708',
    padding: 10,
    borderRadius: 6,
    marginBottom: medidas.espaco,
  },
  dicaMock: { fontSize: 13, color: cores.textoSecundario, marginTop: 14, textAlign: 'center' },
});
