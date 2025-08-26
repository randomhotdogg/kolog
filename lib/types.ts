export interface User {
  id: number
  email: string
  full_name?: string
  avatar_url?: string
  is_active: boolean
  created_at: string
}

export interface AuthToken {
  access_token: string
  token_type: string
  user: User
}

export interface LoginData {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  full_name?: string
}

export interface GoogleAuthData {
  token: string
}