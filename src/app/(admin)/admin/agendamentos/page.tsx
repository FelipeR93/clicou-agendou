"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2 } from "lucide-react";
import { translateSpecialty, translateStatus, formatDate } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";

type Professional = { id: string; specialty: string; user: { name: string } };
type Aprendiz = { id: string; name: string };
type Room = { id: string; name: string };
type Appointment = {
  id: string;
  scheduledStart: string;
  scheduledEnd: string;
  status: string;
  notes?: string;
  aprendiz: { id: string; name: string };
  professional: { id: string; specialty: string; user: { name: string } };
  room?: { id: string; name: string };
};

export default function AgendamentosPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [aprendizes, setAprendizes] = useState<Aprendiz[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [filterDate, setFilterDate] = useState("");
  const [form, setForm] = useState({
    aprendizId: "", professionalId: "", roomId: "",
    scheduledStart: "", scheduledEnd: "", notes: "",
  });
  const [saving, setSaving] = useState(false);

  const fetchAppointments = useCallback(() => {
    setLoading(true);
    const params = filterDate ? `?date=${filterDate}` : "";
    fetch(`/api/appointments${params}`)
      .then((r) => r.json())
      .then((data) => setAppointments(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, [filterDate]);

  useEffect(() => {
    fetchAppointments();
    Promise.all([
      fetch("/api/professionals").then((r) => r.json()),
      fetch("/api/aprendizes").then((r) => r.json()),
      fetch("/api/rooms").then((r) => r.json()),
    ]).then(([p, a, r]) => {
      setProfessionals(Array.isArray(p) ? p : []);
      setAprendizes(Array.isArray(a) ? a : []);
      setRooms(Array.isArray(r) ? r : []);
    });
  }, [fetchAppointments]);

  async function handleCreate() {
    setSaving(true);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          scheduledStart: new Date(form.scheduledStart).toISOString(),
          scheduledEnd: new Date(form.scheduledEnd).toISOString(),
          roomId: form.roomId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao criar");
      toast({ title: "Agendamento criado!" });
      setOpen(false);
      fetchAppointments();
    } catch (err) {
      toast({ title: "Erro", description: err instanceof Error ? err.message : "Erro", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function handleCancel(id: string) {
    if (!confirm("Cancelar este agendamento?")) return;
    const res = await fetch(`/api/appointments/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cancelReason: "Cancelado pelo administrador" }),
    });
    if (res.ok) { toast({ title: "Agendamento cancelado" }); fetchAppointments(); }
    else toast({ title: "Erro ao cancelar", variant: "destructive" });
  }

  const statusColor: Record<string, string> = {
    SCHEDULED: "secondary",
    IN_PROGRESS: "default",
    COMPLETED: "success",
    CANCELLED: "destructive",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agendamentos</h1>
          <p className="text-gray-500">Gerencie todos os agendamentos</p>
        </div>
        <Button onClick={() => { setForm({ aprendizId: "", professionalId: "", roomId: "", scheduledStart: "", scheduledEnd: "", notes: "" }); setOpen(true); }} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />Novo Agendamento
        </Button>
      </div>

      <div className="flex gap-4 items-end">
        <div className="space-y-1">
          <Label>Filtrar por data</Label>
          <Input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="w-48" />
        </div>
        {filterDate && <Button variant="outline" onClick={() => setFilterDate("")}>Limpar filtro</Button>}
      </div>

      <Card className="border-blue-100 shadow-sm">
        <CardContent className="p-0">
          {loading ? <p className="p-6 text-gray-500">Carregando...</p> : (
            <div className="divide-y divide-blue-50">
              {appointments.map((apt) => (
                <div key={apt.id} className="p-4 flex items-start justify-between hover:bg-blue-50/40 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{apt.aprendiz.name}</span>
                      <Badge variant={statusColor[apt.status] as "default" | "secondary" | "destructive" | "success" | "warning" | "outline"}>{translateStatus(apt.status)}</Badge>
                    </div>
                    <p className="text-sm text-gray-500">
                      Prof: {apt.professional.user.name} ({translateSpecialty(apt.professional.specialty)})
                      {apt.room && ` • Sala: ${apt.room.name}`}
                    </p>
                    <p className="text-sm text-gray-600">
                      {formatDate(apt.scheduledStart, "dd/MM/yyyy")} •{" "}
                      {new Date(apt.scheduledStart).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      {" – "}
                      {new Date(apt.scheduledEnd).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  {apt.status === "SCHEDULED" && (
                    <Button variant="ghost" size="icon" onClick={() => handleCancel(apt.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  )}
                </div>
              ))}
              {appointments.length === 0 && (
                <p className="p-6 text-center text-gray-500">Nenhum agendamento encontrado</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>Novo Agendamento</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label>Aprendiz</Label>
              <Select value={form.aprendizId} onValueChange={(v) => setForm({ ...form, aprendizId: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>{aprendizes.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Profissional</Label>
              <Select value={form.professionalId} onValueChange={(v) => setForm({ ...form, professionalId: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>{professionals.map((p) => <SelectItem key={p.id} value={p.id}>{p.user.name} — {translateSpecialty(p.specialty)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Início</Label>
              <Input type="datetime-local" value={form.scheduledStart} onChange={(e) => setForm({ ...form, scheduledStart: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Fim</Label>
              <Input type="datetime-local" value={form.scheduledEnd} onChange={(e) => setForm({ ...form, scheduledEnd: e.target.value })} />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Sala (opcional)</Label>
              <Select value={form.roomId} onValueChange={(v) => setForm({ ...form, roomId: v })}>
                <SelectTrigger><SelectValue placeholder="Sem sala definida" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sem sala</SelectItem>
                  {rooms.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={saving} className="bg-blue-600 hover:bg-blue-700">{saving ? "Criando..." : "Criar Agendamento"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
