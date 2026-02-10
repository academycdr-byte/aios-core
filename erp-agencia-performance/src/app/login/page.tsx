"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Zap } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError("Email ou senha incorretos")
        setLoading(false)
        return
      }

      router.push("/")
      router.refresh()
    } catch {
      setError("Erro ao realizar login. Tente novamente.")
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-primary p-4">
      <div className="w-full max-w-[420px]">
        <div className="mb-10 flex flex-col items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent shadow-lg shadow-accent/30">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold text-text-primary tracking-tight">ERP Agency</h1>
            <p className="mt-1 text-sm text-text-muted">Performance Digital</p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-bg-card p-8 shadow-2xl shadow-black/40">
          <h2 className="mb-1 text-base font-semibold text-text-primary">Entrar na sua conta</h2>
          <p className="mb-7 text-sm text-text-muted">Digite seu email e senha para acessar</p>

          {error && (
            <div className="mb-6 rounded-lg bg-danger/10 border border-danger/20 px-4 py-3 text-sm text-danger">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              id="email"
              label="Email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              id="password"
              label="Senha"
              type="password"
              placeholder="Sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button
              type="submit"
              className="w-full h-11 text-sm mt-2"
              disabled={loading}
            >
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          <p className="mt-7 text-center text-sm text-text-muted">
            Ainda nao tem conta?{" "}
            <Link href="/registro" className="text-accent hover:text-accent-hover transition-colors font-medium">
              Criar conta
            </Link>
          </p>
        </div>

        <p className="mt-8 text-center text-xs text-text-muted/60">
          CDR Group &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
