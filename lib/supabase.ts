import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
import { Platform } from 'react-native'

const supabaseUrl = 'https://ywgmyqpcqmmpjmdboutz.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3Z215cXBjcW1tcGptZGJvdXR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5NzcxMzcsImV4cCI6MjA5MzU1MzEzN30.YbxlaBQnPjp8BzowVUqdxkXMAyWS0WCVsow3ahiisIc'

// Sur web : localStorage natif du navigateur. Sur mobile : AsyncStorage.
const storage = Platform.OS === 'web' ? undefined : AsyncStorage

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    ...(storage ? { storage } : {}),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
})
