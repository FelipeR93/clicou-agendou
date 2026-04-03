"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Square } from "lucide-react";
import { formatDate, translateStatus, translateSpecialty } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";

type Appointment = {
  id: string;
  scheduledStart: string;
  scheduledEnd: string;
  status: string;
  notes?: string;
  aprendiz: { id: string; name: string };
  professional: { specialty: string };
  room?: { name: string };
};

export default function ProfessionalAgendaPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchAppointments = useCallback(() => {
    fetch("/api/appointments")
      .then((r) => r.json())
      .then((data) => setAppointments(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  async function handleStart(appointmentId: string) {
    setActionLoading(appointmentId);
    try {
      const res = await fetch("/api/attendance/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: "Atendimento iniciado!" });
      fetchAppointments();
    } catch (err) {
      toast({ title: "Erro", description: err instanceof Error ? err.message : "Erro", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  }

  async function handleEnd(appointmentId: string) {
    setActionLoading(appointmentId);
    try {
      const res = await fetch("/api/attendance/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: "Atendimento encerrado!" });
      fetchAppointments();
    } catch (err) {
      toast({ title: "Erro", description: err instanceof Error ? err.message : "Erro", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  }

  const today = new Date().toDateString();
  const todayApts = appointments.filter((a) => new Date(a.scheduledStart).toDateString() === today);
  const upcomingApts = appointments.filter((a) => new Date(a.scheduledStart).toDateString() !== today && new Date(a.scheduledStart) >= new Date());

  const statusVariant: Record<string, "default" | "secondary" | "success" | "destructive" | "warning"> = {
    SCHEDULED: "secondary",
    IN_PROGRESS: "warning",
    COMPLETED: "success",
    CANCELLED: "destructive",
  };

  function AppointmentCard({ apt }: { apt: Appointment }) {
    return (
      <div className="flex items-start justify-between p-4 border border-gray-200 rounded-lg bg-white">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900">{apt.aprendiz.name}</span>
            <Badge variant={statusVariant[apt.status] ?? "secondary"}>{translateStatus(apt.status)}</Badge>
          </div>
          <p className="text-sm text-gray-500">
            {translateSpecialty(apt.professional.specialty)}
            {apt.room && ` • Sala: ${apt.room.name}`}
          </p>
          <p className="text-sm text-gray-600">
            {formatDate(apt.scheduledStart, "dd/MM/yyyy")} •{" "}
            {new Date(apt.scheduledStart).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            {" – "}
            {new Date(apt.scheduledEnd).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
        <div className="flex gap-2">
          {apt.status === "SCHEDULED" && (
            <Button size="sm" onClick={() => handleStart(apt.id)} disabled={actionLoading === apt.id}>
              <Play className="h-4 w-4 mr-1" />
              {actionLoading === apt.id ? "..." : "Iniciar"}
            </Button>
          )}
          {apt.status === "IN_PROGRESS" && (
            <Button size="sm" variant="destructive" onClick={() => handleEnd(apt.id)} disabled={actionLoading === apt.id}>
              <Square className="h-4 w-4 mr-1" />
              {actionLoading === apt.id ? "..." : "Encerrar"}
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (loading) return <div className="p-6 text-gray-500">Carregando...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Minha Agenda</h1>
        <p className="text-gray-500">Gerencie seus atendimentos</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Hoje — {formatDate(new Date())}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {todayApts.length === 0 ? (
            <p className="text-gray-500 text-sm">Nenhum atendimento para hoje.</p>
          ) : (
            todayApts.map((apt) => <AppointmentCard key={apt.id} apt={apt} />)
          )}
        </CardContent>
      </Card>

      {upcomingApts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Próximos Atendimentos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingApts.map((apt) => <AppointmentCard key={apt.id} apt={apt} />)}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
