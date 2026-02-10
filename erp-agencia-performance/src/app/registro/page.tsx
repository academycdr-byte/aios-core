"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Zap } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function RegistroPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Erro ao criar conta")
        setLoading(false)
        return
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError("Conta criada, mas erro ao fazer login. Tente entrar manualmente.")
        setLoading(false)
        return
      }

      router.push("/")
      router.refresh()
    } catch {
      setError("Erro ao criar conta. Tente novamente.")
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
          <h2 className="mb-1 text-base font-semibold text-text-primary">Criar conta</h2>
          <p className="mb-7 text-sm text-text-muted">Preencha os dados para criar sua conta</p>

          {error && (
            <div className="mb-6 rounded-lg bg-danger/10 border border-danger/20 px-4 py-3 text-sm text-danger">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              id="name"
              label="Nome"
              type="text"
              placeholder="Seu nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

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
              placeholder="Minimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />

            <Button
              type="submit"
              className="w-full h-11 text-sm mt-2"
              disabled={loading}
            >
              {loading ? "Criando conta..." : "Criar conta"}
            </Button>
          </form>

          <p className="mt-7 text-center text-sm text-text-muted">
            Ja tem conta?{" "}
            <Link href="/login" className="text-accent hover:text-accent-hover transition-colors font-medium">
              Entrar
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
