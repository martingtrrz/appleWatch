/**
 * Persistencia local mínima y síncrona.
 * - Web: usa window.localStorage.
 * - Nativo: cae a memoria (no persiste). Para persistir en iOS/Android hay que
 *   instalar @react-native-async-storage/async-storage y adaptar este módulo.
 * Los datos de sobriedad son sensibles: nunca salen del dispositivo.
 */
const memory: Record<string, string> = {};

function getStore(): Storage | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
  } catch {
    // localStorage puede estar bloqueado (modo privado)
  }
  return null;
}

export function loadJSON<T>(key: string, fallback: T): T {
  try {
    const store = getStore();
    const raw = store ? store.getItem(key) : memory[key];
    if (raw == null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function saveJSON(key: string, value: unknown): void {
  try {
    const raw = JSON.stringify(value);
    const store = getStore();
    if (store) store.setItem(key, raw);
    else memory[key] = raw;
  } catch (e) {
    console.warn('[storage] No se pudo guardar', key, e);
  }
}
