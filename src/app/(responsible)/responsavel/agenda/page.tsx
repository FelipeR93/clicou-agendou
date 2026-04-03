"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, translateStatus, translateSpecialty } from "@/lib/utils";

type Appointment = {
  id: string;
  scheduledStart: string;
  scheduledEnd: string;
  status: string;
  aprendiz: { name: string };
  professional: { specialty: string; user: { name: string } };
  room?: { name: string };
};

export default function ResponsavelAgendaPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAppointments = useCallback(() => {
    fetch("/api/appointments")
      .then((r) => r.json())
      .then((data) => setAppointments(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  const upcoming = appointments.filter(
    (a) => new Date(a.scheduledStart) >= new Date() && a.status !== "CANCELLED"
  );
  const past = appointments.filter(
    (a) => new Date(a.scheduledStart) < new Date() || a.status === "COMPLETED" || a.status === "CANCELLED"
  );

  const statusVariant: Record<string, "default" | "secondary" | "success" | "destructive" | "warning"> = {
    SCHEDULED: "secondary",
    IN_PROGRESS: "warning",
    COMPLETED: "success",
    CANCELLED: "destructive",
  };

  function AptCard({ apt }: { apt: Appointment }) {
    return (
      <div className="flex items-start justify-between p-4 border border-gray-200 rounded-lg bg-white">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold">{apt.aprendiz.name}</span>
            <Badge variant={statusVariant[apt.status] ?? "secondary"}>{translateStatus(apt.status)}</Badge>
          </div>
          <p className="text-sm text-gray-500">
            {apt.professional.user.name} ({translateSpecialty(apt.professional.specialty)})
            {apt.room && ` • ${apt.room.name}`}
          </p>
          <p className="text-sm text-gray-600">
            {formatDate(apt.scheduledStart, "dd/MM/yyyy")} •{" "}
            {new Date(apt.scheduledStart).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            {" – "}
            {new Date(apt.scheduledEnd).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      </div>
    );
  }

  if (loading) return <div className="p-6 text-gray-500">Carregando...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Agenda do Aprendiz</h1>
        <p className="text-gray-500">Acompanhe os atendimentos agendados</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Próximos Atendimentos</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {upcoming.length === 0 ? (
            <p className="text-gray-500 text-sm">Nenhum atendimento próximo.</p>
          ) : (
            upcoming.map((apt) => <AptCard key={apt.id} apt={apt} />)
          )}
        </CardContent>
      </Card>

      {past.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Histórico</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {past.map((apt) => <AptCard key={apt.id} apt={apt} />)}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
