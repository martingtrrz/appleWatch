import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useSobriety } from '../context/SobrietyContext';
import { calculateElapsed, getNextMilestone } from '../utils/sobrietyUtils';

type WatchViewMode = 'face' | 'relapse-menu' | 'calling' | 'verse';

export const WatchSobrietyFace: React.FC = () => {
  const {
    trackers,
    activeTracker,
    cycleNextTracker,
    now,
    isRelapseActive,
    relapseVerse,
    isVerseLoading,
    sponsor,
    hasSponsor,
    isCallingSponsor,
    triggerRelapseSOS,
    dismissRelapseSOS,
    startCallSponsor,
    endCallSponsor,
    fetchNewVerse,
  } = useSobriety();

  const [localMode, setLocalMode] = useState<WatchViewMode>('face');

  // Si desde el iPhone se desactiva la alerta, regresar a la carátula
  React.useEffect(() => {
    if (!isRelapseActive && localMode !== 'face') {
      setLocalMode('face');
    }
  }, [isRelapseActive, localMode]);

  const timeString = useMemo(() => {
    const hh = now.getHours().toString().padStart(2, '0');
    const mm = now.getMinutes().toString().padStart(2, '0');
    return `${hh}:${mm}`;
  }, [now]);

  const handleOpenRelapseMenu = async () => {
    setLocalMode('relapse-menu');
    await triggerRelapseSOS();
  };

  const handleBackToFace = () => {
    setLocalMode('face');
    dismissRelapseSOS();
  };

  const handleStartCall = () => {
    startCallSponsor();
    setLocalMode('calling');
  };

  const handleEndCall = () => {
    endCallSponsor();
    setLocalMode('relapse-menu');
  };

  // -------------------------------------------------------------
  // VISTA: LLAMADA EN CURSO (MODERNA ESTILO WATCHOS PHONE)
  // -------------------------------------------------------------
  if (localMode === 'calling' || (isRelapseActive && isCallingSponsor && localMode === 'face')) {
    return (
      <View style={[styles.container, styles.emergencyDarkBg]}>
        <View style={styles.topBar}>
          <Text style={styles.watchTime}>{timeString}</Text>
          <View style={styles.statusPillActive}>
            <View style={styles.greenPulseDot} />
            <Text style={styles.statusPillActiveText}>EN CURSO</Text>
          </View>
        </View>

        <View style={styles.callingContent}>
          <View style={styles.callingWaveRing}>
            <View style={styles.callingAvatar}>
              <Text style={styles.avatarInitial}>
                {sponsor.name.charAt(0)}
              </Text>
            </View>
          </View>
          <Text style={styles.callingSponsorName}>{sponsor.name}</Text>
          <Text style={styles.callingSponsorRole}>PADRINO DE SOBRIEDAD</Text>
          <Text style={styles.callingPhoneText}>{sponsor.phone}</Text>
          <Text style={styles.callingConnectedBadge}>Audio conectado con iPhone</Text>
        </View>

        <TouchableOpacity
          onPress={handleEndCall}
          style={styles.hangupButton}
          activeOpacity={0.8}
        >
          <Text style={styles.hangupButtonText}>FINALIZAR</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // -------------------------------------------------------------
  // VISTA: PERLA DE HOY (VERSÍCULO DE biblia.json)
  // -------------------------------------------------------------
  if (localMode === 'verse') {
    return (
      <View style={[styles.container, styles.emergencyDarkBg]}>
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => setLocalMode('relapse-menu')}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Text style={styles.backButtonText}>VOLVER</Text>
          </TouchableOpacity>
          <Text style={styles.watchTime}>{timeString}</Text>
        </View>

        <ScrollView
          style={styles.verseScrollView}
          contentContainerStyle={styles.verseScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.verseHeaderBadge}>
            <Text style={styles.verseHeaderLabel}>PERLA DE HOY</Text>
            <Text style={styles.verseHeaderSub}>biblia.json</Text>
          </View>

          {isVerseLoading ? (
            <View style={styles.verseLoadingBox}>
              <ActivityIndicator color="#F59E0B" size="small" />
              <Text style={styles.verseLoadingLabel}>Consultando las Escrituras...</Text>
            </View>
          ) : relapseVerse ? (
            <View style={styles.verseGlassCard}>
              <Text style={styles.verseRefTitle}>
                {relapseVerse.reference.toUpperCase()}
              </Text>
              <Text style={styles.verseBodyText}>
                "{relapseVerse.text}"
              </Text>
            </View>
          ) : (
            <Text style={styles.verseBodyText}>Cargando versículo...</Text>
          )}

          <TouchableOpacity
            onPress={() => fetchNewVerse()}
            style={styles.refreshVerseButton}
            activeOpacity={0.7}
          >
            <Text style={styles.refreshVerseButtonText}>OTRA PERLA</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // -------------------------------------------------------------
  // VISTA: MENÚ SOS DE RECAÍDA (ELEGANTE, SIN EMOJIS)
  // -------------------------------------------------------------
  if (localMode === 'relapse-menu' || isRelapseActive) {
    return (
      <View style={[styles.container, styles.emergencyDarkBg]}>
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={handleBackToFace}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Text style={styles.backButtonText}>DÍAS</Text>
          </TouchableOpacity>
          <Text style={styles.watchTime}>{timeString}</Text>
        </View>

        <View style={styles.sosCardHeader}>
          <View style={styles.sosBadgePill}>
            <View style={styles.redPulseDot} />
            <Text style={styles.sosBadgePillText}>ASISTENCIA SOS</Text>
          </View>
          <Text style={styles.sosSubtitleText}>Sincronizado con iPhone</Text>
        </View>

        <View style={styles.sosOptionsColumn}>
          {/* Opción 1: Llamar Padrino */}
          <TouchableOpacity
            onPress={hasSponsor ? handleStartCall : undefined}
            style={[styles.sosOptionItemPrimary, !hasSponsor && { opacity: 0.6 }]}
            activeOpacity={hasSponsor ? 0.8 : 1}
            accessibilityRole="button"
            accessibilityLabel={hasSponsor ? `Llamar padrino: ${sponsor.name}` : 'Padrino no configurado en iPhone'}
          >
            <View style={styles.sosOptionLeftIndicatorBlue} />
            <View style={styles.sosOptionTexts}>
              <Text style={styles.sosOptionHeading}>
                {hasSponsor ? 'LLAMAR PADRINO' : 'SIN PADRINO'}
              </Text>
              <Text style={styles.sosOptionSubtext}>
                {hasSponsor ? (sponsor.name || sponsor.phone) : 'Configura en iPhone'}
              </Text>
            </View>
            <Text style={styles.chevronText}>›</Text>
          </TouchableOpacity>

          {/* Opción 2: Perla de hoy */}
          <TouchableOpacity
            onPress={() => setLocalMode('verse')}
            style={styles.sosOptionItemSecondary}
            activeOpacity={0.8}
          >
            <View style={styles.sosOptionLeftIndicatorGold} />
            <View style={styles.sosOptionTexts}>
              <Text style={styles.sosOptionHeadingGold}>PERLA DE HOY</Text>
              <Text style={styles.sosOptionSubtext}>Versículo bíblico de paz</Text>
            </View>
            <Text style={styles.chevronText}>›</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={handleBackToFace}
          style={styles.safeDismissButton}
          activeOpacity={0.7}
        >
          <Text style={styles.safeDismissButtonText}>ESTOY EN CALMA</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // -------------------------------------------------------------
  // VISTA PRINCIPAL: CARÁTULA MODERNA DE APPLE WATCH ULTRA
  // -------------------------------------------------------------
  if (!activeTracker) {
    return (
      <View style={styles.container}>
        <View style={styles.topBar}>
          <Text style={styles.appTitle}>SOBRIEDAD</Text>
          <Text style={styles.watchTime}>{timeString}</Text>
        </View>
        <View style={styles.emptyCenter}>
          <Text style={styles.emptyHeading}>SIN METAS</Text>
          <Text style={styles.emptyText}>Configura tu meta desde el iPhone</Text>
        </View>
      </View>
    );
  }

  const elapsed = calculateElapsed(activeTracker.startDate, now);
  const { next, progressPct } = getNextMilestone(elapsed.days);
  const accent = activeTracker.color;

  return (
    <View style={styles.container}>
      {/* Barra Superior watchOS */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={cycleNextTracker}
          activeOpacity={0.7}
          style={styles.categoryPill}
        >
          <View style={[styles.categoryNeonDot, { backgroundColor: accent }]} />
          <Text numberOfLines={1} style={[styles.categoryTitle, { color: accent }]}>
            {activeTracker.title.toUpperCase()}
          </Text>
        </TouchableOpacity>
        <Text style={styles.watchTime}>{timeString}</Text>
      </View>

      {/* Dial Central Moderno con Anillo de Progreso */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={cycleNextTracker}
        style={styles.modernDialContainer}
      >
        {/* Anillo de Halo Exterior */}
        <View style={[styles.outerGlowRing, { borderColor: `${accent}25` }]}>
          <View style={[styles.innerGlowRing, { borderColor: `${accent}40` }]}>
            <View style={styles.dialMetricsWrapper}>
              {/* Gran Número de Días */}
              <Text
                adjustsFontSizeToFit
                numberOfLines={1}
                style={[styles.hugeDaysNumber, { color: accent }]}
              >
                {elapsed.days}
              </Text>

              {/* Etiqueta DÍAS SOBRIO */}
              <Text style={styles.hugeDaysLabel}>
                {elapsed.days === 1 ? 'DÍA SOBRIO' : 'DÍAS SOBRIO'}
              </Text>

              {/* Cápsula de Progreso y Próxima Meta */}
              <View style={styles.progressCapsule}>
                <View style={styles.capsuleTrack}>
                  <View
                    style={[
                      styles.capsuleFill,
                      { width: `${progressPct}%`, backgroundColor: accent },
                    ]}
                  />
                </View>
                <Text style={styles.capsuleMetaText}>
                  {next ? `${next.label.toUpperCase()} · ${progressPct}%` : '1 AÑO SUPERADO'}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>

      {/* Barra Inferior: Paginador + Botón Recaída Minimalista */}
      <View style={styles.bottomBar}>
        {/* Paginador de Metas */}
        <View style={styles.pagerDotsContainer}>
          {trackers.map((t) => (
            <View
              key={t.id}
              style={[
                styles.pagerDot,
                t.id === activeTracker.id
                  ? [styles.pagerDotActive, { backgroundColor: accent }]
                  : styles.pagerDotInactive,
              ]}
            />
          ))}
        </View>

        {/* Botón de Emergencia SOS Recaída */}
        <TouchableOpacity
          onPress={handleOpenRelapseMenu}
          style={styles.sosPillButton}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel="SOS Asistencia por recaída o tentación"
        >
          <View style={styles.sosBeaconDot} />
          <Text style={styles.sosPillButtonText}>RECAÍDA</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 10,
    justifyContent: 'space-between',
  },
  emergencyDarkBg: {
    backgroundColor: '#080608',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 24,
    paddingHorizontal: 2,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 5,
    maxWidth: '68%',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  categoryNeonDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  categoryTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  watchTime: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    letterSpacing: 0.5,
  },
  // Dial Central Moderno
  modernDialContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginVertical: 2,
  },
  outerGlowRing: {
    width: 226,
    height: 226,
    borderRadius: 113,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 3,
  },
  innerGlowRing: {
    width: '100%',
    height: '100%',
    borderRadius: 110,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'radial-gradient(circle, rgba(255,255,255,0.03) 0%, rgba(0,0,0,0) 70%)',
  },
  dialMetricsWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  hugeDaysNumber: {
    fontSize: 88,
    fontWeight: '900',
    lineHeight: 88,
    fontVariant: ['tabular-nums'],
    letterSpacing: -3,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 8,
  },
  hugeDaysLabel: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2.8,
    marginTop: 2,
    textAlign: 'center',
    opacity: 0.9,
  },
  progressCapsule: {
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  capsuleTrack: {
    width: 90,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  capsuleFill: {
    height: '100%',
    borderRadius: 1.5,
  },
  capsuleMetaText: {
    color: '#9CA3AF',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  // Barra Inferior
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    height: 26,
  },
  pagerDotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pagerDot: {
    height: 3,
    borderRadius: 1.5,
  },
  pagerDotInactive: {
    width: 4,
    backgroundColor: '#374151',
  },
  pagerDotActive: {
    width: 12,
  },
  sosPillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 69, 58, 0.16)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FF453A',
    gap: 5,
  },
  sosBeaconDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#FF453A',
  },
  sosPillButtonText: {
    color: '#FF6961',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  // SOS Menu Styles
  backButton: {
    backgroundColor: '#1E2330',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#9CA3AF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sosCardHeader: {
    alignItems: 'center',
    marginVertical: 2,
  },
  sosBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 69, 58, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: '#FF453A',
  },
  redPulseDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#FF453A',
  },
  sosBadgePillText: {
    color: '#FF6961',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  sosSubtitleText: {
    color: '#6B7280',
    fontSize: 8,
    fontWeight: '600',
    marginTop: 3,
  },
  sosOptionsColumn: {
    gap: 8,
    marginVertical: 4,
  },
  sosOptionItemPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#131A26',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#1E3A5F',
    gap: 8,
  },
  sosOptionItemSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1D1914',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#543D1A',
    gap: 8,
  },
  sosOptionLeftIndicatorBlue: {
    width: 3,
    height: 22,
    borderRadius: 1.5,
    backgroundColor: '#38BDF8',
  },
  sosOptionLeftIndicatorGold: {
    width: 3,
    height: 22,
    borderRadius: 1.5,
    backgroundColor: '#F59E0B',
  },
  sosOptionTexts: {
    flex: 1,
  },
  sosOptionHeading: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sosOptionHeadingGold: {
    color: '#FDE68A',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sosOptionSubtext: {
    color: '#8B949E',
    fontSize: 9,
    marginTop: 1,
  },
  chevronText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '300',
  },
  safeDismissButton: {
    alignSelf: 'center',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  safeDismissButtonText: {
    color: '#6B7280',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  // Calling view
  callingContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  callingWaveRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: '#30D158',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    backgroundColor: 'rgba(48, 209, 88, 0.08)',
  },
  callingAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0F3020',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#30D158',
    fontSize: 18,
    fontWeight: '900',
  },
  callingSponsorName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  callingSponsorRole: {
    color: '#30D158',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 2,
  },
  callingPhoneText: {
    color: '#9CA3AF',
    fontSize: 10,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  callingConnectedBadge: {
    color: '#6EE7B7',
    fontSize: 8,
    fontWeight: '600',
    marginTop: 6,
  },
  statusPillActive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(48, 209, 88, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  greenPulseDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#30D158',
  },
  statusPillActiveText: {
    color: '#30D158',
    fontSize: 8,
    fontWeight: '900',
  },
  hangupButton: {
    backgroundColor: '#FF453A',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    marginHorizontal: 12,
  },
  hangupButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  // Verse view
  verseScrollView: {
    flex: 1,
    marginTop: 4,
  },
  verseScrollContent: {
    paddingBottom: 6,
  },
  verseHeaderBadge: {
    alignItems: 'center',
    marginBottom: 6,
  },
  verseHeaderLabel: {
    color: '#F59E0B',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  verseHeaderSub: {
    color: '#6B7280',
    fontSize: 8,
  },
  verseGlassCard: {
    backgroundColor: '#1A1612',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#4A3416',
    marginBottom: 8,
  },
  verseRefTitle: {
    color: '#FDE68A',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  verseBodyText: {
    color: '#E5E7EB',
    fontSize: 11,
    lineHeight: 16,
    fontStyle: 'italic',
  },
  refreshVerseButton: {
    backgroundColor: '#262017',
    borderRadius: 8,
    paddingVertical: 6,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#543D1A',
  },
  refreshVerseButtonText: {
    color: '#FBBF24',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  verseLoadingBox: {
    paddingVertical: 20,
    alignItems: 'center',
    gap: 6,
  },
  verseLoadingLabel: {
    color: '#9CA3AF',
    fontSize: 9,
  },
  appTitle: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  emptyCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  emptyHeading: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 10,
    marginTop: 4,
    textAlign: 'center',
  },
});
