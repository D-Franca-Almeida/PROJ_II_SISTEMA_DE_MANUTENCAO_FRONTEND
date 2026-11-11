// Variáveis EXPO_PUBLIC_* vêm do arquivo .env (veja .env.example).
// Sem .env, o app roda contra o mock.
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5000/api';
export const USAR_MOCK = (process.env.EXPO_PUBLIC_USAR_MOCK ?? 'true') !== 'false';
