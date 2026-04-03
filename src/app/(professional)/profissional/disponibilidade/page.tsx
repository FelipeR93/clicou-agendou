"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Trash2, Plus } from "lucide-react";
import { translateDay } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";

type Availability = { id: string; dayOfWeek: string; startTime: string; endTime: string };

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

export default function DisponibilidadePage() {
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(true);
  const [professionalId, setProfessionalId] = useState<string | null>(null);
  const [form, setForm] = useState({ dayOfWeek: "MONDAY", startTime: "08:00", endTime: "18:00" });
  const [saving, setSaving] = useState(false);

  const fetchAvailabilities = useCallback(() => {
    fetch("/api/availability")
      .then((r) => r.json())
      .then((data) => setAvailabilities(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.profile?.id) setProfessionalId(data.profile.id);
      });
    fetchAvailabilities();
  }, [fetchAvailabilities]);

  async function handleAdd() {
    if (!professionalId) return;
    setSaving(true);
    try {
      const res = await fetch("/api/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, professionalId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao salvar");
      toast({ title: "Disponibilidade adicionada!" });
      fetchAvailabilities();
    } catch (err) {
      toast({ title: "Erro", description: err instanceof Error ? err.message : "Erro", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/availability/${id}`, { method: "DELETE" });
    if (res.ok) { toast({ title: "Disponibilidade removida" }); fetchAvailabilities(); }
    else toast({ title: "Erro ao remover", variant: "destructive" });
  }

  const groupedByDay = DAYS.reduce<Record<string, Availability[]>>((acc, day) => {
    acc[day] = availabilities.filter((a) => a.dayOfWeek === day);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Disponibilidade</h1>
        <p className="text-gray-500">Configure seus horários disponíveis</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Adicionar Disponibilidade</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2">
              <Label>Dia da Semana</Label>
              <Select value={form.dayOfWeek} onValueChange={(v) => setForm({ ...form, dayOfWeek: v })}>
                <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                <SelectContent>{DAYS.map((d) => <SelectItem key={d} value={d}>{translateDay(d)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Início</Label>
              <Input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} className="w-32" />
            </div>
            <div className="space-y-2">
              <Label>Fim</Label>
              <Input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} className="w-32" />
            </div>
            <Button onClick={handleAdd} disabled={saving}><Plus className="h-4 w-4 mr-2" />{saving ? "Salvando..." : "Adicionar"}</Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <p className="text-gray-500">Carregando...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {DAYS.map((day) => (
            <Card key={day}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{translateDay(day)}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {groupedByDay[day].length === 0 ? (
                  <p className="text-sm text-gray-400">Sem disponibilidade</p>
                ) : (
                  groupedByDay[day].map((a) => (
                    <div key={a.id} className="flex items-center justify-between bg-teal-50 rounded-md px-3 py-2">
                      <span className="text-sm font-medium text-teal-700">{a.startTime} – {a.endTime}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDelete(a.id)}>
                        <Trash2 className="h-3 w-3 text-red-500" />
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
