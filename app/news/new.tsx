import { useState, useEffect } from 'react'
import { View, StyleSheet, ScrollView, Alert } from 'react-native'
import { Text, TextInput, Button, Checkbox, Switch } from 'react-native-paper'
import { useRouter } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { uploadPostImage } from '../../lib/uploadImage'
import { sendNotification } from '../../lib/notifications'
import { useAuth } from '../../contexts/AuthContext'
import { colors } from '../../constants/theme'
import ImagePickerField from '../../components/ImagePickerField'

const TAGS = ['Tournoi', 'Annonce', 'Résultat', 'Événement', 'Snooker', 'Carambole']

export default function NewNewsScreen() {
  const { session } = useAuth()
  const router = useRouter()

  const [titre, setTitre]             = useState('')
  const [description, setDescription] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [imageUri, setImageUri]       = useState<string | null>(null)
  const [epingle, setEpingle]         = useState(false)
  const [hasEpingle, setHasEpingle]   = useState(false)
  const [sendNotif, setSendNotif]     = useState(true)
  const [loading, setLoading]         = useState(false)

  useEffect(() => {
    supabase
      .from('news_posts')
      .select('id', { count: 'exact', head: true })
      .eq('epingle', true)
      .then(({ count }) => setHasEpingle((count ?? 0) > 0))
  }, [])

  function toggleTag(tag: string) {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  async function handleSubmit() {
    if (!titre.trim()) {
      Alert.alert('Erreur', 'Le titre est obligatoire.')
      return
    }
    if (!description.trim()) {
      Alert.alert('Erreur', 'La description est obligatoire.')
      return
    }
    setLoading(true)
    try {
      let image_url: string | null = null
      if (imageUri && session) {
        image_url = await uploadPostImage(imageUri, session.user.id)
      }
      const { error } = await supabase.from('news_posts').insert({
        titre:       titre.trim(),
        description: description.trim(),
        tags:        selectedTags,
        image_url,
        epingle,
        auteur_id:   session?.user.id,
      })
      if (error) Alert.alert('Erreur', "Impossible de publier l'actualité.")
      else {
        if (sendNotif && session?.access_token) {
          sendNotification('actus', titre.trim(), session.access_token)
        }
        router.back()
      }
    } catch {
      Alert.alert('Erreur', "Impossible d'envoyer l'image.")
    }
    setLoading(false)
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
        label="Description *"
        value={description}
        onChangeText={setDescription}
        mode="outlined"
        multiline
        numberOfLines={5}
        style={[styles.input, styles.textarea]}
        outlineColor={colors.border}
        activeOutlineColor={colors.gold}
        textColor={colors.text}
      />

      <ImagePickerField
        imageUri={imageUri}
        onPick={setImageUri}
        onRemove={() => setImageUri(null)}
        disabled={loading}
      />

      <Text style={styles.sectionLabel}>Tags</Text>
      <View style={styles.tagsGrid}>
        {TAGS.map(tag => (
          <View key={tag} style={styles.checkRow}>
            <Checkbox
              status={selectedTags.includes(tag) ? 'checked' : 'unchecked'}
              onPress={() => toggleTag(tag)}
              color={colors.gold}
            />
            <Text style={styles.checkLabel} onPress={() => toggleTag(tag)}>{tag}</Text>
          </View>
        ))}
      </View>

      <View style={styles.pinRow}>
        <Switch value={sendNotif} onValueChange={setSendNotif} color={colors.gold} disabled={loading} />
        <Text style={styles.pinLabel}>Envoyer une notification aux membres</Text>
      </View>

      {!hasEpingle && <View style={styles.pinRow}>
        <Switch
          value={epingle}
          onValueChange={setEpingle}
          color={colors.error}
          disabled={loading}
        />
        <View style={styles.pinTexts}>
          <Text style={styles.pinLabel}>Information importante</Text>
          <Text style={styles.pinHint}>Le message sera épinglé en haut de la liste des actualités</Text>
        </View>
      </View>}

      <Button
        mode="contained"
        onPress={handleSubmit}
        loading={loading}
        disabled={loading}
        style={styles.button}
        buttonColor={colors.gold}
        labelStyle={{ color: colors.background, fontWeight: 'bold' }}
      >
        Publier
      </Button>

      <Button mode="text" onPress={() => router.back()} textColor={colors.textMuted} disabled={loading}>
        Annuler
      </Button>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content:   { padding: 24, gap: 16 },
  input:     { backgroundColor: colors.surface },
  textarea:  { minHeight: 120 },
  sectionLabel: {
    fontSize: 13,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: -8,
  },
  tagsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  checkRow: { flexDirection: 'row', alignItems: 'center', width: '48%' },
  checkLabel: { color: colors.text, fontSize: 15 },
  button: { marginTop: 8, borderRadius: 8, paddingVertical: 4 },
  pinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
  },
  pinTexts: { flex: 1, gap: 2 },
  pinLabel: { color: colors.text, fontSize: 15, fontWeight: '600' },
  pinHint:  { color: colors.textMuted, fontSize: 12, lineHeight: 16 },
})
