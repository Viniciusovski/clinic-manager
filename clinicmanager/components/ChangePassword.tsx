'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/components/ui/use-toast'
import { Loader2 } from 'lucide-react'

const passwordSchema = z.object({
  currentPassword: z.string().min(6, { message: 'A senha atual deve ter pelo menos 6 caracteres' }),
  newPassword: z.string().min(6, { message: 'A nova senha deve ter pelo menos 6 caracteres' }),
  confirmPassword: z.string().min(6, { message: 'A confirmação da senha deve ter pelo menos 6 caracteres' }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type PasswordFormData = z.infer<typeof passwordSchema>

export function ChangePassword() {
  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const { register, handleSubmit, reset, formState: { errors } } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  })

  const onSubmit = async (data: PasswordFormData) => {
    setIsLoading(true)
    setSuccessMessage('')
    try {
      const { error } = await supabase.auth.updateUser({ 
        password: data.newPassword 
      })

      if (error) throw error

      setSuccessMessage('Senha alterada com sucesso!')
      toast({
        title: 'Senha alterada com sucesso',
        description: 'Sua senha foi atualizada.',
      })
      reset()
    } catch (error: any) {
      console.error('Error changing password:', error)
      toast({
        title: 'Erro ao alterar senha',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Alterar Senha</CardTitle>
      </CardHeader>
      <CardContent>
        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span className="block sm:inline">{successMessage}</span>
          </div>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Input
              type="password"
              placeholder="Senha atual"
              {...register('currentPassword')}
            />
            {errors.currentPassword && (
              <p className="text-red-500 text-sm mt-1">{errors.currentPassword.message}</p>
            )}
          </div>
          <div>
            <Input
              type="password"
              placeholder="Nova senha"
              {...register('newPassword')}
            />
            {errors.newPassword && (
              <p className="text-red-500 text-sm mt-1">{errors.newPassword.message}</p>
            )}
          </div>
          <div>
            <Input
              type="password"
              placeholder="Confirmar nova senha"
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && (
              <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>
            )}
          </div>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Alterar Senha
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

