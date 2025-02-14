'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from '@/components/ui/use-toast'
import { Loader2 } from 'lucide-react'

const authSchema = z.object({
  email: z.string().email({ message: 'E-mail inválido' }),
  password: z.string().min(6, { message: 'A senha deve ter pelo menos 6 caracteres' }),
})

type AuthFormData = z.infer<typeof authSchema>

export function Auth() {
  const [isLoading, setIsLoading] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'reset'>('login')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const router = useRouter()

  const { register, handleSubmit, formState: { errors }, reset } = useForm<AuthFormData>({
    resolver: zodResolver(authSchema),
  })

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        router.push('/dashboard')
      }
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [router])

  const onSubmit = async (data: AuthFormData) => {
    setIsLoading(true)
    setErrorMessage(null)
    try {
      let result

      if (authMode === 'login') {
        result = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        })
      } else if (authMode === 'register') {
        result = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
        })
      } else {
        result = await supabase.auth.resetPasswordForEmail(data.email)
      }

      if (result.error) {
        throw result.error
      }

      if (authMode === 'register') {
        if (result.data?.user?.identities?.length === 0) {
          setErrorMessage('E-mail já cadastrado. Por favor, faça login ou use a opção de recuperar senha.')
        } else {
          toast({
            title: 'Cadastro realizado com sucesso',
            description: 'Verifique seu e-mail para confirmar o cadastro.',
          })
        }
      } else if (authMode === 'login') {
        if (result.data.user) {
          toast({
            title: 'Login realizado com sucesso',
            description: 'Bem-vindo ao Clinic Manager!',
          })
          router.push('/dashboard')
        }
      } else {
        toast({
          title: 'E-mail de recuperação enviado',
          description: 'Verifique sua caixa de entrada para redefinir sua senha.',
        })
      }

      reset()
    } catch (error: any) {
      console.error('Auth error:', error)
      setErrorMessage(getErrorMessage(error.message))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Clinic Manager</CardTitle>
        <CardDescription>Gerencie suas consultas de forma eficiente</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={authMode} onValueChange={(value) => setAuthMode(value as typeof authMode)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Cadastro</TabsTrigger>
            <TabsTrigger value="reset">Recuperar</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {errorMessage && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                  <span className="block sm:inline">{errorMessage}</span>
                </div>
              )}
              <div className="space-y-2">
                <Input
                  {...register('email')}
                  type="email"
                  placeholder="E-mail"
                  disabled={isLoading}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Input
                  {...register('password')}
                  type="password"
                  placeholder="Senha"
                  disabled={isLoading}
                />
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  'Entrar'
                )}
              </Button>
            </form>
          </TabsContent>
          <TabsContent value="register">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {errorMessage && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                  <span className="block sm:inline">{errorMessage}</span>
                </div>
              )}
              <div className="space-y-2">
                <Input
                  {...register('email')}
                  type="email"
                  placeholder="E-mail"
                  disabled={isLoading}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Input
                  {...register('password')}
                  type="password"
                  placeholder="Senha"
                  disabled={isLoading}
                />
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cadastrando...
                  </>
                ) : (
                  'Cadastrar'
                )}
              </Button>
            </form>
          </TabsContent>
          <TabsContent value="reset">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {errorMessage && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                  <span className="block sm:inline">{errorMessage}</span>
                </div>
              )}
              <div className="space-y-2">
                <Input
                  {...register('email')}
                  type="email"
                  placeholder="E-mail"
                  disabled={isLoading}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  'Recuperar Senha'
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

function getErrorMessage(error: string): string {
  const errorMessages: Record<string, string> = {
    'Invalid login credentials': 'E-mail ou senha incorretos',
    'User already registered': 'E-mail já cadastrado',
    'Password should be at least 6 characters': 'A senha deve ter pelo menos 6 caracteres',
    'Invalid email': 'E-mail inválido',
    'Email not confirmed': 'E-mail não confirmado. Por favor, verifique sua caixa de entrada.',
    'Missing Supabase environment variables': 'Erro de configuração. Por favor, contate o suporte.',
  }

  return errorMessages[error] || error || 'Ocorreu um erro. Tente novamente.'
}

