"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Clock, CalendarDays } from "lucide-react";
import { translateSpecialty, translateDay } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";

type Professional = {
  id: string;
  specialty: string;
  phone?: string;
  bio?: string;
  active: boolean;
  user: { id: string; name: string; email: string; active: boolean };
};

type Availability = {
  id: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
};

const SPECIALTIES = ["AT", "TO", "FONO", "PSICO", "FISIO", "OTHER"];
const DAYS_OF_WEEK = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

export default function ProfissionaisPage() {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Professional | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", specialty: "AT", phone: "", bio: "" });
  const [saving, setSaving] = useState(false);

  // Availability management
  const [availOpen, setAvailOpen] = useState(false);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [availLoading, setAvailLoading] = useState(false);
  const [availForm, setAvailForm] = useState({ dayOfWeek: "MONDAY", startTime: "08:00", endTime: "17:00" });
  const [availSaving, setAvailSaving] = useState(false);

  const fetchProfessionals = useCallback(() => {
    setLoading(true);
    fetch("/api/professionals")
      .then((r) => r.json())
      .then((data) => setProfessionals(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchProfessionals(); }, [fetchProfessionals]);

  function openCreate() {
    setEditing(null);
    setForm({ name: "", email: "", password: "", specialty: "AT", phone: "", bio: "" });
    setOpen(true);
  }

  function openEdit(p: Professional) {
    setEditing(p);
    setForm({ name: p.user.name, email: p.user.email, password: "", specialty: p.specialty, phone: p.phone ?? "", bio: p.bio ?? "" });
    setOpen(true);
  }

  function openAvailability(p: Professional) {
    setSelectedProfessional(p);
    setAvailForm({ dayOfWeek: "MONDAY", startTime: "08:00", endTime: "17:00" });
    setAvailOpen(true);
    setAvailLoading(true);
    fetch(`/api/availability?professionalId=${p.id}`)
      .then((r) => r.json())
      .then((data) => setAvailabilities(Array.isArray(data) ? data : []))
      .finally(() => setAvailLoading(false));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const url = editing ? `/api/professionals/${editing.id}` : "/api/professionals";
      const method = editing ? "PUT" : "POST";
      const body = editing
        ? { name: form.name, specialty: form.specialty, phone: form.phone, bio: form.bio }
        : form;

      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao salvar");

      toast({ title: editing ? "Profissional atualizado!" : "Profissional criado!", description: form.name });
      setOpen(false);
      fetchProfessionals();
    } catch (err) {
      toast({ title: "Erro", description: err instanceof Error ? err.message : "Erro ao salvar", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(p: Professional) {
    if (!confirm(`Desativar ${p.user.name}?`)) return;
    const res = await fetch(`/api/professionals/${p.id}`, { method: "DELETE" });
    if (res.ok) { toast({ title: "Profissional desativado" }); fetchProfessionals(); }
    else toast({ title: "Erro ao desativar", variant: "destructive" });
  }

  async function handleAddAvailability() {
    if (!selectedProfessional) return;
    setAvailSaving(true);
    try {
      const res = await fetch("/api/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...availForm, professionalId: selectedProfessional.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao adicionar");
      toast({ title: "Disponibilidade adicionada!" });
      setAvailabilities((prev) => [...prev, data]);
    } catch (err) {
      toast({ title: "Erro", description: err instanceof Error ? err.message : "Erro", variant: "destructive" });
    } finally {
      setAvailSaving(false);
    }
  }

  async function handleRemoveAvailability(id: string) {
    const res = await fetch(`/api/availability/${id}`, { method: "DELETE" });
    if (res.ok) {
      setAvailabilities((prev) => prev.filter((a) => a.id !== id));
      toast({ title: "Disponibilidade removida" });
    } else {
      toast({ title: "Erro ao remover", variant: "destructive" });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profissionais</h1>
          <p className="text-gray-500">Gerencie os profissionais da clínica</p>
        </div>
        <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />Novo Profissional
        </Button>
      </div>

      <Card className="border-blue-100 shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <p className="p-6 text-gray-500">Carregando...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-blue-50/60">
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Especialidade</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {professionals.map((p) => (
                  <TableRow key={p.id} className="hover:bg-blue-50/30">
                    <TableCell className="font-medium">{p.user.name}</TableCell>
                    <TableCell className="text-gray-500">{p.user.email}</TableCell>
                    <TableCell><Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">{translateSpecialty(p.specialty)}</Badge></TableCell>
                    <TableCell className="text-gray-500">{p.phone ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={p.active ? "success" : "destructive"}>{p.active ? "Ativo" : "Inativo"}</Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" title="Disponibilidade" onClick={() => openAvailability(p)}>
                        <CalendarDays className="h-4 w-4 text-blue-500" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(p)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
                {professionals.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center text-gray-500 py-8">Nenhum profissional cadastrado</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog: Criar/Editar Profissional */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Profissional" : "Novo Profissional"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nome completo" />
            </div>
            {!editing && (
              <>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@exemplo.com" />
                </div>
                <div className="space-y-2">
                  <Label>Senha</Label>
                  <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Mínimo 8 caracteres" />
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label>Especialidade</Label>
              <Select value={form.specialty} onValueChange={(v) => setForm({ ...form, specialty: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SPECIALTIES.map((s) => (
                    <SelectItem key={s} value={s}>{translateSpecialty(s)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Telefone (opcional)</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(11) 99999-9999" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">{saving ? "Salvando..." : "Salvar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Disponibilidade */}
      <Dialog open={availOpen} onOpenChange={setAvailOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-blue-600" />
              Disponibilidade — {selectedProfessional?.user.name}
            </DialogTitle>
          </DialogHeader>

          {/* Adicionar novo horário */}
          <div className="bg-blue-50 rounded-lg p-4 space-y-3 border border-blue-100">
            <p className="text-sm font-semibold text-blue-800">Adicionar horário disponível</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Dia</Label>
                <Select value={availForm.dayOfWeek} onValueChange={(v) => setAvailForm({ ...availForm, dayOfWeek: v })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DAYS_OF_WEEK.map((d) => (
                      <SelectItem key={d} value={d}>{translateDay(d)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Início</Label>
                <Input type="time" value={availForm.startTime} onChange={(e) => setAvailForm({ ...availForm, startTime: e.target.value })} className="h-8 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Fim</Label>
                <Input type="time" value={availForm.endTime} onChange={(e) => setAvailForm({ ...availForm, endTime: e.target.value })} className="h-8 text-xs" />
              </div>
            </div>
            <Button size="sm" onClick={handleAddAvailability} disabled={availSaving} className="bg-blue-600 hover:bg-blue-700 w-full">
              <Plus className="h-3.5 w-3.5 mr-1" />{availSaving ? "Adicionando..." : "Adicionar dia"}
            </Button>
          </div>

          {/* Lista de horários */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {availLoading ? (
              <p className="text-sm text-gray-500 text-center py-4">Carregando...</p>
            ) : availabilities.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">Nenhuma disponibilidade cadastrada</p>
            ) : (
              availabilities.map((a) => (
                <div key={a.id} className="flex items-center justify-between p-3 bg-white border border-blue-100 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-sm font-medium text-gray-800">{translateDay(a.dayOfWeek)}</span>
                    <span className="flex items-center gap-1 text-sm text-gray-500">
                      <Clock className="h-3.5 w-3.5" />{a.startTime} – {a.endTime}
                    </span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleRemoveAvailability(a.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-red-500" />
                  </Button>
                </div>
              ))
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAvailOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
