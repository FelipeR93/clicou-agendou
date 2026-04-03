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
import { Plus, Pencil, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
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

export default function AprendizesPage() {
  const [aprendizes, setAprendizes] = useState<Aprendiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Aprendiz | null>(null);
  const [form, setForm] = useState({ name: "", dateOfBirth: "", diagnosis: "", notes: "" });
  const [saving, setSaving] = useState(false);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Aprendizes</h1>
          <p className="text-gray-500">Gerencie os aprendizes da clínica</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Novo Aprendiz</Button>
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
                  <TableHead>Data de Nasc.</TableHead>
                  <TableHead>Diagnóstico</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {aprendizes.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.name}</TableCell>
                    <TableCell>{a.dateOfBirth ? formatDate(a.dateOfBirth) : "—"}</TableCell>
                    <TableCell className="max-w-xs truncate">{a.diagnosis ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={a.active ? "success" : "destructive"}>{a.active ? "Ativo" : "Inativo"}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
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
            <Button onClick={handleSave} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
