import { useState, useEffect } from 'react'
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native'
import { Text, TextInput, Button, ActivityIndicator } from 'react-native-paper'
import { Calendar } from 'react-native-calendars'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../../../lib/supabase'
import { uploadPostImage } from '../../../lib/uploadImage'
import { useAuth } from '../../../contexts/AuthContext'
import { colors } from '../../../constants/theme'
import ImagePickerField from '../../../components/ImagePickerField'

type EventType = 'tournoi' | 'événement' | 'autre'
type Discipline = 'snooker' | 'carambole'

const calendarTheme = {
  backgroundColor:            colors.surfaceVariant,
  calendarBackground:         colors.surfaceVariant,
  textSectionTitleColor:      colors.textMuted,
  selectedDayBackgroundColor: colors.gold,
  selectedDayTextColor:       colors.background,
  todayTextColor:             colors.goldLight,
  dayTextColor:               colors.text,
  textDisabledColor:          colors.border,
  arrowColor:                 colors.gold,
  monthTextColor:             colors.gold,
  textMonthFontWeight:        'bold' as const,
}

function formatDateFr(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

export default function EditEventScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { session } = useAuth()
  const router  = useRouter()

  const [titre, setTitre]             = useState('')
  const [description, setDescription] = useState('')
  const [type, setType]               = useState<EventType>('événement')
  const [discipline, setDiscipline]   = useState<Discipline>('snooker')
  const [dateDebut, setDateDebut]     = useState('')
  const [dateFin, setDateFin]         = useState('')
  const [showDebutCal, setShowDebutCal] = useState(false)
  const [showFinCal, setShowFinCal]     = useState(false)
  const [imageUri, setImageUri]       = useState<string | null>(null)
  const [loading, setLoading]         = useState(true)
  const [saving, setSaving]           = useState(false)
  const [deleting, setDeleting]       = useState(false)

  useEffect(() => {
    async function fetchEvent() {
      const { data } = await supabase
        .from('agenda_events')
        .select('*')
        .eq('id', id)
        .single()
      if (data) {
        setTitre(data.titre)
        setDescription(data.description ?? '')
        setType(data.type_evenement)
        setDiscipline(data.discipline)
        setDateDebut(data.date_debut.split('T')[0])
        setDateFin(data.date_fin ? data.date_fin.split('T')[0] : '')
        setImageUri(data.image_url ?? null)
      }
      setLoading(false)
    }
    if (id) fetchEvent()
  }, [id])

  async function handleSave() {
    if (!titre.trim()) { Alert.alert('Erreur', 'Le titre est obligatoire.'); return }
    if (!dateDebut)    { Alert.alert('Erreur', 'La date de début est obligatoire.'); return }
    setSaving(true)
    try {
      let image_url: string | null = null
      if (imageUri?.startsWith('file://') && session) {
        image_url = await uploadPostImage(imageUri, session.user.id)
      } else {
        image_url = imageUri
      }
      const { error } = await supabase
        .from('agenda_events')
        .update({
          titre:          titre.trim(),
          description:    description.trim() || null,
          type_evenement: type,
          discipline,
          date_debut: dateDebut + 'T00:00:00.000Z',
          date_fin:   dateFin ? dateFin + 'T00:00:00.000Z' : null,
          image_url,
        })
        .eq('id', id)
      if (error) Alert.alert('Erreur', "Impossible de modifier l'événement.")
      else router.back()
    } catch {
      Alert.alert('Erreur', "Impossible d'envoyer l'image.")
    }
    setSaving(false)
  }

  function handleDelete() {
    Alert.alert(
      "Supprimer l'événement",
      'Cette action est irréversible. Confirmer la suppression ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true)
            const { error } = await supabase.from('agenda_events').delete().eq('id', id)
            if (error) {
              Alert.alert('Erreur', "Impossible de supprimer l'événement.")
              setDeleting(false)
            } else {
              router.back()
            }
          },
        },
      ]
    )
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.gold} size="large" />
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

      <TextInput
        label="Titre *"
        value={titre}
        onChangeText={setTitre}
        mode="outlined"
        style={styles.input}
        outlineColor={colors.border}
        activeOutlineColor={colors.gold}
        textColor={colors.text}
        maxLength={100}
      />

      <TextInput
        label="Description"
        value={description}
        onChangeText={setDescription}
        mode="outlined"
        multiline
        numberOfLines={3}
        style={[styles.input, styles.textarea]}
        outlineColor={colors.border}
        activeOutlineColor={colors.gold}
        textColor={colors.text}
      />

      <ImagePickerField
        imageUri={imageUri}
        onPick={setImageUri}
        onRemove={() => setImageUri(null)}
        disabled={saving || deleting}
      />

      <Text style={styles.sectionLabel}>Type *</Text>
      <View style={styles.optionRow}>
        {(['tournoi', 'événement', 'autre'] as EventType[]).map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.optionBtn, type === t && styles.optionBtnSelected]}
            onPress={() => setType(t)}
          >
            <Text style={[styles.optionText, type === t && styles.optionTextSelected]}>
              {t === 'tournoi' ? '🏆 Tournoi' : t === 'événement' ? '📅 Événement' : '📌 Autre'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionLabel}>Discipline *</Text>
      <View style={styles.optionRow}>
        {(['snooker', 'carambole'] as Discipline[]).map(d => (
          <TouchableOpacity
            key={d}
            style={[styles.optionBtn, discipline === d && styles.optionBtnSelected]}
            onPress={() => setDiscipline(d)}
          >
            <Text style={[styles.optionText, discipline === d && styles.optionTextSelected]}>
              {d === 'snooker' ? '🎱 Snooker' : '🟡 Carambole'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionLabel}>Date de début *</Text>
      <TouchableOpacity
        style={styles.datePicker}
        onPress={() => { setShowDebutCal(v => !v); setShowFinCal(false) }}
      >
        <Ionicons name="calendar-outline" color={colors.gold} size={18} />
        <Text style={[styles.dateText, !dateDebut && styles.datePlaceholder]}>
          {dateDebut ? formatDateFr(dateDebut) : 'Sélectionner une date'}
        </Text>
      </TouchableOpacity>
      {showDebutCal && (
        <Calendar
          onDayPress={day => { setDateDebut(day.dateString); setShowDebutCal(false) }}
          markedDates={dateDebut ? { [dateDebut]: { selected: true, selectedColor: colors.gold } } : {}}
          theme={calendarTheme}
          style={styles.inlineCalendar}
        />
      )}

      <Text style={styles.sectionLabel}>
        Date de fin <Text style={styles.optional}>(optionnel)</Text>
      </Text>
      <TouchableOpacity
        style={styles.datePicker}
        onPress={() => { setShowFinCal(v => !v); setShowDebutCal(false) }}
      >
        <Ionicons name="calendar-outline" color={colors.textMuted} size={18} />
        <Text style={[styles.dateText, !dateFin && styles.datePlaceholder]}>
          {dateFin ? formatDateFr(dateFin) : 'Sélectionner une date'}
        </Text>
        {dateFin ? (
          <TouchableOpacity onPress={(e) => { e.stopPropagation(); setDateFin('') }}>
            <Ionicons name="close-circle" color={colors.textMuted} size={18} />
          </TouchableOpacity>
        ) : null}
      </TouchableOpacity>
      {showFinCal && (
        <Calendar
          onDayPress={day => { setDateFin(day.dateString); setShowFinCal(false) }}
          markedDates={dateFin ? { [dateFin]: { selected: true, selectedColor: colors.gold } } : {}}
          minDate={dateDebut || undefined}
          theme={calendarTheme}
          style={styles.inlineCalendar}
        />
      )}

      <Button
        mode="contained"
        onPress={handleSave}
        loading={saving}
        disabled={saving || deleting}
        style={styles.button}
        buttonColor={colors.gold}
        labelStyle={{ color: colors.background, fontWeight: 'bold' }}
      >
        Enregistrer
      </Button>

      <Button mode="text" onPress={() => router.back()} textColor={colors.textMuted} disabled={saving || deleting}>
        Annuler
      </Button>

      <View style={styles.divider} />

      <Button
        mode="outlined"
        onPress={handleDelete}
        loading={deleting}
        disabled={saving || deleting}
        style={styles.deleteButton}
        textColor={colors.error}
        icon="trash-can-outline"
      >
        Supprimer l'événement
      </Button>

    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  content:   { padding: 24, gap: 12 },
  input:     { backgroundColor: colors.surface },
  textarea:  { minHeight: 80 },
  sectionLabel: {
    fontSize: 13,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 4,
  },
  optional: { textTransform: 'none', fontSize: 12 },
  optionRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  optionBtn: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.surface,
  },
  optionBtnSelected: { borderColor: colors.gold, backgroundColor: colors.surfaceVariant },
  optionText:         { color: colors.textMuted, fontSize: 14 },
  optionTextSelected: { color: colors.gold, fontWeight: 'bold' },
  datePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 14,
  },
  dateText:        { flex: 1, color: colors.text, fontSize: 14, textTransform: 'capitalize' },
  datePlaceholder: { color: colors.textMuted },
  inlineCalendar: {
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: -4,
  },
  button:      { marginTop: 8, borderRadius: 8, paddingVertical: 4 },
  divider:     { height: 1, backgroundColor: colors.border, marginVertical: 8 },
  deleteButton: { borderRadius: 8, borderColor: colors.error, paddingVertical: 4 },
})
