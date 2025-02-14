'use client'

import React from 'react'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from '@/components/ui/use-toast'
import { Loader2 } from 'lucide-react'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import * as XLSX from 'xlsx'
import FileSaver from 'file-saver'

type AppointmentWithPatient = {
  id: string
  date: string
  patientName: string
  value: number
}

type PatientTotal = {
  patientName: string
  totalValue: number
  appointments: AppointmentWithPatient[]
}

export function FinancialReport() {
  const [appointments, setAppointments] = useState<AppointmentWithPatient[]>([])
  const [patientTotals, setPatientTotals] = useState<PatientTotal[]>([])
  const [totalValue, setTotalValue] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchAppointments()
  }, [])

  async function fetchAppointments() {
    setIsLoading(true)
    const startDate = format(startOfMonth(new Date()), 'yyyy-MM-dd')
    const endDate = format(endOfMonth(new Date()), 'yyyy-MM-dd')

    const { data, error } = await supabase
      .from('appointments')
      .select(`
        id,
        date,
        value,
        patients (
          name
        )
      `)
      .gte('date', startDate)
      .lte('date', endDate)

    if (error) {
      toast({
        title: 'Erro ao carregar consultas',
        description: error.message,
        variant: 'destructive',
      })
    } else {
      const formattedAppointments = data
        .filter(app => app.patients && app.patients.name) // Filter out appointments with null patient data
        .map(app => ({
          id: app.id,
          date: app.date,
          patientName: app.patients?.name || 'Paciente Desconhecido',
          value: app.value || 0
        }))
      setAppointments(formattedAppointments)
      calculateTotals(formattedAppointments)
    }
    setIsLoading(false)
  }

  function calculateTotals(apps: AppointmentWithPatient[]) {
    const totals = apps.reduce((acc, app) => {
      if (!acc[app.patientName]) {
        acc[app.patientName] = { patientName: app.patientName, totalValue: 0, appointments: [] }
      }
      acc[app.patientName].totalValue += app.value
      acc[app.patientName].appointments.push(app)
      return acc
    }, {} as Record<string, PatientTotal>)

    const patientTotalsList = Object.values(totals)
    setPatientTotals(patientTotalsList)
    setTotalValue(patientTotalsList.reduce((sum, patient) => sum + patient.totalValue, 0))
  }

  const handleExportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(patientTotals.flatMap(patient => 
      patient.appointments.map(app => ({
        Paciente: app.patientName,
        Data: format(new Date(app.date), 'dd/MM/yyyy'),
        Valor: `R$ ${app.value.toFixed(2)}`
      }))
    ));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Relatório Financeiro");

    // Adiciona linhas para os totais por paciente e o total geral
    const totalRows = patientTotals.map(patient => [
      `Total ${patient.patientName}:`, "", `R$ ${patient.totalValue.toFixed(2)}`
    ]);
    totalRows.push(["Total Geral:", "", `R$ ${totalValue.toFixed(2)}`]);

    XLSX.utils.sheet_add_aoa(worksheet, totalRows, {origin: -1});

    // Ajusta as larguras das colunas
    const columnsWidths = [
      {wch: 30}, // Paciente
      {wch: 15}, // Data
      {wch: 15}  // Valor
    ];
    worksheet["!cols"] = columnsWidths;

    // Gera o arquivo Excel como um Blob
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    // Usa FileSaver para salvar o arquivo
    const currentMonth = format(new Date(), 'MMMM-yyyy', { locale: ptBR });
    FileSaver.saveAs(data, `relatorio-financeiro-${currentMonth}.xlsx`);

    toast({
      title: 'Relatório exportado com sucesso',
      description: `O relatório foi salvo como relatorio-financeiro-${currentMonth}.xlsx`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Relatório Financeiro Mensal</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patientTotals.map((patient) => (
                  <React.Fragment key={patient.patientName}>
                    {patient.appointments.map((appointment) => (
                      <TableRow key={appointment.id}>
                        <TableCell>{appointment.patientName}</TableCell>
                        <TableCell>{format(new Date(appointment.date), 'dd/MM/yyyy')}</TableCell>
                        <TableCell>R$ {appointment.value.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow key={`${patient.patientName}-total`}>
                      <TableCell colSpan={2}><strong>Total {patient.patientName}</strong></TableCell>
                      <TableCell><strong>R$ {patient.totalValue.toFixed(2)}</strong></TableCell>
                    </TableRow>
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
            <div className="mt-4 text-right">
              <strong>Total Geral: R$ {totalValue.toFixed(2)}</strong>
            </div>
            <Button onClick={handleExportExcel} className="mt-4">Exportar Excel</Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}

