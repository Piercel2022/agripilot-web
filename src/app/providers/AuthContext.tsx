import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import api from '../../lib/api/client'
import { register as registerUser } from '../../lib/api/auth'
import {
  getAccessToken,
  removeAccessToken,
  setAccessToken,
} from '../../lib/auth/storage'
import type {
  AuthUser,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
} from '../../types/auth'
import { AuthContext } from './auth-context'

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(() => {
    return getAccessToken() !== null
  })

  const logout = useCallback(() => {
    removeAccessToken()
    setUser(null)
  }, [])

  const login = useCallback(async (credentials: LoginRequest) => {
    const response = await api.post<LoginResponse>('/auth/login', credentials)

    setAccessToken(response.data.accessToken)
    setUser(response.data.user)
  }, [])

  const register = useCallback(async (payload: RegisterRequest) => {
    await registerUser(payload)

    const response = await api.post<LoginResponse>('/auth/login', {
      email: payload.email,
      password: payload.password,
    })

    setAccessToken(response.data.accessToken)
    setUser(response.data.user)
  }, [])

  useEffect(() => {
    const token = getAccessToken()

    if (!token) {
      return
    }

    api
      .get<AuthUser>('/auth/me')
      .then((response) => {
        setUser(response.data)
      })
      .catch(() => {
        logout()
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [logout])

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: user !== null,
      isLoading,
      login,
      register,
      logout,
    }),
    [user, isLoading, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
