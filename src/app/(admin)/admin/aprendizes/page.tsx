"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, HeartPulse } from "lucide-react";
import { formatDate, translateSpecialty } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";

type Aprendiz = {
  id: string;
  name: string;
  dateOfBirth?: string;
  diagnosis?: string;
  notes?: string;
  active: boolean;
  responsibleId?: string;
};

type AprendizNeed = {
  id: string;
  specialty: string;
  sessionsPerWeek: number;
  notes?: string;
};

const SPECIALTIES = ["AT", "TO", "FONO", "PSICO", "FISIO", "OTHER"];

export default function AprendizesPage() {
  const [aprendizes, setAprendizes] = useState<Aprendiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Aprendiz | null>(null);
  const [form, setForm] = useState({ name: "", dateOfBirth: "", diagnosis: "", notes: "" });
  const [saving, setSaving] = useState(false);

  // Needs management
  const [needsOpen, setNeedsOpen] = useState(false);
  const [selectedAprendiz, setSelectedAprendiz] = useState<Aprendiz | null>(null);
  const [needs, setNeeds] = useState<AprendizNeed[]>([]);
  const [needsLoading, setNeedsLoading] = useState(false);
  const [needForm, setNeedForm] = useState({ specialty: "AT", sessionsPerWeek: "1", notes: "" });
  const [needSaving, setNeedSaving] = useState(false);

  const fetchAprendizes = useCallback(() => {
    setLoading(true);
    fetch("/api/aprendizes")
      .then((r) => r.json())
      .then((data) => setAprendizes(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchAprendizes(); }, [fetchAprendizes]);

  function openCreate() {
    setEditing(null);
    setForm({ name: "", dateOfBirth: "", diagnosis: "", notes: "" });
    setOpen(true);
  }

  function openEdit(a: Aprendiz) {
    setEditing(a);
    setForm({
      name: a.name,
      dateOfBirth: a.dateOfBirth ? a.dateOfBirth.split("T")[0] : "",
      diagnosis: a.diagnosis ?? "",
      notes: a.notes ?? "",
    });
    setOpen(true);
  }

  function openNeeds(a: Aprendiz) {
    setSelectedAprendiz(a);
    setNeedForm({ specialty: "AT", sessionsPerWeek: "1", notes: "" });
    setNeedsOpen(true);
    setNeedsLoading(true);
    fetch(`/api/aprendizes/${a.id}/necessidades`)
      .then((r) => r.json())
      .then((data) => setNeeds(Array.isArray(data) ? data : []))
      .finally(() => setNeedsLoading(false));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const url = editing ? `/api/aprendizes/${editing.id}` : "/api/aprendizes";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao salvar");
      toast({ title: editing ? "Aprendiz atualizado!" : "Aprendiz cadastrado!", description: form.name });
      setOpen(false);
      fetchAprendizes();
    } catch (err) {
      toast({ title: "Erro", description: err instanceof Error ? err.message : "Erro ao salvar", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(a: Aprendiz) {
    if (!confirm(`Desativar ${a.name}?`)) return;
    const res = await fetch(`/api/aprendizes/${a.id}`, { method: "DELETE" });
    if (res.ok) { toast({ title: "Aprendiz desativado" }); fetchAprendizes(); }
    else toast({ title: "Erro ao desativar", variant: "destructive" });
  }

  async function handleAddNeed() {
    if (!selectedAprendiz) return;
    setNeedSaving(true);
    try {
      const res = await fetch(`/api/aprendizes/${selectedAprendiz.id}/necessidades`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...needForm, sessionsPerWeek: Number(needForm.sessionsPerWeek) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao adicionar");
      toast({ title: "Necessidade adicionada!" });
      setNeeds((prev) => [...prev, data]);
      setNeedForm({ specialty: "AT", sessionsPerWeek: "1", notes: "" });
    } catch (err) {
      toast({ title: "Erro", description: err instanceof Error ? err.message : "Erro", variant: "destructive" });
    } finally {
      setNeedSaving(false);
    }
  }

  async function handleRemoveNeed(needId: string) {
    if (!selectedAprendiz) return;
    const res = await fetch(`/api/aprendizes/${selectedAprendiz.id}/necessidades/${needId}`, { method: "DELETE" });
    if (res.ok) {
      setNeeds((prev) => prev.filter((n) => n.id !== needId));
      toast({ title: "Necessidade removida" });
    } else {
      toast({ title: "Erro ao remover", variant: "destructive" });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Aprendizes</h1>
          <p className="text-gray-500">Gerencie os aprendizes da clínica</p>
        </div>
        <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />Novo Aprendiz
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
                  <TableHead>Data de Nasc.</TableHead>
                  <TableHead>Diagnóstico</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {aprendizes.map((a) => (
                  <TableRow key={a.id} className="hover:bg-blue-50/30">
                    <TableCell className="font-medium">{a.name}</TableCell>
                    <TableCell>{a.dateOfBirth ? formatDate(a.dateOfBirth) : "—"}</TableCell>
                    <TableCell className="max-w-xs truncate">{a.diagnosis ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={a.active ? "success" : "destructive"}>{a.active ? "Ativo" : "Inativo"}</Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" title="Necessidades" onClick={() => openNeeds(a)}>
                        <HeartPulse className="h-4 w-4 text-blue-500" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(a)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(a)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
                {aprendizes.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center text-gray-500 py-8">Nenhum aprendiz cadastrado</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog: Criar/Editar Aprendiz */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Aprendiz" : "Novo Aprendiz"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nome completo" />
            </div>
            <div className="space-y-2">
              <Label>Data de Nascimento (opcional)</Label>
              <Input type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Diagnóstico (opcional)</Label>
              <Input value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} placeholder="Ex: TEA nível 1" />
            </div>
            <div className="space-y-2">
              <Label>Observações (opcional)</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Informações relevantes..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">{saving ? "Salvando..." : "Salvar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Necessidades do Aprendiz */}
      <Dialog open={needsOpen} onOpenChange={setNeedsOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HeartPulse className="h-5 w-5 text-blue-600" />
              Necessidades — {selectedAprendiz?.name}
            </DialogTitle>
          </DialogHeader>

          {/* Adicionar nova necessidade */}
          <div className="bg-blue-50 rounded-lg p-4 space-y-3 border border-blue-100">
            <p className="text-sm font-semibold text-blue-800">Adicionar necessidade</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Especialidade necessária</Label>
                <Select value={needForm.specialty} onValueChange={(v) => setNeedForm({ ...needForm, specialty: v })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SPECIALTIES.map((s) => (
                      <SelectItem key={s} value={s}>{translateSpecialty(s)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Sessões por semana</Label>
                <Input
                  type="number"
                  min="1"
                  max="7"
                  value={needForm.sessionsPerWeek}
                  onChange={(e) => setNeedForm({ ...needForm, sessionsPerWeek: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1 col-span-2">
                <Label className="text-xs">Observações (opcional)</Label>
                <Input
                  value={needForm.notes}
                  onChange={(e) => setNeedForm({ ...needForm, notes: e.target.value })}
                  placeholder="Ex: preferência de horário matutino"
                  className="h-8 text-xs"
                />
              </div>
            </div>
            <Button size="sm" onClick={handleAddNeed} disabled={needSaving} className="bg-blue-600 hover:bg-blue-700 w-full">
              <Plus className="h-3.5 w-3.5 mr-1" />{needSaving ? "Adicionando..." : "Adicionar necessidade"}
            </Button>
          </div>

          {/* Lista de necessidades */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {needsLoading ? (
              <p className="text-sm text-gray-500 text-center py-4">Carregando...</p>
            ) : needs.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">Nenhuma necessidade cadastrada</p>
            ) : (
              needs.map((n) => (
                <div key={n.id} className="flex items-center justify-between p-3 bg-white border border-blue-100 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <div>
                      <span className="text-sm font-medium text-gray-800">{translateSpecialty(n.specialty)}</span>
                      <span className="ml-2 text-xs text-gray-500">{n.sessionsPerWeek}x/semana</span>
                      {n.notes && <p className="text-xs text-gray-400 mt-0.5">{n.notes}</p>}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleRemoveNeed(n.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-red-500" />
                  </Button>
                </div>
              ))
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setNeedsOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
