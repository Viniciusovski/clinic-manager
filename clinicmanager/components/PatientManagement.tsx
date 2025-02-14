'use client'

import React from 'react'
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from '@/components/ui/use-toast'
import { Loader2, Pencil, Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

const patientSchema = z.object({
  name: z.string().min(2, { message: 'O nome deve ter pelo menos 2 caracteres' }),
  phone: z.string().min(10, { message: 'O telefone deve ter pelo menos 10 dígitos' }),
  email: z.string().email({ message: 'E-mail inválido' }),
})

type Patient = z.infer<typeof patientSchema> & {
  id: string
  created_at: string
  created_by: string
}

export function PatientManagement() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null)
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(patientSchema),
  })

  useEffect(() => {
    fetchPatients()
  }, [])

  async function fetchPatients() {
    setIsLoading(true)
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching patients:', error)
      toast({
        title: 'Erro ao carregar pacientes',
        description: error.message,
        variant: 'destructive',
      })
    } else {
      setPatients(data || [])
    }
    setIsLoading(false)
  }

  const onSubmit = async (data: z.infer<typeof patientSchema>) => {
    setIsLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      let newPatient
      if (editingPatient) {
        const { data: updatedPatient, error } = await supabase
          .from('patients')
          .update({
            name: data.name,
            phone: data.phone,
            email: data.email,
          })
          .eq('id', editingPatient.id)
          .select()
          .single()

        if (error) throw error
        newPatient = updatedPatient
        toast({
          title: 'Paciente atualizado com sucesso',
          description: 'Os dados do paciente foram atualizados',
        })
      } else {
        const { data: createdPatient, error } = await supabase
          .from('patients')
          .insert({
            ...data,
            created_by: user.id
          })
          .select()
          .single()

        if (error) throw error
        newPatient = createdPatient
        toast({
          title: 'Paciente cadastrado com sucesso',
          description: 'O novo paciente foi adicionado à lista',
        })
      }

      setPatients(prevPatients => {
        if (editingPatient) {
          return prevPatients.map(p => p.id === editingPatient.id ? newPatient : p)
        } else {
          return [newPatient, ...prevPatients]
        }
      })
      reset()
      setEditingPatient(null)
    } catch (error: any) {
      console.error('Error saving patient:', error)
      toast({
        title: 'Erro ao salvar paciente',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (patient: Patient) => {
    setEditingPatient(patient)
    setValue('name', patient.name)
    setValue('phone', patient.phone)
    setValue('email', patient.email)
  }

  const handleDelete = async (patientId: string) => {
    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('patients')
        .delete()
        .eq('id', patientId)

      if (error) throw error

      setPatients(prevPatients => prevPatients.filter(p => p.id !== patientId))
      toast({
        title: 'Paciente excluído com sucesso',
        description: 'O paciente foi removido da lista',
      })
    } catch (error: any) {
      console.error('Error deleting patient:', error)
      toast({
        title: 'Erro ao excluir paciente',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>{editingPatient ? 'Editar Paciente' : 'Cadastro de Pacientes'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Input {...register('name')} placeholder="Nome" />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <Input {...register('phone')} placeholder="Telefone" />
              {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>}
            </div>
            <div>
              <Input {...register('email')} placeholder="E-mail" />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
            </div>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {editingPatient ? 'Atualizar Paciente' : 'Cadastrar Paciente'}
            </Button>
            {editingPatient && (
              <Button type="button" variant="outline" onClick={() => {
                setEditingPatient(null)
                reset()
              }} className="ml-2">
                Cancelar Edição
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Pacientes</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Data de Cadastro</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patients.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell>{patient.name}</TableCell>
                    <TableCell>{patient.phone}</TableCell>
                    <TableCell>{patient.email}</TableCell>
                    <TableCell>
                      {new Date(patient.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="icon" onClick={() => handleEdit(patient)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Editar Paciente</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                              <div>
                                <Input {...register('name')} placeholder="Nome" defaultValue={patient.name} />
                                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
                              </div>
                              <div>
                                <Input {...register('phone')} placeholder="Telefone" defaultValue={patient.phone} />
                                {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>}
                              </div>
                              <div>
                                <Input {...register('email')} placeholder="E-mail" defaultValue={patient.email} />
                                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
                              </div>
                              <Button type="submit" disabled={isLoading}>
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Atualizar Paciente
                              </Button>
                            </form>
                          </DialogContent>
                        </Dialog>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="icon">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir este paciente? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(patient.id)}>
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

