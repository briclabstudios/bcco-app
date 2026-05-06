import { View, Image, TouchableOpacity, StyleSheet } from 'react-native'
import { Text } from 'react-native-paper'
import * as ImagePicker from 'expo-image-picker'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '../constants/theme'

type Props = {
  imageUri: string | null
  onPick: (uri: string) => void
  onRemove: () => void
  disabled?: boolean
}

export default function ImagePickerField({ imageUri, onPick, onRemove, disabled }: Props) {
  async function pick() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    })
    if (!result.canceled && result.assets[0]) {
      onPick(result.assets[0].uri)
    }
  }

  if (imageUri) {
    return (
      <View style={styles.previewWrapper}>
        <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="cover" />
        <TouchableOpacity style={styles.removeBtn} onPress={onRemove} disabled={disabled}>
          <Ionicons name="close-circle" size={26} color={colors.error} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.changeBtn} onPress={pick} disabled={disabled}>
          <Ionicons name="camera-outline" size={16} color={colors.text} />
          <Text style={styles.changeBtnText}>Changer</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <TouchableOpacity style={styles.picker} onPress={pick} disabled={disabled}>
      <Ionicons name="image-outline" size={22} color={colors.textMuted} />
      <Text style={styles.pickerText}>Ajouter une image (optionnel)</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    borderStyle: 'dashed',
    padding: 16,
  },
  pickerText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  previewWrapper: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  preview: {
    width: '100%',
    height: 200,
  },
  removeBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.background,
    borderRadius: 13,
  },
  changeBtn: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  changeBtnText: {
    color: colors.text,
    fontSize: 13,
  },
})
