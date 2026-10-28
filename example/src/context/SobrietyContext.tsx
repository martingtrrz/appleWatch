import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Linking } from 'react-native';
import type { SobrietyTracker, BibleVerse, SponsorContact } from '../types';
import { getRandomVerse } from '../services/bibleService';
import { loadJSON, saveJSON } from '../utils/storage';

const STORAGE_KEYS = {
  trackers: 'sobriety.trackers.v1',
  activeId: 'sobriety.activeId.v1',
  sponsor: 'sobriety.sponsor.v1',
};

interface SobrietyContextValue {
  trackers: SobrietyTracker[];
  activeTracker: SobrietyTracker | null;
  now: Date;
  selectTracker: (id: string) => void;
  cycleNextTracker: () => void;
  resetTracker: (id: string) => void;
  updateStartDate: (id: string, newDateIso: string) => void;
  addTracker: (
    title: string,
    category: string,
    startDate: string,
    color: string,
    tag: string
  ) => void;
  deleteTracker: (id: string) => void;

  // Estado de Emergencia / Recaída sincronizado
  isRelapseActive: boolean;
  relapseVerse: BibleVerse | null;
  isVerseLoading: boolean;
  sponsor: SponsorContact;
  hasSponsor: boolean;
  updateSponsor: (sponsor: SponsorContact) => void;
  isCallingSponsor: boolean;
  triggerRelapseSOS: () => Promise<void>;
  dismissRelapseSOS: () => void;
  startCallSponsor: () => void;
  endCallSponsor: () => void;
  messageSponsor: () => void;
  fetchNewVerse: () => Promise<void>;
}

const SobrietyContext = createContext<SobrietyContextValue | null>(null);

// Sin padrino por defecto: el usuario lo configura en la app.
const EMPTY_SPONSOR: SponsorContact = {
  name: '',
  role: 'Padrino / Persona de apoyo',
  phone: '',
};

const SOS_MESSAGE = 'Necesito apoyo, tengo tentación de recaída.';

const cleanPhone = (phone: string) => phone.replace(/[^\d+]/g, '');

export const SobrietyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Las metas arrancan vacías (onboarding) y se restauran desde el almacenamiento.
  const [trackers, setTrackers] = useState<SobrietyTracker[]>(() =>
    loadJSON<SobrietyTracker[]>(STORAGE_KEYS.trackers, [])
  );
  const [activeId, setActiveId] = useState<string>(() =>
    loadJSON<string>(STORAGE_KEYS.activeId, '')
  );
  const [sponsor, setSponsor] = useState<SponsorContact>(() =>
    loadJSON<SponsorContact>(STORAGE_KEYS.sponsor, EMPTY_SPONSOR)
  );
  const [now, setNow] = useState<Date>(new Date());

  // Estados de Asistencia por Recaída
  const [isRelapseActive, setIsRelapseActive] = useState<boolean>(false);
  const [relapseVerse, setRelapseVerse] = useState<BibleVerse | null>(null);
  const [isVerseLoading, setIsVerseLoading] = useState<boolean>(false);
  const [isCallingSponsor, setIsCallingSponsor] = useState<boolean>(false);

  // Persistencia automática
  useEffect(() => saveJSON(STORAGE_KEYS.trackers, trackers), [trackers]);
  useEffect(() => saveJSON(STORAGE_KEYS.activeId, activeId), [activeId]);
  useEffect(() => saveJSON(STORAGE_KEYS.sponsor, sponsor), [sponsor]);

  // Actualiza la hora cada segundo para cálculo exacto de días, horas, minutos y segundos
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hasSponsor = sponsor.phone.trim().length > 0;

  const activeTracker = useMemo(
    () => trackers.find((t) => t.id === activeId) ?? trackers[0] ?? null,
    [trackers, activeId]
  );

  const selectTracker = useCallback((id: string) => {
    setActiveId(id);
  }, []);

  const cycleNextTracker = useCallback(() => {
    if (trackers.length === 0) return;
    const idx = trackers.findIndex((t) => t.id === activeTracker?.id);
    const nextIdx = (idx + 1) % trackers.length;
    setActiveId(trackers[nextIdx].id);
  }, [trackers, activeTracker]);

  // Reinicio por recaída: se conserva la mejor racha y el número de recaídas.
  const resetTracker = useCallback((id: string) => {
    const nowMs = Date.now();
    setTrackers((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const daysDone = Math.max(
          0,
          Math.floor((nowMs - new Date(t.startDate).getTime()) / 86400000)
        );
        return {
          ...t,
          startDate: new Date(nowMs).toISOString(),
          bestStreakDays: Math.max(t.bestStreakDays ?? 0, daysDone),
          relapseCount: (t.relapseCount ?? 0) + 1,
        };
      })
    );
  }, []);

  const updateStartDate = useCallback((id: string, newDateIso: string) => {
    setTrackers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, startDate: newDateIso } : t))
    );
  }, []);

  const addTracker = useCallback(
    (
      title: string,
      category: string,
      startDate: string,
      color: string,
      tag: string
    ) => {
      const id = `tracker-${Date.now()}`;
      const newTracker: SobrietyTracker = {
        id,
        title: title.trim(),
        category: category.trim() || 'General',
        startDate: startDate || new Date().toISOString(),
        color,
        tag: tag.toUpperCase().slice(0, 4) || 'META',
      };
      setTrackers((prev) => [...prev, newTracker]);
      setActiveId(id);
    },
    []
  );

  const deleteTracker = useCallback(
    (id: string) => {
      const filtered = trackers.filter((t) => t.id !== id);
      setTrackers(filtered);
      if (activeId === id) {
        setActiveId(filtered[0]?.id ?? '');
      }
    },
    [trackers, activeId]
  );

  const updateSponsor = useCallback((next: SponsorContact) => {
    setSponsor({
      name: next.name.trim(),
      role: next.role.trim() || EMPTY_SPONSOR.role,
      phone: next.phone.trim(),
    });
  }, []);

  const fetchNewVerse = useCallback(async () => {
    setIsVerseLoading(true);
    try {
      const v = await getRandomVerse();
      setRelapseVerse(v);
    } catch (e) {
      console.warn('Error fetching verse:', e);
    } finally {
      setIsVerseLoading(false);
    }
  }, []);

  const triggerRelapseSOS = useCallback(async () => {
    setIsRelapseActive(true);
    await fetchNewVerse();
  }, [fetchNewVerse]);

  const dismissRelapseSOS = useCallback(() => {
    setIsRelapseActive(false);
    setIsCallingSponsor(false);
  }, []);

  // Llamada real: abre el marcador del sistema con el número del padrino.
  const startCallSponsor = useCallback(() => {
    if (!hasSponsor) return;
    setIsCallingSponsor(true);
    Linking.openURL(`tel:${cleanPhone(sponsor.phone)}`).catch((e) =>
      console.warn('No se pudo iniciar la llamada:', e)
    );
  }, [hasSponsor, sponsor.phone]);

  const endCallSponsor = useCallback(() => {
    setIsCallingSponsor(false);
  }, []);

  // Mensaje real: abre la app de SMS con el texto de ayuda ya escrito.
  const messageSponsor = useCallback(() => {
    if (!hasSponsor) return;
    Linking.openURL(
      `sms:${cleanPhone(sponsor.phone)}?body=${encodeURIComponent(SOS_MESSAGE)}`
    ).catch((e) => console.warn('No se pudo abrir SMS:', e));
  }, [hasSponsor, sponsor.phone]);

  const value = useMemo(
    () => ({
      trackers,
      activeTracker,
      now,
      selectTracker,
      cycleNextTracker,
      resetTracker,
      updateStartDate,
      addTracker,
      deleteTracker,
      isRelapseActive,
      relapseVerse,
      isVerseLoading,
      sponsor,
      hasSponsor,
      updateSponsor,
      isCallingSponsor,
      triggerRelapseSOS,
      dismissRelapseSOS,
      startCallSponsor,
      endCallSponsor,
      messageSponsor,
      fetchNewVerse,
    }),
    [
      trackers,
      activeTracker,
      now,
      selectTracker,
      cycleNextTracker,
      resetTracker,
      updateStartDate,
      addTracker,
      deleteTracker,
      isRelapseActive,
      relapseVerse,
      isVerseLoading,
      sponsor,
      hasSponsor,
      updateSponsor,
      isCallingSponsor,
      triggerRelapseSOS,
      dismissRelapseSOS,
      startCallSponsor,
      endCallSponsor,
      messageSponsor,
      fetchNewVerse,
    ]
  );

  return (
    <SobrietyContext.Provider value={value}>
      {children}
    </SobrietyContext.Provider>
  );
};

export function useSobriety(): SobrietyContextValue {
  const ctx = useContext(SobrietyContext);
  if (!ctx) {
    throw new Error('useSobriety debe usarse dentro de un SobrietyProvider');
  }
  return ctx;
}
