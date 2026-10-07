import { Alert, Linking, StyleSheet, TextProps, TextStyle } from 'react-native'
import { Text } from 'react-native-paper'
import { colors } from '../constants/theme'

const URL_REGEX = /(https?:\/\/[^\s<>"']+|www\.[^\s<>"']+)/gi

type Segment = { text: string; url?: string }

function splitIntoSegments(text: string): Segment[] {
  const segments: Segment[] = []
  let last = 0
  for (const match of text.matchAll(URL_REGEX)) {
    const start = match.index ?? 0
    if (start > last) segments.push({ text: text.slice(last, start) })
    let url = match[0]
    const trailing = url.match(/[.,;:!?)\]}>»…]+$/)
    let after = ''
    if (trailing) {
      after = trailing[0]
      url = url.slice(0, url.length - after.length)
    }
    segments.push({ text: url, url })
    segments.push({ text: after })
    last = start + match[0].length
  }
  if (last < text.length) segments.push({ text: text.slice(last) })
  return segments
}

export function openExternalUrl(url: string) {
  const finalUrl = /^https?:\/\//i.test(url) ? url : `https://${url}`
  Linking.openURL(finalUrl).catch(() =>
    Alert.alert('Erreur', "Impossible d'ouvrir ce lien.")
  )
}

type LinkifiedTextProps = TextProps & {
  text: string
  style?: TextStyle | (TextStyle | undefined)[]
}

export default function LinkifiedText({ text, style, ...rest }: LinkifiedTextProps) {
  const segments = splitIntoSegments(text)
  const hasLinks = segments.some(s => s.url)
  if (!hasLinks) {
    return <Text style={style} {...rest}>{text}</Text>
  }
  return (
    <Text style={style} {...rest}>
      {segments.map((seg, i) =>
        seg.url ? (
          <Text
            key={i}
            style={styles.link}
            onPress={() => openExternalUrl(seg.url!)}
          >
            {seg.text}
          </Text>
        ) : (
          <Text key={i}>{seg.text}</Text>
        )
      )}
    </Text>
  )
}

const styles = StyleSheet.create({
  link: {
    color: colors.goldLight,
    textDecorationLine: 'underline',
  },
})
