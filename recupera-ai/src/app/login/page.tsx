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
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{ background: 'var(--bg-outer)' }}
    >
      <div className="relative w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <div
            className="mb-4 flex h-16 w-16 items-center justify-center"
            style={{
              background: 'var(--accent)',
              borderRadius: '16px',
            }}
          >
            <Zap className="h-8 w-8" style={{ color: 'var(--text-inverse)' }} />
          </div>
          <h1
            className="text-[30px] font-bold"
            style={{
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
            }}
          >
            RecuperaAI
          </h1>
          <p
            className="mt-2 text-[14px]"
            style={{ color: 'var(--text-secondary)' }}
          >
            Seu vendedor IA que nunca dorme
          </p>
        </div>

        {/* Login Card */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '20px',
            padding: '32px',
          }}
        >
          <div className="mb-6">
            <h2
              className="text-[24px] font-bold"
              style={{
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
              }}
            >
              Bem-vindo de volta
            </h2>
            <p
              className="mt-1 text-[14px]"
              style={{ color: 'var(--text-secondary)' }}
            >
              Entre na sua conta para continuar
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-[14px] font-medium"
                style={{ color: 'var(--text-secondary)' }}
              >
                E-mail
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-[14px] font-medium"
                style={{ color: 'var(--text-secondary)' }}
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
                  className="pr-11"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--text-tertiary)' }}
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
              <div
                className="px-4 py-3 text-[14px]"
                style={{
                  borderRadius: '10px',
                  background: 'var(--danger-surface)',
                  color: 'var(--danger)',
                }}
              >
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
            <button
              className="text-[14px] font-medium"
              style={{ color: 'var(--accent)' }}
            >
              Esqueci minha senha
            </button>
          </div>
        </div>

        {/* Footer */}
        <p
          className="mt-8 text-center text-[12px]"
          style={{ color: 'var(--text-tertiary)' }}
        >
          RecuperaAI - Recuperação inteligente de carrinhos abandonados
        </p>
      </div>
    </div>
  )
}
