import { ScrollView, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { colors } from '../constants/theme';

export default function PrivacyScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Politique de confidentialité</Text>
      <Text style={styles.subtitle}>Application BCCO Ronchin</Text>
      <Text style={styles.date}>Dernière mise à jour : mai 2026</Text>

      <Section title="1. Présentation">
        L'application BCCO Ronchin est développée et gérée par le Billard Club du Canon d'Or, association loi 1901. Elle est destinée exclusivement aux membres du club.
      </Section>

      <Section title="2. Données collectées">
        Dans le cadre du fonctionnement de l'application, les données suivantes sont collectées :{'\n\n'}
        • Nom et prénom{'\n'}
        • Adresse email{'\n'}
        • Photo de profil (facultative){'\n'}
        • Discipline(s) pratiquée(s) (snooker, carambole){'\n'}
        • Jeton de notification push (pour l'envoi de notifications){'\n'}
        • Présence au club (check-in, réinitialisé chaque nuit à minuit)
      </Section>

      <Section title="3. Finalité des données">
        Les données collectées sont utilisées uniquement pour :{'\n\n'}
        • L'authentification et la gestion du compte membre{'\n'}
        • L'affichage du profil dans l'application{'\n'}
        • L'envoi de notifications liées aux actualités et événements du club{'\n'}
        • L'affichage de la liste des membres présents au club
      </Section>

      <Section title="4. Stockage et sécurité">
        Les données sont stockées de manière sécurisée sur la plateforme Supabase (infrastructure hébergée en Europe). Aucune donnée n'est vendue ni partagée avec des tiers.
      </Section>

      <Section title="5. Permission caméra / galerie">
        L'application peut demander l'accès à votre galerie photo uniquement pour vous permettre de choisir une photo de profil. Cette permission est facultative et n'est utilisée à aucune autre fin.
      </Section>

      <Section title="6. Notifications push">
        Si vous acceptez les notifications, un jeton d'identification anonyme est enregistré pour vous envoyer des alertes liées aux actualités et événements du club. Vous pouvez désactiver les notifications à tout moment depuis votre profil dans l'application.
      </Section>

      <Section title="7. Durée de conservation">
        Les données sont conservées tant que le compte membre est actif. En cas de suppression du compte, toutes les données associées sont supprimées.
      </Section>

      <Section title="8. Vos droits">
        Conformément au RGPD, vous disposez d'un droit d'accès, de rectification et de suppression de vos données. Pour exercer ces droits, faites la demande à l'administrateur du club.
      </Section>

      <Section title="9. Contact">
        Pour toute question relative à cette politique de confidentialité, vous pouvez contacter le BCCO Ronchin via l'adresse email de contact du club.
      </Section>
    </ScrollView>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionText}>{children}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: colors.background },
  content:     { padding: 24, gap: 8 },
  title:       { fontSize: 22, fontWeight: 'bold', color: colors.gold, marginBottom: 4 },
  subtitle:    { fontSize: 16, color: colors.text, marginBottom: 4 },
  date:        { fontSize: 13, color: colors.textMuted, marginBottom: 16 },
  section:     { marginBottom: 16 },
  sectionTitle:{ fontSize: 15, fontWeight: 'bold', color: colors.gold, marginBottom: 6 },
  sectionText: { fontSize: 14, color: colors.text, lineHeight: 22 },
})
