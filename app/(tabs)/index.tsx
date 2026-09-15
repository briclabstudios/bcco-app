import { Redirect } from 'expo-router'

export default function HomeScreen() {
  // L'écran d'accueil est l'agenda : redirige vers celui-ci au chargement.
  return <Redirect href="/(tabs)/agenda" />
}