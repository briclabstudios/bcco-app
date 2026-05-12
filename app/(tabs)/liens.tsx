import { useState, useEffect, useCallback } from 'react'
import { View, StyleSheet, FlatList, Linking, TouchableOpacity, Alert } from 'react-native'
import { Text, Button, TextInput, ActivityIndicator, Modal, Portal, IconButton } from 'react-native-paper'
import { useFocusEffect } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { colors } from '../../constants/theme'

type Lien = {
  id: string
  description: string
  url: string
  created_at: string
  created_by: string
}

export default function LiensScreen() {
  const { session, profile } = useAuth()
  const [liens, setLiens]       = useState<Lien[]>([])
  const [loading, setLoading]   = useState(true)
  const [modalVisible, setModalVisible] = useState(false)
  const [description, setDescription]   = useState('')
  const [url, setUrl]                   = useState('')
  const [saving, setSaving]             = useState(false)

  async function fetchLiens() {
    setLoading(true)
    const { data } = await supabase
      .from('ressource')
      .select('*')
      .order('created_at', { ascending: false })
    setLiens(data ?? [])
    setLoading(false)
  }

  useFocusEffect(useCallback(() => { fetchLiens() }, []))

  function openModal() {
    setDescription('')
    setUrl('')
    setModalVisible(true)
  }

  async function handleSave() {
    if (!description.trim()) {
      Alert.alert('Erreur', 'La description est obligatoire.')
      return
    }
    if (!url.trim()) {
      Alert.alert('Erreur', "L'URL est obligatoire.")
      return
    }
    // Ajout automatique du protocole si manquant
    const finalUrl = url.startsWith('http') ? url.trim() : `https://${url.trim()}`

    setSaving(true)
    const { error } = await supabase.from('ressource').insert({
      description: description.trim(),
      url: finalUrl,
      created_by: session?.user.id,
    })
    setSaving(false)
    if (error) {
      Alert.alert('Erreur', "Impossible d'ajouter le lien.")
    } else {
      setModalVisible(false)
      fetchLiens()
    }
  }

  async function handleDelete(id: string) {
    Alert.alert(
      'Supprimer',
      'Supprimer ce lien ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await supabase.from('ressource').delete().eq('id', id)
            fetchLiens()
          },
        },
      ]
    )
  }

  function openUrl(url: string) {
    Linking.openURL(url).catch(() =>
      Alert.alert('Erreur', "Impossible d'ouvrir ce lien.")
    )
  }

  const canDelete = (lien: Lien) =>
    profile?.role === 'admin' || lien.created_by === session?.user.id

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.gold} />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {(profile?.role === 'admin' || profile?.role === 'rédacteur') && (
        <Button
          mode="contained"
          onPress={openModal}
          buttonColor={colors.gold}
          labelStyle={{ color: colors.background, fontWeight: 'bold' }}
          icon="plus"
          style={styles.addButton}
        >
          Ajouter une ressource
        </Button>
      )}

      {liens.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Aucun lien pour l'instant.</Text>
        </View>
      ) : (
        <FlatList
          data={liens}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => openUrl(item.url)} activeOpacity={0.7}>
              <View style={styles.cardContent}>
                <View style={styles.cardTexts}>
                  <Text style={styles.cardDescription}>{item.description}</Text>
                  <Text style={styles.cardUrl} numberOfLines={1}>{item.url}</Text>
                </View>
                <View style={styles.cardActions}>
                  <IconButton
                    icon="open-in-new"
                    iconColor={colors.gold}
                    size={20}
                    onPress={() => openUrl(item.url)}
                  />
                  {canDelete(item) && (
                    <IconButton
                      icon="trash-can-outline"
                      iconColor={colors.error}
                      size={20}
                      onPress={() => handleDelete(item.id)}
                    />
                  )}
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Modal ajout */}
      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <Text style={styles.modalTitle}>Ajouter une ressource</Text>

          <TextInput
            label="Description"
            value={description}
            onChangeText={setDescription}
            mode="outlined"
            outlineColor={colors.border}
            activeOutlineColor={colors.gold}
            textColor={colors.text}
            style={styles.input}
            theme={{ colors: { onSurfaceVariant: colors.textMuted, background: colors.surface } }}
            placeholder="Ex : Site officiel de la FFB"
          />

          <TextInput
            label="URL"
            value={url}
            onChangeText={setUrl}
            mode="outlined"
            outlineColor={colors.border}
            activeOutlineColor={colors.gold}
            textColor={colors.text}
            style={styles.input}
            theme={{ colors: { onSurfaceVariant: colors.textMuted, background: colors.surface } }}
            placeholder="https://..."
            autoCapitalize="none"
            keyboardType="url"
          />

          <Button
            mode="contained"
            onPress={handleSave}
            loading={saving}
            disabled={saving}
            buttonColor={colors.gold}
            labelStyle={{ color: colors.background, fontWeight: 'bold' }}
            style={{ marginTop: 8 }}
          >
            Ajouter
          </Button>

          <Button
            mode="text"
            onPress={() => setModalVisible(false)}
            textColor={colors.textMuted}
            disabled={saving}
          >
            Annuler
          </Button>
        </Modal>
      </Portal>
    </View>
  )
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: colors.background },
  center:     { flex: 1, alignItems: 'center', justifyContent: 'center' },
  addButton:  { margin: 16, borderRadius: 8 },
  list:       { paddingHorizontal: 16, paddingBottom: 24, gap: 12 },
  empty:      { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText:  { color: colors.textMuted, fontSize: 15 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardContent:  { flexDirection: 'row', alignItems: 'center', padding: 12 },
  cardTexts:    { flex: 1 },
  cardDescription: { fontSize: 15, color: colors.text, fontWeight: '600', marginBottom: 2 },
  cardUrl:      { fontSize: 12, color: colors.textMuted },
  cardActions:  { flexDirection: 'row', alignItems: 'center' },
  modal: {
    backgroundColor: colors.surface,
    margin: 24,
    borderRadius: 16,
    padding: 24,
    gap: 12,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: colors.gold, marginBottom: 8 },
  input:      { backgroundColor: colors.surface },
  error:      { color: colors.error },
})
