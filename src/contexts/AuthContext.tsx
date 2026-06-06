import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import type { Profile, UserRole } from '@/types/database'

export interface AuthUser {
  id: string
  email: string
  profile: Profile
}

interface AuthContextType {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  role: UserRole | null
  login: (email: string, password: string) => Promise<Profile>
  signUp: (email: string, password: string) => Promise<{ needsEmailConfirmation: boolean }>
  loginWithGoogle: () => Promise<void>
  logout: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

async function fetchOrCreateProfile(userId: string, email: string): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (!error) return data

  if (error.code === 'PGRST116') {
    const { data: created, error: createError } = await supabase
      .from('profiles')
      .insert({ id: userId, full_name: email.split('@')[0], role: 'client' })
      .select()
      .single()
    if (createError) throw createError
    return created
  }

  throw error
}

async function linkClientToWorkshop(clientId: string, workshopSlug: string): Promise<void> {
  const { data: workshop } = await supabase
    .from('workshops')
    .select('id')
    .eq('slug', workshopSlug)
    .single()

  if (!workshop) return

  // upsert — ignora se o vínculo já existir
  await supabase
    .from('client_workshops')
    .upsert({ client_id: clientId, workshop_id: workshop.id }, { onConflict: 'client_id,workshop_id' })
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'INITIAL_SESSION') {
          if (session?.user) {
            try {
              const profile = await fetchOrCreateProfile(session.user.id, session.user.email ?? '')
              setUser({ id: session.user.id, email: session.user.email ?? '', profile })
            } catch {
              setUser(null)
            }
          }
          setIsLoading(false)
        }

        if (event === 'SIGNED_IN' && session?.user) {
          try {
            const profile = await fetchOrCreateProfile(session.user.id, session.user.email ?? '')

            // Se há slug pendente (cliente chegou via /acesso/:slug), cria o vínculo
            const pendingSlug = sessionStorage.getItem('pendingWorkshopSlug')
            if (pendingSlug && profile.role === 'client') {
              await linkClientToWorkshop(session.user.id, pendingSlug)
              sessionStorage.removeItem('pendingWorkshopSlug')
            }

            setUser({ id: session.user.id, email: session.user.email ?? '', profile })
          } catch {
            setUser(null)
          }
          setIsLoading(false)
        }

        if (event === 'SIGNED_OUT') {
          setUser(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function login(email: string, password: string): Promise<Profile> {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    if (!data.user) throw new Error('Falha no login')
    const profile = await fetchOrCreateProfile(data.user.id, data.user.email ?? '')
    setUser({ id: data.user.id, email: data.user.email ?? '', profile })
    return profile
  }

  async function signUp(email: string, password: string): Promise<{ needsEmailConfirmation: boolean }> {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    if (!data.user) throw new Error('Falha no cadastro')
    if (!data.session) return { needsEmailConfirmation: true }
    const profile = await fetchOrCreateProfile(data.user.id, data.user.email ?? '')
    setUser({ id: data.user.id, email: data.user.email ?? '', profile })
    return { needsEmailConfirmation: false }
  }

  async function loginWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { prompt: 'select_account' },
      },
    })
    if (error) throw error
  }

  async function logout() {
    await supabase.auth.signOut()
    setUser(null)
  }

  async function refreshProfile() {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      const profile = await fetchOrCreateProfile(session.user.id, session.user.email ?? '')
      setUser({ id: session.user.id, email: session.user.email ?? '', profile })
    }
  }

  const role = user?.profile.role ?? null

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, role, login, signUp, loginWithGoogle, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider')
  return ctx
}
