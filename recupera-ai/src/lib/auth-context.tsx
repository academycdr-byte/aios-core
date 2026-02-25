'use client'

import { createContext, useContext, useCallback, type ReactNode } from 'react'
import { SessionProvider, useSession, signIn, signOut } from 'next-auth/react'

interface User {
  id: string
  name: string | null
  email: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderInnerProps {
  children: ReactNode
}

function AuthProviderInner({ children }: AuthProviderInnerProps) {
  const { data: session, status } = useSession()

  const user: User | null = session?.user
    ? {
        id: session.user.id ?? '',
        name: session.user.name ?? null,
        email: session.user.email ?? '',
      }
    : null

  const login = useCallback(async (email: string, password: string) => {
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    if (result?.error) {
      throw new Error('Invalid credentials')
    }
  }, [])

  const logout = useCallback(() => {
    signOut({ callbackUrl: '/login' })
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
        isLoading: status === 'loading',
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  return (
    <SessionProvider>
      <AuthProviderInner>{children}</AuthProviderInner>
    </SessionProvider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
