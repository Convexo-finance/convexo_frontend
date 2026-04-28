// Auth state is now a shared React context — all components see the same state.
// This file re-exports so existing imports (@/lib/hooks/useAuth) keep working.
export type { AuthUser, SignInStage } from '@/lib/contexts/AuthContext'
export { useAuth } from '@/lib/contexts/AuthContext'
