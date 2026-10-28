import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useSobriety } from '../context/SobrietyContext';
import {
  calculateElapsed,
  formatFullDate,
  getNextMilestone,
  SOBRIETY_MILESTONES,
  TRACKER_COLORS,
  TRACKER_PRESETS,
} from '../utils/sobrietyUtils';

export const SobrietyPhoneScreen: React.FC = () => {
  const {
    trackers,
    activeTracker,
    now,
    selectTracker,
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
  } = useSobriety();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showEditDateModal, setShowEditDateModal] = useState(false);
  const [showSponsorModal, setShowSponsorModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Form states for adding
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newColor, setNewColor] = useState(TRACKER_COLORS[0]);
  const [newTag, setNewTag] = useState('META');
  const [daysAgoInput, setDaysAgoInput] = useState('0');

  // Edit date input
  const [customDaysAgo, setCustomDaysAgo] = useState('');

  // Sponsor form
  const [sponsorName, setSponsorName] = useState('');
  const [sponsorPhone, setSponsorPhone] = useState('');

  const hh = now.getHours().toString().padStart(2, '0');
  const mm = now.getMinutes().toString().padStart(2, '0');

  const handleSelectPreset = (preset: (typeof TRACKER_PRESETS)[0]) => {
    setNewTitle(preset.title);
    setNewCategory('Hábito');
    setNewTag(preset.tag);
    setNewColor(preset.color);
  };

  const handleCreateTracker = () => {
    if (!newTitle.trim()) return;
    const daysAgo = Math.max(0, parseInt(daysAgoInput, 10) || 0);
    const startMs = Date.now() - daysAgo * 86400000;
    const startDate = new Date(startMs).toISOString();

    addTracker(
      newTitle,
      newCategory || 'General',
      startDate,
      newColor,
      newTag
    );

    // Reset form
    setNewTitle('');
    setNewCategory('');
    setDaysAgoInput('0');
    setShowAddModal(false);
  };

  const handleApplyCustomDays = () => {
    if (!activeTracker) return;
    const days = parseInt(customDaysAgo, 10);
    if (!isNaN(days) && days >= 0) {
      const newStart = new Date(Date.now() - days * 86400000).toISOString();
      updateStartDate(activeTracker.id, newStart);
      setShowEditDateModal(false);
      setCustomDaysAgo('');
    }
  };

  const openSponsorModal = () => {
    setSponsorName(sponsor.name);
    setSponsorPhone(sponsor.phone);
    setShowSponsorModal(true);
  };

  const handleSaveSponsor = () => {
    updateSponsor({ name: sponsorName, role: sponsor.role, phone: sponsorPhone });
    setShowSponsorModal(false);
  };

  const addTrackerModal = (
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { maxHeight: '90%' }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Nueva Meta de Sobriedad</Text>
              <Text style={styles.presetHeading}>Sugerencias rápidas:</Text>
              <View style={styles.presetGrid}>
                {TRACKER_PRESETS.map((p) => (
                  <TouchableOpacity
                    key={p.title}
                    onPress={() => handleSelectPreset(p)}
                    style={[
                      styles.presetChip,
                      newTitle === p.title && {
                        borderColor: p.color,
                        backgroundColor: `${p.color}22`,
                      },
                    ]}
                  >
                    <View style={[styles.presetDot, { backgroundColor: p.color }]} />
                    <Text style={styles.presetChipText}>{p.title}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.inputLabel}>Nombre del hábito / meta:</Text>
              <TextInput
                style={styles.modalInput}
                value={newTitle}
                onChangeText={setNewTitle}
                placeholder="Ej. Alcohol, Bebidas energéticas..."
                placeholderTextColor="#6B7280"
              />
              <Text style={styles.inputLabel}>Sigla corta (ej. ALC, NIC):</Text>
              <TextInput
                style={styles.modalInput}
                value={newTag}
                onChangeText={setNewTag}
                maxLength={4}
                placeholder="ALC"
                placeholderTextColor="#6B7280"
                autoCapitalize="characters"
              />
              <Text style={styles.inputLabel}>¿Cuántos días llevas ya? (0 si comienzas hoy):</Text>
              <TextInput
                style={styles.modalInput}
                keyboardType="number-pad"
                value={daysAgoInput}
                onChangeText={setDaysAgoInput}
                placeholder="0"
                placeholderTextColor="#6B7280"
              />
              <Text style={styles.inputLabel}>Color distintivo:</Text>
              <View style={styles.colorsRow}>
                {TRACKER_COLORS.map((c) => (
                  <TouchableOpacity
                    key={c}
                    onPress={() => setNewColor(c)}
                    style={[
                      styles.colorDot,
                      { backgroundColor: c },
                      newColor === c && styles.colorDotSelected,
                    ]}
                  />
                ))}
              </View>
              <View style={[styles.modalButtons, { marginTop: 16 }]}>
                <TouchableOpacity
                  onPress={() => setShowAddModal(false)}
                  style={styles.modalBtnCancel}
                >
                  <Text style={styles.modalBtnCancelText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleCreateTracker}
                  style={[styles.modalBtnConfirm, { backgroundColor: newColor }]}
                >
                  <Text style={[styles.modalBtnConfirmText, { color: '#000000' }]}>
                    Comenzar
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
  );

  const sponsorModal = (
      <Modal visible={showSponsorModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle} accessibilityRole="header">
              Tu persona de apoyo
            </Text>
            <Text style={styles.modalBody}>
              Será quien reciba tu llamada o mensaje cuando actives el SOS. Estos
              datos se guardan solo en este dispositivo.
            </Text>
            <Text style={styles.inputLabel}>Nombre:</Text>
            <TextInput
              style={styles.modalInput}
              value={sponsorName}
              onChangeText={setSponsorName}
              placeholder="Ej. Carlos"
              placeholderTextColor="#9CA3AF"
              accessibilityLabel="Nombre de tu persona de apoyo"
            />
            <Text style={styles.inputLabel}>Teléfono:</Text>
            <TextInput
              style={styles.modalInput}
              value={sponsorPhone}
              onChangeText={setSponsorPhone}
              keyboardType="phone-pad"
              placeholder="+52 55 0000 0000"
              placeholderTextColor="#9CA3AF"
              accessibilityLabel="Teléfono de tu persona de apoyo"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => setShowSponsorModal(false)}
                style={styles.modalBtnCancel}
                accessibilityRole="button"
                accessibilityLabel="Cancelar"
              >
                <Text style={styles.modalBtnCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveSponsor}
                style={[styles.modalBtnConfirm, { backgroundColor: '#30D158' }]}
                accessibilityRole="button"
                accessibilityLabel="Guardar persona de apoyo"
              >
                <Text style={[styles.modalBtnConfirmText, { color: '#000000' }]}>
                  Guardar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
  );


  // Onboarding: sin metas guardadas, la primera pantalla invita a crear la primera.
  if (!activeTracker) {
    return (
      <View style={styles.container}>
        <View style={styles.onboarding}>
          <Text style={styles.onboardingTitle} accessibilityRole="header">
            Bienvenido
          </Text>
          <Text style={styles.emptyPrompt}>
            Crea tu primera meta de sobriedad. Tu progreso se guarda en este
            dispositivo y se muestra también en tu reloj.
          </Text>
          <TouchableOpacity
            onPress={() => setShowAddModal(true)}
            style={styles.onboardingBtn}
            accessibilityRole="button"
            accessibilityLabel="Crear mi primera meta"
          >
            <Text style={styles.onboardingBtnText}>Crear mi primera meta</Text>
          </TouchableOpacity>
        </View>
        {addTrackerModal}
      </View>
    );
  }

  const elapsed = calculateElapsed(activeTracker.startDate, now);
  const { next, progressPct } = getNextMilestone(elapsed.days);
  const totalHours = Math.floor(elapsed.totalSeconds / 3600);


  return (
    <View style={styles.container}>
      {/* iOS Status Bar */}
      <View style={styles.statusBar}>
        <Text style={styles.statusTime}>{hh}:{mm}</Text>
        <View style={styles.statusIcons}>
          <Text style={styles.statusIcon}>5G</Text>
          <View style={styles.batteryIcon}>
            <View style={styles.batteryFill} />
          </View>
        </View>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Control de Sobriedad</Text>
          <Text style={styles.headerSubtitle}>
            {trackers.length} {trackers.length === 1 ? 'meta activa' : 'metas activas'}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowAddModal(true)}
          style={styles.addButton}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Agregar nueva meta"
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ======================================================== */}
        {/* SECCIÓN SINCRONIZADA: ALERTA SOS RECIBIDA DESDE EL WATCH */}
        {/* ======================================================== */}
        {isRelapseActive && (
          <View style={styles.sosCard} accessibilityLiveRegion="assertive">
            <View style={styles.sosBannerHeader}>
              <View style={styles.sosHeaderPulse}>
                <View style={styles.sosPulseDot} />
                <Text style={styles.sosBadgeTitle}>ALERTA SOS · DESDE APPLE WATCH</Text>
              </View>
              <TouchableOpacity
                onPress={dismissRelapseSOS}
                style={[styles.sosCloseBtn, { minHeight: 44, justifyContent: 'center', paddingHorizontal: 12 }]}
                accessibilityRole="button"
                accessibilityLabel="Cerrar alerta SOS"
              >
                <Text style={styles.sosCloseText}>Cerrar</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sosBannerMessage}>
              Se activó la asistencia de recaída desde el Apple Watch. Toma un respiro: cada día de avance cuenta.
            </Text>

            {/* Sub-sección 1: Llamar Padrino */}
            <View style={styles.sosSponsorBox}>
              {hasSponsor ? (
                <>
                  <View style={styles.sosSponsorTop}>
                    <View style={styles.sponsorInitialCircle}>
                      <Text style={styles.sponsorInitialText}>
                        {(sponsor.name || sponsor.phone).charAt(0)}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.sponsorName}>{sponsor.name || 'Persona de apoyo'}</Text>
                      <Text style={styles.sponsorRole}>{sponsor.role}</Text>
                      <Text style={styles.sponsorPhone}>{sponsor.phone}</Text>
                    </View>
                    {isCallingSponsor && (
                      <View style={styles.activeCallBadge}>
                        <Text style={styles.activeCallBadgeText}>EN LLAMADA</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.sponsorActionRow}>
                    {isCallingSponsor ? (
                      <TouchableOpacity
                        onPress={endCallSponsor}
                        style={styles.hangupSponsorBtn}
                        accessibilityRole="button"
                        accessibilityLabel="Finalizar llamada"
                      >
                        <Text style={styles.hangupSponsorText}>Finalizar Llamada</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        onPress={startCallSponsor}
                        style={styles.callSponsorBtn}
                        accessibilityRole="button"
                        accessibilityLabel={`Llamar a ${sponsor.name || sponsor.phone}`}
                      >
                        <Text style={styles.callSponsorText}>Llamar</Text>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      onPress={messageSponsor}
                      style={styles.msgSponsorBtn}
                      accessibilityRole="button"
                      accessibilityLabel={`Enviar mensaje de apoyo a ${sponsor.name || sponsor.phone}`}
                    >
                      <Text style={styles.msgSponsorText}>Enviar Mensaje</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <>
                  <Text style={styles.sponsorRole}>
                    Aún no has configurado a nadie de confianza.
                  </Text>
                  <TouchableOpacity
                    onPress={openSponsorModal}
                    style={styles.sponsorSetupBtn}
                    accessibilityRole="button"
                    accessibilityLabel="Configurar persona de apoyo"
                  >
                    <Text style={styles.sponsorSetupBtnText}>Configurar persona de apoyo</Text>
                  </TouchableOpacity>
                </>
              )}
              <Text style={styles.crisisNote}>
                Si sientes que estás en peligro, busca ayuda profesional. En México:
                Línea de la Vida 800 911 2000 (24 h, gratuita).
              </Text>
            </View>


            {/* Sub-sección 2: Perla de hoy (biblia.json) */}
            <View style={styles.sosBibleBox}>
              <View style={styles.bibleHeaderRow}>
                <View style={styles.goldIndicatorLine} />
                <Text style={styles.bibleTitle}>Perla de hoy · biblia.json</Text>
              </View>

              {isVerseLoading ? (
                <View style={styles.bibleLoading}>
                  <ActivityIndicator color="#FBBF24" size="small" />
                  <Text style={styles.bibleLoadingText}>Cargando versículo...</Text>
                </View>
              ) : relapseVerse ? (
                <View style={styles.bibleVerseBox}>
                  <Text style={styles.bibleVerseRef}>{relapseVerse.reference}</Text>
                  <Text style={styles.bibleVerseText}>"{relapseVerse.text}"</Text>
                </View>
              ) : (
                <Text style={styles.bibleVerseText}>
                  "Todo lo puedo en Cristo que me fortalece." — Filipenses 4:13
                </Text>
              )}

              <TouchableOpacity
                onPress={() => fetchNewVerse()}
                style={styles.newVerseBtn}
              >
                <Text style={styles.newVerseBtnText}>Generar otra Perla Bíblica</Text>
              </TouchableOpacity>
            </View>

            {/* Acciones de resolución del SOS */}
            <View style={styles.sosResolutionRow}>
              <TouchableOpacity
                onPress={dismissRelapseSOS}
                style={styles.sosSafeBtn}
              >
                <Text style={styles.sosSafeText}>Superé la tentación</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setShowResetModal(true);
                }}
                style={styles.sosResetBtn}
              >
                <Text style={styles.sosResetText}>Hubo recaída</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Selector horizontal de metas */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.trackersPills}
        >
          {trackers.map((t) => {
            const isSelected = t.id === activeTracker.id;
            return (
              <TouchableOpacity
                key={t.id}
                onPress={() => selectTracker(t.id)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={`Meta ${t.title}${isSelected ? ', seleccionada, se muestra en el reloj' : ''}`}
                accessibilityState={{ selected: isSelected }}
                style={[
                  styles.trackerPill,
                  { minHeight: 44 },
                  isSelected && [
                    styles.trackerPillActive,
                    { borderColor: t.color, backgroundColor: `${t.color}22` },
                  ],
                ]}
              >
                <View style={[styles.pillDot, { backgroundColor: t.color }]} />
                <Text
                  style={[
                    styles.trackerPillText,
                    isSelected && { color: '#FFFFFF', fontWeight: '800' },
                  ]}
                >
                  {t.title}
                </Text>
                {isSelected && (
                  <View style={[styles.watchBadge, { backgroundColor: t.color }]}>
                    <Text style={styles.watchBadgeText}>EN WATCH</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Tarjeta Principal: Desglose en tiempo real */}
        <View style={[styles.mainCard, { borderColor: `${activeTracker.color}40` }]}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.activeIconContainer}>
              <View style={[styles.activeTagBox, { backgroundColor: `${activeTracker.color}25`, borderColor: activeTracker.color }]}>
                <Text style={[styles.activeTagText, { color: activeTracker.color }]}>
                  {activeTracker.tag || 'META'}
                </Text>
              </View>
              <View>
                <Text style={styles.activeTitle}>{activeTracker.title}</Text>
                <Text style={styles.activePledge}>
                  {activeTracker.pledge || 'Un día a la vez'}
                </Text>
              </View>
            </View>
            <View
              style={[
                styles.livePulseDot,
                { backgroundColor: activeTracker.color },
              ]}
            />
          </View>

          {/* Cuadrícula detallada: DÍAS, HORAS, MINUTOS, SEGUNDOS */}
          <View style={styles.timeGrid}>
            <View style={styles.timeBox}>
              <Text style={[styles.timeBoxNumber, { color: activeTracker.color }]}>
                {elapsed.days}
              </Text>
              <Text style={styles.timeBoxLabel}>DÍAS</Text>
            </View>

            <View style={styles.timeDivider}>
              <Text style={styles.colon}>:</Text>
            </View>

            <View style={styles.timeBox}>
              <Text style={styles.timeBoxNumber}>
                {elapsed.hours.toString().padStart(2, '0')}
              </Text>
              <Text style={styles.timeBoxLabel}>HORAS</Text>
            </View>

            <View style={styles.timeDivider}>
              <Text style={styles.colon}>:</Text>
            </View>

            <View style={styles.timeBox}>
              <Text style={styles.timeBoxNumber}>
                {elapsed.minutes.toString().padStart(2, '0')}
              </Text>
              <Text style={styles.timeBoxLabel}>MIN</Text>
            </View>

            <View style={styles.timeDivider}>
              <Text style={styles.colon}>:</Text>
            </View>

            <View style={styles.timeBox}>
              <Text style={[styles.timeBoxNumber, { color: '#9CA3AF' }]}>
                {elapsed.seconds.toString().padStart(2, '0')}
              </Text>
              <Text style={styles.timeBoxLabel}>SEG</Text>
            </View>
          </View>

          {/* Fechas y total acumulado */}
          <View style={styles.dateMetaRow}>
            <Text style={styles.dateMetaLabel}>Inicio del camino:</Text>
            <Text style={styles.dateMetaValue}>
              {formatFullDate(activeTracker.startDate)}
            </Text>
          </View>
          <View style={styles.dateMetaRow}>
            <Text style={styles.dateMetaLabel}>Horas totales sobrio:</Text>
            <Text style={[styles.dateMetaValue, { color: activeTracker.color }]}>
              {totalHours.toLocaleString()} horas
            </Text>
          </View>
          {(activeTracker.bestStreakDays ?? 0) > 0 && (
            <View style={styles.dateMetaRow}>
              <Text style={styles.dateMetaLabel}>Mejor racha anterior:</Text>
              <Text style={styles.dateMetaValue}>
                {activeTracker.bestStreakDays} días
                {activeTracker.relapseCount
                  ? ` · ${activeTracker.relapseCount} ${activeTracker.relapseCount === 1 ? 'reinicio' : 'reinicios'}`
                  : ''}
              </Text>
            </View>
          )}
        </View>

        {/* Progreso de la Próxima Meta */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Fichas y Metas de Sobriedad</Text>
            {next && (
              <Text style={[styles.progressTag, { color: activeTracker.color }]}>
                {progressPct}% hacia {next.label}
              </Text>
            )}
          </View>

          {/* Barra de progreso */}
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${progressPct}%`,
                  backgroundColor: activeTracker.color,
                },
              ]}
            />
          </View>

          {/* Fichas visuales */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.milestonesRow}
          >
            {SOBRIETY_MILESTONES.map((m) => {
              const unlocked = elapsed.days >= m.days;
              return (
                <View
                  key={m.days}
                  accessible
                  accessibilityLabel={`Ficha de ${m.label}: ${unlocked ? 'lograda' : 'pendiente'}`}
                  style={[
                    styles.milestoneBadge,
                    unlocked && [
                      styles.milestoneUnlocked,
                      { borderColor: m.chipColor },
                    ],
                  ]}
                >
                  <View
                    style={[
                      styles.chipCircle,
                      {
                        backgroundColor: unlocked ? m.chipColor : '#2A2D35',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: unlocked ? '#000000' : '#6B7280' },
                      ]}
                    >
                      {m.badge}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.milestoneLabel,
                      unlocked && { color: '#E5E7EB', fontWeight: '700' },
                    ]}
                  >
                    {m.label}
                  </Text>
                  <Text style={styles.chipStatus}>
                    {unlocked ? 'Logrado' : `${m.days}d`}
                  </Text>
                </View>
              );
            })}
          </ScrollView>
        </View>

        {/* Botones de Control */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            onPress={() => {
              setCustomDaysAgo(elapsed.days.toString());
              setShowEditDateModal(true);
            }}
            style={styles.actionBtnOutline}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Ajustar días o fecha de inicio"
          >
            <Text style={styles.actionBtnOutlineText}>Ajustar Días / Fecha</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => triggerRelapseSOS()}
            style={styles.actionBtnSOS}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="SOS: necesito ayuda por tentación de recaída"
          >
            <Text style={styles.actionBtnSOSText}>SOS Recaída</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={openSponsorModal}
          style={styles.sponsorSetupBtn}
          accessibilityRole="button"
          accessibilityLabel={
            hasSponsor
              ? `Editar persona de apoyo: ${sponsor.name}`
              : 'Configurar persona de apoyo'
          }
        >
          <Text style={styles.sponsorSetupBtnText}>
            {hasSponsor ? `Persona de apoyo: ${sponsor.name || sponsor.phone}` : 'Configurar persona de apoyo'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setShowDeleteModal(true)}
          style={styles.deleteLink}
          accessibilityRole="button"
          accessibilityLabel={`Eliminar la meta ${activeTracker.title}`}
        >
          <Text style={styles.deleteLinkText}>Eliminar esta meta</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* Modal: Confirmar Reinicio por Recaída */}
      <Modal visible={showResetModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>¿Reiniciar contador?</Text>
            <Text style={styles.modalBody}>
              Una recaída o desliz es parte del camino humano, no borra el
              aprendizaje ni los días que ya lograste. Tu esfuerzo vale.{'\n\n'}
              ¿Deseas reiniciar la fecha de inicio a este momento exacto?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => setShowResetModal(false)}
                style={styles.modalBtnCancel}
              >
                <Text style={styles.modalBtnCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  resetTracker(activeTracker.id);
                  setShowResetModal(false);
                  dismissRelapseSOS();
                }}
                style={styles.modalBtnConfirm}
              >
                <Text style={styles.modalBtnConfirmText}>Reiniciar a Hoy</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal: Editar Días / Fecha */}
      <Modal visible={showEditDateModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Ajustar Días Acumulados</Text>
            <Text style={styles.modalBody}>
              Ingresa cuántos días llevas sobrio actualmente para ajustar la
              fecha de inicio automáticamente:
            </Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="number-pad"
              value={customDaysAgo}
              onChangeText={setCustomDaysAgo}
              placeholder="Ej. 45"
              placeholderTextColor="#6B7280"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => setShowEditDateModal(false)}
                style={styles.modalBtnCancel}
              >
                <Text style={styles.modalBtnCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleApplyCustomDays}
                style={[styles.modalBtnConfirm, { backgroundColor: activeTracker.color }]}
              >
                <Text style={[styles.modalBtnConfirmText, { color: '#000000' }]}>
                  Guardar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {addTrackerModal}

      {sponsorModal}

      {/* Modal: Confirmar eliminar meta */}
      <Modal visible={showDeleteModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle} accessibilityRole="header">
              ¿Eliminar esta meta?
            </Text>
            <Text style={styles.modalBody}>
              Se borrará "{activeTracker?.title}" con todo su progreso. Esta acción
              no se puede deshacer.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => setShowDeleteModal(false)}
                style={styles.modalBtnCancel}
                accessibilityRole="button"
                accessibilityLabel="Cancelar"
              >
                <Text style={styles.modalBtnCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  if (activeTracker) deleteTracker(activeTracker.id);
                  setShowDeleteModal(false);
                }}
                style={styles.modalBtnConfirm}
                accessibilityRole="button"
                accessibilityLabel="Confirmar eliminar meta"
              >
                <Text style={styles.modalBtnConfirmText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>

  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    paddingTop: 12,
    paddingBottom: 20,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 22,
    height: 24,
    marginBottom: 6,
  },
  statusTime: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  statusIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusIcon: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  batteryIcon: {
    width: 20,
    height: 10,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
    padding: 1,
  },
  batteryFill: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    color: '#9CA3AF',
    fontSize: 11,
    marginTop: 1,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1F2937',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#30D158',
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 22,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 14,
    paddingBottom: 24,
    gap: 12,
  },
  // SOS Card (Alerta sincronizada desde Watch)
  sosCard: {
    backgroundColor: '#180F12',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#FF453A',
    padding: 14,
    gap: 10,
  },
  sosBannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sosHeaderPulse: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sosPulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF453A',
  },
  sosBadgeTitle: {
    color: '#FF6961',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  sosCloseBtn: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 6,
  },
  sosCloseText: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '700',
  },
  sosBannerMessage: {
    color: '#D1D5DB',
    fontSize: 11,
    lineHeight: 16,
  },
  sosSponsorBox: {
    backgroundColor: '#151922',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#252F42',
    gap: 8,
  },
  sosSponsorTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sponsorInitialCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0F2B1D',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#30D158',
  },
  sponsorInitialText: {
    color: '#30D158',
    fontSize: 16,
    fontWeight: '900',
  },
  sponsorName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  sponsorRole: {
    color: '#9CA3AF',
    fontSize: 10,
  },
  sponsorPhone: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  activeCallBadge: {
    backgroundColor: 'rgba(48, 209, 88, 0.25)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  activeCallBadgeText: {
    color: '#30D158',
    fontSize: 8,
    fontWeight: '900',
  },
  sponsorActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  callSponsorBtn: {
    flex: 1,
    backgroundColor: '#0F5132',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  callSponsorText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  hangupSponsorBtn: {
    flex: 1,
    backgroundColor: '#FF453A',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  hangupSponsorText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  msgSponsorBtn: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  msgSponsorText: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '700',
  },
  // Bible Box
  sosBibleBox: {
    backgroundColor: '#1D1812',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#543D1A',
    gap: 6,
  },
  bibleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  goldIndicatorLine: {
    width: 3,
    height: 12,
    borderRadius: 1.5,
    backgroundColor: '#F59E0B',
  },
  bibleTitle: {
    color: '#FBBF24',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  bibleLoading: {
    paddingVertical: 12,
    alignItems: 'center',
    gap: 4,
  },
  bibleLoadingText: {
    color: '#9CA3AF',
    fontSize: 10,
  },
  bibleVerseBox: {
    gap: 4,
  },
  bibleVerseRef: {
    color: '#FDE68A',
    fontSize: 11,
    fontWeight: '800',
  },
  bibleVerseText: {
    color: '#E5E7EB',
    fontSize: 11,
    lineHeight: 16,
    fontStyle: 'italic',
  },
  newVerseBtn: {
    backgroundColor: '#2D2214',
    borderRadius: 8,
    paddingVertical: 6,
    alignItems: 'center',
    marginTop: 2,
    borderWidth: 0.5,
    borderColor: '#543D1A',
  },
  newVerseBtnText: {
    color: '#FBBF24',
    fontSize: 10,
    fontWeight: '700',
  },
  sosResolutionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  sosSafeBtn: {
    flex: 1,
    backgroundColor: '#10B981',
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: 'center',
  },
  sosSafeText: {
    color: '#000000',
    fontSize: 11,
    fontWeight: '900',
  },
  sosResetBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 69, 58, 0.2)',
    borderWidth: 1,
    borderColor: '#FF453A',
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: 'center',
  },
  sosResetText: {
    color: '#FF453A',
    fontSize: 11,
    fontWeight: '800',
  },
  // Trackers and Main card
  trackersPills: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 2,
  },
  trackerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#181A20',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#262A34',
    gap: 6,
  },
  trackerPillActive: {
    borderColor: '#30D158',
  },
  pillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  trackerPillText: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '600',
  },
  watchBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
    marginLeft: 3,
  },
  watchBadgeText: {
    color: '#000000',
    fontSize: 8,
    fontWeight: '900',
  },
  mainCard: {
    backgroundColor: '#12141A',
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 14,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  activeIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  activeTagBox: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  activeTagText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  activeTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  activePledge: {
    color: '#8B949E',
    fontSize: 11,
    marginTop: 2,
    fontStyle: 'italic',
  },
  livePulseDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
  },
  timeGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1A1D24',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  timeBox: {
    flex: 1,
    alignItems: 'center',
  },
  timeBoxNumber: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  timeBoxLabel: {
    color: '#6B7280',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  timeDivider: {
    paddingBottom: 10,
  },
  colon: {
    color: '#4B5563',
    fontSize: 18,
    fontWeight: '800',
  },
  dateMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
  },
  dateMetaLabel: {
    color: '#6B7280',
    fontSize: 11,
  },
  dateMetaValue: {
    color: '#D1D5DB',
    fontSize: 11,
    fontWeight: '600',
  },
  sectionCard: {
    backgroundColor: '#12141A',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#21262D',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  progressTag: {
    fontSize: 10,
    fontWeight: '800',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#262A34',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  milestonesRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 2,
  },
  milestoneBadge: {
    alignItems: 'center',
    backgroundColor: '#1A1D24',
    borderRadius: 12,
    padding: 8,
    width: 68,
    borderWidth: 1,
    borderColor: '#2B303C',
  },
  milestoneUnlocked: {
    backgroundColor: '#16221D',
  },
  chipCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  chipText: {
    fontSize: 10,
    fontWeight: '900',
  },
  milestoneLabel: {
    color: '#9CA3AF',
    fontSize: 9,
    textAlign: 'center',
  },
  chipStatus: {
    color: '#9CA3AF',
    fontSize: 10,
    marginTop: 2,
    fontWeight: '600',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  actionBtnOutline: {
    flex: 1,
    backgroundColor: '#1F2937',
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: 10,
    alignItems: 'center',
  },
  actionBtnOutlineText: {
    color: '#E5E7EB',
    fontSize: 12,
    fontWeight: '700',
  },
  actionBtnSOS: {
    flex: 1,
    backgroundColor: 'rgba(255, 69, 58, 0.15)',
    borderWidth: 1,
    borderColor: '#FF453A',
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: 10,
    alignItems: 'center',
  },
  actionBtnSOSText: {
    color: '#FF453A',
    fontSize: 12,
    fontWeight: '800',
  },
  deleteLink: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  deleteLinkText: {
    color: '#9CA3AF',
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },
  modalBox: {
    width: '100%',
    maxWidth: 310,
    backgroundColor: '#1C1F26',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#2F3542',
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalBody: {
    color: '#9CA3AF',
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
    marginBottom: 14,
  },
  modalInput: {
    backgroundColor: '#2A2E39',
    color: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    marginBottom: 10,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  modalBtnCancel: {
    flex: 1,
    backgroundColor: '#2A2E39',
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: 10,
    alignItems: 'center',
  },
  modalBtnCancelText: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '700',
  },
  modalBtnConfirm: {
    flex: 1,
    backgroundColor: '#FF453A',
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: 10,
    alignItems: 'center',
  },
  modalBtnConfirmText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  presetHeading: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2E39',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#383E4D',
    gap: 6,
  },
  presetDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  presetChipText: {
    color: '#D1D5DB',
    fontSize: 11,
    fontWeight: '600',
  },
  inputLabel: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  colorsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 8,
    paddingHorizontal: 4,
  },
  colorDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorDotSelected: {
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.15 }],
  },
  emptyPrompt: {
    color: '#9CA3AF',
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 18,
  },
  onboarding: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  onboardingTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10,
  },
  onboardingBtn: {
    minHeight: 48,
    minWidth: 200,
    backgroundColor: '#30D158',
    borderRadius: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onboardingBtnText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '800',
  },
  sponsorSetupBtn: {
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#0A84FF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  sponsorSetupBtnText: {
    color: '#64D2FF',
    fontSize: 13,
    fontWeight: '700',
  },
  streakText: {
    color: '#D1D5DB',
    fontSize: 12,
  },
  crisisNote: {
    color: '#9CA3AF',
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
    marginTop: 4,
  },
});
