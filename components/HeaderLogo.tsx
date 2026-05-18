import { TouchableOpacity, Image, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'

export default function HeaderLogo() {
  const router = useRouter()

  return (
    <TouchableOpacity onPress={() => router.push('/(tabs)/')} activeOpacity={0.7}>
      <Image
        source={require('../assets/images/logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  logo: {
    width: 36,
    height: 36,
    marginRight: 12,
  },
})
