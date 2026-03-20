'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Zap, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui'
import { Input } from '@/components/ui'

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('Preencha todos os campos.')
      return
    }

    setLoading(true)
    try {
      await login(email, password)
      router.push('/')
      router.refresh()
    } catch {
      setError('Credenciais inválidas. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="gradient-bg flex min-h-screen items-center justify-center px-4">
      {/* Subtle glow effect */}
      <div className="pointer-events-none fixed left-1/2 top-1/3 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/5 blur-3xl" />

      <div className="relative w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-[var(--radius-xl)] bg-accent shadow-[var(--shadow-lg)]">
            <Zap className="h-8 w-8 text-text-inverse" />
          </div>
          <h1 className="text-3xl font-bold text-text-primary">RecuperaAI</h1>
          <p className="mt-2 text-text-secondary">
            Seu vendedor IA que nunca dorme
          </p>
        </div>

        {/* Login Card */}
        <div className="relative rounded-[var(--radius-xl)] border border-border bg-surface p-8 shadow-[var(--shadow-xl)]">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent to-transparent" />
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-text-primary">
              Bem-vindo de volta
            </h2>
            <p className="mt-1 text-sm text-text-secondary">
              Entre na sua conta para continuar
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-text-secondary"
              >
                E-mail
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="bg-bg-primary"
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium text-text-secondary"
              >
                Senha
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Sua senha"
                  className="bg-bg-primary pr-11"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-[var(--radius-md)] bg-error-light px-4 py-3 text-sm text-error">
                {error}
              </div>
            )}

            {/* Submit */}
            <Button
              type="submit"
              loading={loading}
              size="lg"
              className="w-full"
            >
              Entrar
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          {/* Forgot Password */}
          <div className="mt-6 text-center">
            <Button variant="ghost" size="sm" className="text-text-secondary">
              Esqueci minha senha
            </Button>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-text-tertiary">
          RecuperaAI - Recuperação inteligente de carrinhos abandonados
        </p>
      </div>
    </div>
  )
}
