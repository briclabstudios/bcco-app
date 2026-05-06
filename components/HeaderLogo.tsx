import { Image, StyleSheet } from 'react-native'

export default function HeaderLogo() {
  return (
    <Image
      source={require('../assets/images/logo.png')}
      style={styles.logo}
      resizeMode="contain"
    />
  )
}

const styles = StyleSheet.create({
  logo: {
    width: 36,
    height: 36,
    marginRight: 12,
  },
})
