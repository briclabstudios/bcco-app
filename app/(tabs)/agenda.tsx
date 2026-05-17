import { useState, useCallback } from 'react'
import { View, StyleSheet, ScrollView } from 'react-native'
import { Text, FAB, ActivityIndicator } from 'react-native-paper'
import { useRouter, useFocusEffect } from 'expo-router'
import { Calendar, LocaleConfig } from 'react-native-calendars'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { colors } from '../../constants/theme'
import EventCard, { AgendaEvent } from '../../components/EventCard'

LocaleConfig.locales['fr'] = {
  monthNames: ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'],
  monthNamesShort: ['Janv.','Févr.','Mars','Avr.','Mai','Juin','Juil.','Août','Sept.','Oct.','Nov.','Déc.'],
  dayNames: ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'],
  dayNamesShort: ['Dim.','Lun.','Mar.','Mer.','Jeu.','Ven.','Sam.'],
  today: "Aujourd'hui",
}
LocaleConfig.defaultLocale = 'fr'

const calendarTheme = {
  backgroundColor:            colors.surface,
  calendarBackground:         colors.surface,
  textSectionTitleColor:      colors.textMuted,
  selectedDayBackgroundColor: colors.gold,
  selectedDayTextColor:       colors.background,
  todayTextColor:             colors.goldLight,
  dayTextColor:               colors.text,
  textDisabledColor:          colors.border,
  dotColor:                   colors.gold,
  selectedDotColor:           colors.background,
  arrowColor:                 colors.gold,
  monthTextColor:             colors.gold,
  textMonthFontWeight:        'bold' as const,
  textDayFontSize:            14,
  textMonthFontSize:          16,
}

function formatDateFr(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
}

export default function AgendaScreen() {
  const { profile, session } = useAuth()
  const router = useRouter()

  const [events, setEvents]             = useState<AgendaEvent[]>([])
  const [loading, setLoading]           = useState(true)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [visibleMonth, setVisibleMonth] = useState(new Date().toISOString().slice(0, 7))

  const canCreate = profile?.role === 'rédacteur' || profile?.role === 'admin'

  useFocusEffect(
    useCallback(() => { fetchEvents() }, [])
  )

  async function fetchEvents() {
    const { data } = await supabase
      .from('agenda_events')
      .select('*, author:profiles!auteur_id(nom, prenom)')
      .order('date_debut', { ascending: true })
    if (data) setEvents(data as AgendaEvent[])
    setLoading(false)
  }

  // Calcul des dates marquées pour le calendrier
  const markedDates: Record<string, any> = {}
  events.forEach(event => {
    const start = event.date_debut.split('T')[0]
    const end   = event.date_fin ? event.date_fin.split('T')[0] : start
    const cur  = new Date(start + 'T00:00:00')
    const endD = new Date(end   + 'T00:00:00')
    while (cur <= endD) {
      const d = [
        cur.getFullYear(),
        String(cur.getMonth() + 1).padStart(2, '0'),
        String(cur.getDate()).padStart(2, '0'),
      ].join('-')
      markedDates[d] = { marked: true, dotColor: colors.gold }
      cur.setDate(cur.getDate() + 1)
    }
  })
  if (selectedDate) {
    markedDates[selectedDate] = {
      ...markedDates[selectedDate],
      selected: true,
      selectedColor: colors.gold,
    }
  }

  const displayedEvents = selectedDate
    ? events.filter(e => {
        const start = e.date_debut.split('T')[0]
        const end   = e.date_fin ? e.date_fin.split('T')[0] : start
        return selectedDate >= start && selectedDate <= end
      })
    : events.filter(e => e.date_debut.startsWith(visibleMonth))

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.gold} size="large" />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        <Calendar
          markedDates={markedDates}
          onDayPress={day =>
            setSelectedDate(prev => prev === day.dateString ? null : day.dateString)
          }
          onMonthChange={month => {
            setVisibleMonth(month.dateString.slice(0, 7))
            setSelectedDate(null)
          }}
          theme={calendarTheme}
          style={styles.calendar}
        />

        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>
            {selectedDate ? formatDateFr(selectedDate) : 'Événements du mois en cours'}
          </Text>
          {selectedDate && (
            <Text style={styles.clearFilter} onPress={() => setSelectedDate(null)}>
              Voir tous les événements du mois en cours
            </Text>
          )}
        </View>

        {displayedEvents.length === 0 ? (
          <Text style={styles.empty}>
            Aucun événement{selectedDate ? ' ce jour.' : ' ce mois-ci.'}
          </Text>
        ) : (
          displayedEvents.map(event => (
            <EventCard key={event.id} event={event} currentUserId={session?.user.id} isAdmin={profile?.role === 'admin'} />
          ))
        )}

        <View style={{ height: 90 }} />
      </ScrollView>

      {canCreate && (
        <FAB
          icon="plus"
          label="Ajouter un événement"
          style={styles.fab}
          color={colors.background}
          onPress={() => router.push('/agenda/new')}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  calendar: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  listTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.gold,
    textTransform: 'capitalize',
  },
  clearFilter: {
    fontSize: 13,
    color: colors.textMuted,
    textDecorationLine: 'underline',
  },
  empty: {
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 32,
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: colors.gold,
    borderRadius: 16,
  },
})
