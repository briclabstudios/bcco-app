import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'
import Constants from 'expo-constants'
import { supabase } from './supabase'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

export async function registerForPushNotifications(userId: string): Promise<void> {
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
      })
    }

    const { status: existing } = await Notifications.getPermissionsAsync()
    let finalStatus = existing
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync()
      finalStatus = status
    }
    if (finalStatus !== 'granted') return

    const projectId = Constants.expoConfig?.extra?.eas?.projectId
    const { data: token } = projectId
      ? await Notifications.getExpoPushTokenAsync({ projectId })
      : await Notifications.getExpoPushTokenAsync()

    await supabase.from('profiles').update({ push_token: token }).eq('id', userId)
  } catch (e) {
    console.warn('Push token registration failed:', e)
  }
}

export async function sendNotification(
  type: 'actus' | 'agenda',
  titre: string,
  accessToken: string,
): Promise<void> {
  try {
    await supabase.functions.invoke('send-notification', {
      body: { type, titre },
      headers: { Authorization: `Bearer ${accessToken}` },
    })
  } catch (e) {
    console.warn('Send notification failed:', e)
  }
}
