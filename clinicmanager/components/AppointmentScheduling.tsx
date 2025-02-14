'use client';

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pencil, Trash2, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
} from "@/components/ui/alert-dialog";

const appointmentSchema = z.object({
  patient: z.string().uuid('Paciente inválido').nonempty('Paciente é obrigatório'),
  date: z.string().nonempty('Data é obrigatória'),
  time: z.string().nonempty('Horário é obrigatório'),
  value: z.number().min(0, 'Valor deve ser maior que zero'),
  appointmentType: z.string().nonempty('Tipo de consulta é obrigatório'),
});

const appointmentTypeSchema = z.object({
  name: z.string().nonempty('Nome é obrigatório'),
  value: z.number().min(0, 'Valor deve ser maior ou igual a zero'),
});

type Patient = {
  id: string;
  name: string;
};

type AppointmentType = {
  id: string;
  name: string;
  value: number;
  user_id: string;
};

type Appointment = {
  id: string;
  patient_id: string;
  date: string;
  time: string;
  value: number;
  appointment_type_id: string | null;
  patient: {
    id: string;
    name: string;
  } | null;
  appointment_type: {
    id: string;
    name: string;
    value: number;
  } | null;
};

export function AppointmentScheduling() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [appointmentTypes, setAppointmentTypes] = useState<AppointmentType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [editingAppointmentType, setEditingAppointmentType] = useState<AppointmentType | null>(null);
  const [isAddingAppointmentType, setIsAddingAppointmentType] = useState(false);
  const [newAppointmentType, setNewAppointmentType] = useState({ name: '', value: 0 });
  const [isCreatingAppointment, setIsCreatingAppointment] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isEditTypeDialogOpen, setIsEditTypeDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);

  const { control, register, handleSubmit, reset, setValue, formState: { errors } } = useForm<z.infer<typeof appointmentSchema>>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      patient: '',
      date: new Date().toISOString().split('T')[0],
      time: '',
      value: 0,
      appointmentType: '',
    },
  });

  const {
    register: registerAppointmentType,
    handleSubmit: handleSubmitAppointmentType,
    reset: resetAppointmentType,
    formState: { errors: errorsAppointmentType },
  } = useForm<z.infer<typeof appointmentTypeSchema>>({
    resolver: zodResolver(appointmentTypeSchema),
  });

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchPatients();
      fetchAppointments();
      fetchAppointmentTypes();
    }
  }, [currentUser]);

  const fetchCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUser({ id: user.id });
    }
  };

  const fetchPatients = async () => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
      toast({ title: 'Erro ao carregar pacientes', description: error.message, variant: 'destructive' });
    }
  };

  const fetchAppointments = async () => {
    if (!currentUser) return;

    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          patient_id,
          date,
          time,
          value,
          appointment_type_id,
          patient:patients (id, name),
          appointment_type:appointment_types (id, name, value)
        `)
        .eq('user_id', currentUser.id)
        .order('date', { ascending: true })
        .order('time', { ascending: true });

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      toast({ title: 'Erro ao carregar consultas', description: error.message, variant: 'destructive' });
    }
  };

  const fetchAppointmentTypes = async () => {
    if (!currentUser) return;

    try {
      const { data, error } = await supabase
        .from('appointment_types')
        .select('id, name, value, user_id')
        .eq('user_id', currentUser.id)
        .order('name');

      if (error) throw error;
      setAppointmentTypes(data || []);
    } catch (error) {
      console.error('Erro ao carregar tipos de consulta:', error);
      toast({ 
        title: 'Erro ao carregar tipos de consulta', 
        description: error.message || 'Ocorreu um erro desconhecido', 
        variant: 'destructive' 
      });
    }
  };

  const onSubmit = async (formData: z.infer<typeof appointmentSchema>) => {
    if (!currentUser) return;

    setIsLoading(true);
    try {
      const appointmentData = {
        patient_id: formData.patient,
        date: formData.date,
        time: formData.time,
        value: formData.value,
        user_id: currentUser.id,
        appointment_type_id: formData.appointmentType,
      };

      let result;
      if (editingAppointment) {
        result = await supabase
          .from('appointments')
          .update(appointmentData)
          .eq('id', editingAppointment.id)
          .select()
          .single();
      } else {
        result = await supabase
          .from('appointments')
          .insert(appointmentData)
          .select()
          .single();
      }

      if (result.error) throw result.error;

      toast({
        title: editingAppointment ? 'Consulta atualizada' : 'Consulta agendada',
        description: 'A operação foi realizada com sucesso.',
      });

      fetchAppointments();
      reset();
      setEditingAppointment(null);
      setIsCreatingAppointment(false);
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Erro ao salvar consulta:', error);
      toast({
        title: 'Erro ao salvar consulta',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setValue('patient', appointment.patient_id);
    setValue('date', appointment.date);
    setValue('time', appointment.time);
    setValue('value', appointment.value);
    setValue('appointmentType', appointment.appointment_type_id);
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', appointmentId);

      if (error) throw error;

      toast({ title: 'Consulta excluída com sucesso' });
      fetchAppointments();
    } catch (error) {
      console.error('Erro ao excluir consulta:', error);
      toast({
        title: 'Erro ao excluir consulta',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleAddAppointmentType = async (data: z.infer<typeof appointmentTypeSchema>) => {
    if (!currentUser) return;

    try {
      const { data: newType, error } = await supabase
        .from('appointment_types')
        .insert({ name: data.name, value: data.value, user_id: currentUser.id })
        .select()
        .single();

      if (error) throw error;

      toast({ title: 'Tipo de consulta adicionado com sucesso' });
      setIsAddingAppointmentType(false);
      resetAppointmentType();
      fetchAppointmentTypes();
    } catch (error) {
      console.error('Erro ao adicionar tipo de consulta:', error);
      toast({
        title: 'Erro ao adicionar tipo de consulta',
        description: error.message || 'Ocorreu um erro desconhecido',
        variant: 'destructive',
      });
    }
  };

  const handleEditAppointmentType = (type: AppointmentType) => {
    setEditingAppointmentType(type);
    resetAppointmentType({ name: type.name, value: type.value });
    setIsEditTypeDialogOpen(true);
  };

  const handleUpdateAppointmentType = async (data: z.infer<typeof appointmentTypeSchema>) => {
    if (!currentUser || !editingAppointmentType) return;

    try {
      const { error } = await supabase
        .from('appointment_types')
        .update({ name: data.name, value: data.value })
        .eq('id', editingAppointmentType.id)
        .eq('user_id', currentUser.id);

      if (error) throw error;

      toast({ title: 'Tipo de consulta atualizado com sucesso' });
      setIsEditTypeDialogOpen(false);
      setEditingAppointmentType(null);
      fetchAppointmentTypes();
    } catch (error) {
      console.error('Erro ao atualizar tipo de consulta:', error);
      toast({
        title: 'Erro ao atualizar tipo de consulta',
        description: error.message || 'Ocorreu um erro desconhecido',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteAppointmentType = async (typeId: string) => {
    try {
      // First, check if there are any appointments using this type
      const { data: appointmentsUsingType, error: checkError } = await supabase
        .from('appointments')
        .select('id')
        .eq('appointment_type_id', typeId)
        .limit(1);

      if (checkError) throw checkError;

      if (appointmentsUsingType && appointmentsUsingType.length > 0) {
        toast({
          title: 'Não é possível excluir o tipo de consulta',
          description: 'Existem consultas agendadas com este tipo. Remova ou altere essas consultas primeiro.',
          variant: 'destructive',
        });
        return;
      }

      // If no appointments are using this type, proceed with deletion
      const { error } = await supabase
        .from('appointment_types')
        .delete()
        .eq('id', typeId);

      if (error) throw error;

      toast({ title: 'Tipo de consulta excluído com sucesso' });
      fetchAppointmentTypes(); // Atualiza a lista de tipos de consulta
      fetchAppointments(); // Atualiza a lista de consultas (caso alguma referência tenha sido removida)
    } catch (error) {
      console.error('Erro ao excluir tipo de consulta:', error);
      toast({
        title: 'Erro ao excluir tipo de consulta',
        description: error.message || 'Ocorreu um erro desconhecido',
        variant: 'destructive',
      });
    }
  };

  const AppointmentForm = ({ isEditing }: { isEditing: boolean }) => (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Paciente</label>
        <Controller
          name="patient"
          control={control}
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um paciente" />
              </SelectTrigger>
              <SelectContent>
                {patients.map(patient => (
                  <SelectItem key={patient.id} value={patient.id}>
                    {patient.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.patient && <p className="text-red-500 text-sm mt-1">{errors.patient.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Data</label>
        <Input type="date" {...register('date')} />
        {errors.date && <p className="text-red-500 text-sm mt-1">{errors.date.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Horário</label>
        <Input type="time" {...register('time')} />
        {errors.time && <p className="text-red-500 text-sm mt-1">{errors.time.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Valor</label>
        <Input type="number" step="0.01" {...register('value', { valueAsNumber: true })} />
        {errors.value && <p className="text-red-500 text-sm mt-1">{errors.value.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tipo de Consulta</label>
        <Controller
          name="appointmentType"
          control={control}
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um tipo de consulta" />
              </SelectTrigger>
              <SelectContent>
                {appointmentTypes.map(type => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.appointmentType && <p className="text-red-500 text-sm mt-1">{errors.appointmentType.message}</p>}
      </div>

      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Salvando...' : (isEditing ? 'Atualizar Consulta' : 'Agendar Consulta')}
      </Button>
      <Button type="button" variant="outline" onClick={() => {
        setIsCreatingAppointment(false);
        setEditingAppointment(null);
        setIsEditDialogOpen(false);
        reset();
      }} className="ml-2">
        Cancelar
      </Button>
    </form>
  );

  const AppointmentTypeForm = ({ isEditing }: { isEditing: boolean }) => (
    <form onSubmit={handleSubmitAppointmentType(isEditing ? handleUpdateAppointmentType : handleAddAppointmentType)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Nome</label>
        <Input {...registerAppointmentType('name')} />
        {errorsAppointmentType.name && <p className="text-red-500 text-sm mt-1">{errorsAppointmentType.name.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Valor Padrão</label>
        <Input type="number" step="0.01" {...registerAppointmentType('value', { valueAsNumber: true })} />
        {errorsAppointmentType.value && <p className="text-red-500 text-sm mt-1">{errorsAppointmentType.value.message}</p>}
      </div>

      <Button type="submit">
        {isEditing ? 'Atualizar Tipo de Consulta' : 'Adicionar Tipo de Consulta'}
      </Button>
    </form>
  );

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Gerenciamento de Consultas</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={() => {
            setIsCreatingAppointment(true);
            setEditingAppointment(null);
            reset({
              patient: '',
              date: new Date().toISOString().split('T')[0],
              time: '',
              value: 0,
              appointmentType: '',
            });
          }}>
            Nova Consulta
          </Button>
        </CardContent>
      </Card>

      {isCreatingAppointment && (
        <Card>
          <CardHeader>
            <CardTitle>Agendar Consulta</CardTitle>
          </CardHeader>
          <CardContent>
            <AppointmentForm isEditing={false} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Tipos de Consulta</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Valor Padrão</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointmentTypes.map(type => (
                  <TableRow key={type.id}>
                    <TableCell>{type.name}</TableCell>
                    <TableCell>R$ {type.value.toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleEditAppointmentType(type)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir este tipo de consulta? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteAppointmentType(type.id)}>
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
            <Button onClick={() => setIsAddingAppointmentType(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Tipo de Consulta
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isAddingAppointmentType} onOpenChange={setIsAddingAppointmentType}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Tipo de Consulta</DialogTitle>
          </DialogHeader>
          <AppointmentTypeForm isEditing={false} />
        </DialogContent>
      </Dialog>

      <Dialog open={isEditTypeDialogOpen} onOpenChange={setIsEditTypeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Tipo de Consulta</DialogTitle>
          </DialogHeader>
          <AppointmentTypeForm isEditing={true} />
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Consultas Agendadas</CardTitle>
        </CardHeader>
        <CardContent>
          {appointments.filter(appointment => appointment.patient !== null).length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Horário</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointments
                  .filter(appointment => appointment.patient !== null)
                  .map((appointment) => (
                    <TableRow key={appointment.id}>
                      <TableCell>{appointment.patient.name}</TableCell>
                      <TableCell>{appointment.date}</TableCell>
                      <TableCell>{appointment.time}</TableCell>
                      <TableCell>{appointment.appointment_type?.name || 'N/A'}</TableCell>
                      <TableCell>R$ {appointment.value.toFixed(2)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="icon" onClick={() => handleEdit(appointment)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Editar Consulta</DialogTitle>
                              </DialogHeader>
                              <AppointmentForm isEditing={true} />
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
                                  Tem certeza que deseja excluir esta consulta? Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(appointment.id)}>
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
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500">Não há consultas agendadas no momento.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

