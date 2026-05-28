import { useState, useCallback } from 'react'
import { View, StyleSheet, Linking, TouchableOpacity, Alert } from 'react-native'
import { Text, Button, TextInput, ActivityIndicator, Modal, Portal, IconButton } from 'react-native-paper'
import { useFocusEffect } from 'expo-router'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import DraggableFlatList, { ScaleDecorator, RenderItemParams } from 'react-native-draggable-flatlist'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { colors } from '../../constants/theme'

type Lien = {
  id: string
  description: string
  url: string
  created_at: string
  created_by: string
  ordre: number
}

export default function LiensScreen() {
  const { session, profile } = useAuth()
  const [liens, setLiens]               = useState<Lien[]>([])
  const [loading, setLoading]           = useState(true)
  const [modalVisible, setModalVisible] = useState(false)
  const [description, setDescription]   = useState('')
  const [url, setUrl]                   = useState('')
  const [saving, setSaving]             = useState(false)
  const [reorderMode, setReorderMode]   = useState(false)

  const isAdmin = profile?.role === 'admin'
  const canAdd  = profile?.role === 'admin' || profile?.role === 'rédacteur'

  async function fetchLiens() {
    setLoading(true)
    const { data } = await supabase
      .from('ressource')
      .select('*')
      .order('ordre', { ascending: true })
    setLiens(data ?? [])
    setLoading(false)
  }

  useFocusEffect(useCallback(() => {
    setReorderMode(false)
    fetchLiens()
  }, []))

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
    const finalUrl = url.startsWith('http') ? url.trim() : `https://${url.trim()}`
    setSaving(true)
    const { error } = await supabase.from('ressource').insert({
      description: description.trim(),
      url: finalUrl,
      created_by: session?.user.id,
      ordre: liens.length,
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

  async function handleDragEnd({ data }: { data: Lien[] }) {
    setLiens(data)
    await Promise.all(
      data.map((item, index) =>
        supabase.from('ressource').update({ ordre: index }).eq('id', item.id)
      )
    )
  }

  function openUrl(url: string) {
    Linking.openURL(url).catch(() =>
      Alert.alert('Erreur', "Impossible d'ouvrir ce lien.")
    )
  }

  const canDelete = (lien: Lien) =>
    profile?.role === 'admin' || lien.created_by === session?.user.id

  const renderItem = ({ item, drag, isActive }: RenderItemParams<Lien>) => (
    <ScaleDecorator>
      <TouchableOpacity
        style={[styles.card, isActive && styles.cardDragging]}
        onPress={() => !reorderMode && openUrl(item.url)}
        activeOpacity={reorderMode ? 1 : 0.7}
      >
        <View style={styles.cardContent}>
          {reorderMode ? (
            <TouchableOpacity onPressIn={drag} style={styles.dragHandle} hitSlop={8}>
              <Ionicons name="reorder-three-outline" size={24} color={colors.textMuted} />
            </TouchableOpacity>
          ) : null}
          <View style={styles.cardTexts}>
            <Text style={styles.cardDescription}>{item.description}</Text>
            {!reorderMode && (
              <Text style={styles.cardUrl} numberOfLines={1}>{item.url}</Text>
            )}
          </View>
          {!reorderMode && (
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
          )}
        </View>
      </TouchableOpacity>
    </ScaleDecorator>
  )

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.gold} />
      </View>
    )
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      {/* Barre d'actions */}
      <View style={styles.toolbar}>
        {canAdd && !reorderMode && (
          <Button
            mode="contained"
            onPress={openModal}
            buttonColor={colors.gold}
            labelStyle={{ color: colors.background, fontWeight: 'bold' }}
            icon="plus"
            style={styles.actionButton}
          >
            Ajouter une ressource
          </Button>
        )}
        {isAdmin && liens.length > 1 && (
          <Button
            mode={reorderMode ? 'contained' : 'outlined'}
            onPress={() => setReorderMode(v => !v)}
            buttonColor={reorderMode ? colors.gold : undefined}
            textColor={reorderMode ? colors.background : colors.gold}
            labelStyle={{ fontWeight: 'bold' }}
            icon={reorderMode ? 'check' : 'drag-horizontal-variant'}
            style={styles.actionButton}
          >
            {reorderMode ? 'Terminé' : 'Réorganiser'}
          </Button>
        )}
      </View>

      {liens.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Aucun lien pour l'instant.</Text>
        </View>
      ) : (
        <DraggableFlatList
          data={liens}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          onDragEnd={handleDragEnd}
          renderItem={renderItem}
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
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: colors.background },
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center' },
  toolbar:     { paddingHorizontal: 16, paddingTop: 16, gap: 8 },
  actionButton: { borderRadius: 8 },
  list:        { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24, gap: 12 },
  empty:       { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText:   { color: colors.textMuted, fontSize: 15 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardDragging: {
    borderColor: colors.gold,
    borderWidth: 2,
    shadowColor: colors.gold,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  cardContent:     { flexDirection: 'row', alignItems: 'center', padding: 12 },
  dragHandle:      { paddingRight: 10, paddingLeft: 2 },
  cardTexts:       { flex: 1 },
  cardDescription: { fontSize: 15, color: colors.text, fontWeight: '600', marginBottom: 2 },
  cardUrl:         { fontSize: 12, color: colors.textMuted },
  cardActions:     { flexDirection: 'row', alignItems: 'center' },
  modal: {
    backgroundColor: colors.surface,
    margin: 24,
    borderRadius: 16,
    padding: 24,
    gap: 12,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: colors.gold, marginBottom: 8 },
  input:      { backgroundColor: colors.surface },
})
