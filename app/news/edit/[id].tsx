import { useState, useEffect } from 'react'
import { View, StyleSheet, ScrollView, Alert } from 'react-native'
import { Text, TextInput, Button, Checkbox, ActivityIndicator, Switch } from 'react-native-paper'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { supabase } from '../../../lib/supabase'
import { uploadPostImage } from '../../../lib/uploadImage'
import { useAuth } from '../../../contexts/AuthContext'
import { colors } from '../../../constants/theme'
import ImagePickerField from '../../../components/ImagePickerField'

const TAGS = ['Tournoi', 'Annonce', 'Résultat', 'Événement', 'Snooker', 'Carambole']

export default function EditNewsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { session } = useAuth()
  const router  = useRouter()

  const [titre, setTitre]               = useState('')
  const [description, setDescription]   = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [imageUri, setImageUri]         = useState<string | null>(null)
  const [epingle, setEpingle]           = useState(false)
  const [loading, setLoading]           = useState(true)
  const [saving, setSaving]             = useState(false)
  const [deleting, setDeleting]         = useState(false)

  useEffect(() => {
    async function fetchPost() {
      const { data } = await supabase
        .from('news_posts')
        .select('titre, description, tags, image_url, epingle')
        .eq('id', id)
        .single()
      if (data) {
        setTitre(data.titre)
        setDescription(data.description)
        setSelectedTags(data.tags ?? [])
        setImageUri(data.image_url ?? null)
        setEpingle(data.epingle ?? false)
      }
      setLoading(false)
    }
    if (id) fetchPost()
  }, [id])

  function toggleTag(tag: string) {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  async function handleSave() {
    if (!titre.trim()) { Alert.alert('Erreur', 'Le titre est obligatoire.'); return }
    if (!description.trim()) { Alert.alert('Erreur', 'La description est obligatoire.'); return }
    setSaving(true)
    try {
      let image_url: string | null = null
      // Local URI = nouvelle image à uploader
      if (imageUri?.startsWith('file://') && session) {
        image_url = await uploadPostImage(imageUri, session.user.id)
      } else {
        // URL distante = on garde, null = supprimée
        image_url = imageUri
      }
      const { error } = await supabase
        .from('news_posts')
        .update({ titre: titre.trim(), description: description.trim(), tags: selectedTags, image_url, epingle })
        .eq('id', id)
      if (error) Alert.alert('Erreur', "Impossible de modifier l'actualité.")
      else router.back()
    } catch {
      Alert.alert('Erreur', "Impossible d'envoyer l'image.")
    }
    setSaving(false)
  }

  function handleDelete() {
    Alert.alert(
      'Supprimer la publication',
      'Cette action est irréversible. Confirmer la suppression ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true)
            const { error } = await supabase.from('news_posts').delete().eq('id', id)
            if (error) {
              Alert.alert('Erreur', "Impossible de supprimer la publication.")
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
        disabled={saving || deleting}
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
        <Switch
          value={epingle}
          onValueChange={setEpingle}
          color={colors.error}
          disabled={saving || deleting}
        />
        <View style={styles.pinTexts}>
          <Text style={styles.pinLabel}>Information importante</Text>
          <Text style={styles.pinHint}>Le message sera épinglé en haut de la liste des actualités</Text>
        </View>
      </View>

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
        disabled={deleting || saving}
        style={styles.deleteButton}
        textColor={colors.error}
        icon="trash-can-outline"
      >
        Supprimer la publication
      </Button>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
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
  button:       { marginTop: 8, borderRadius: 8, paddingVertical: 4 },
  divider:      { height: 1, backgroundColor: colors.border, marginVertical: 8 },
  deleteButton: { borderRadius: 8, borderColor: colors.error, paddingVertical: 4 },
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
