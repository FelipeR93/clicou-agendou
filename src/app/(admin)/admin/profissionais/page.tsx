"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { translateSpecialty } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";

type Professional = {
  id: string;
  specialty: string;
  phone?: string;
  bio?: string;
  active: boolean;
  user: { id: string; name: string; email: string; active: boolean };
};

const SPECIALTIES = ["AT", "TO", "FONO", "PSICO", "FISIO", "OTHER"];

export default function ProfissionaisPage() {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Professional | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", specialty: "AT", phone: "", bio: "" });
  const [saving, setSaving] = useState(false);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profissionais</h1>
          <p className="text-gray-500">Gerencie os profissionais da clínica</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Novo Profissional</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <p className="p-6 text-gray-500">Carregando...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
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
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.user.name}</TableCell>
                    <TableCell className="text-gray-500">{p.user.email}</TableCell>
                    <TableCell><Badge variant="secondary">{translateSpecialty(p.specialty)}</Badge></TableCell>
                    <TableCell className="text-gray-500">{p.phone ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={p.active ? "success" : "destructive"}>{p.active ? "Ativo" : "Inativo"}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
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
            <Button onClick={handleSave} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
