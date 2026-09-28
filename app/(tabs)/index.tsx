import { Redirect } from 'expo-router'

export default function HomeScreen() {
  // L'écran d'accueil est la page des présences : redirige vers celle-ci au chargement.
  return <Redirect href="/(tabs)/checkin" />
}