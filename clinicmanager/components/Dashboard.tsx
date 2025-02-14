'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { PatientManagement } from './PatientManagement'
import { AppointmentScheduling } from './AppointmentScheduling'
import { FinancialReport } from './FinancialReport'
import { ChangePassword } from './ChangePassword'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/components/ui/use-toast'

interface DashboardProps {
  userEmail: string
}

export function Dashboard({ userEmail }: DashboardProps) {
  const [activeComponent, setActiveComponent] = useState<'patients' | 'appointments' | 'reports' | 'changePassword'>('patients')
  const router = useRouter()

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      toast({
        title: 'Erro ao sair',
        description: 'Ocorreu um erro ao tentar sair. Por favor, tente novamente.',
        variant: 'destructive',
      })
    } else {
      router.push('/')
    }
  }

  return (
    <div className="container mx-auto p-4 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Bem-vindo ao Clinic Manager</CardTitle>
          <CardDescription>Olá, {userEmail}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap justify-between items-center gap-2">
          <div className="space-x-2 flex flex-wrap gap-2">
            <Button onClick={() => setActiveComponent('patients')}>Pacientes</Button>
            <Button onClick={() => setActiveComponent('appointments')}>Consultas</Button>
            <Button onClick={() => setActiveComponent('reports')}>Relatórios</Button>
            <Button onClick={() => setActiveComponent('changePassword')}>Alterar Senha</Button>
          </div>
          <Button variant="outline" onClick={handleSignOut}>Sair</Button>
        </CardContent>
      </Card>

      {activeComponent === 'patients' && <PatientManagement />}
      {activeComponent === 'appointments' && <AppointmentScheduling />}
      {activeComponent === 'reports' && <FinancialReport />}
      {activeComponent === 'changePassword' && <ChangePassword />}
    </div>
  )
}

