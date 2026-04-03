import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Baby, Calendar, CheckCircle } from "lucide-react";

async function getStats() {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  const [professionals, aprendizes, today, completed, recentAppointments] = await Promise.all([
    prisma.professional.count({ where: { active: true } }),
    prisma.aprendiz.count({ where: { active: true } }),
    prisma.appointment.count({ where: { scheduledStart: { gte: startOfDay, lt: endOfDay } } }),
    prisma.appointment.count({ where: { status: "COMPLETED" } }),
    prisma.appointment.findMany({
      where: { scheduledStart: { gte: startOfDay, lt: endOfDay } },
      include: {
        aprendiz: { select: { name: true } },
        professional: { include: { user: { select: { name: true } } } },
      },
      orderBy: { scheduledStart: "asc" },
      take: 10,
    }),
  ]);

  return { professionals, aprendizes, today, completed, recentAppointments };
}

export default async function AdminDashboard() {
  const { professionals, aprendizes, today, completed, recentAppointments } = await getStats();

  const stats = [
    { title: "Profissionais Ativos", value: professionals, icon: Users, color: "text-teal-600", bg: "bg-teal-50" },
    { title: "Aprendizes Ativos", value: aprendizes, icon: Baby, color: "text-blue-600", bg: "bg-blue-50" },
    { title: "Atendimentos Hoje", value: today, icon: Calendar, color: "text-orange-600", bg: "bg-orange-50" },
    { title: "Concluídos (Total)", value: completed, icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Visão geral do sistema</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ title, value, icon: Icon, color, bg }) => (
          <Card key={title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
                </div>
                <div className={`${bg} p-3 rounded-full`}>
                  <Icon className={`h-6 w-6 ${color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Atendimentos de Hoje</CardTitle>
        </CardHeader>
        <CardContent>
          {recentAppointments.length === 0 ? (
            <p className="text-gray-500 text-sm">Nenhum atendimento agendado para hoje.</p>
          ) : (
            <div className="space-y-3">
              {recentAppointments.map((apt) => (
                <div key={apt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <div>
                    <p className="font-medium text-gray-900">{apt.aprendiz.name}</p>
                    <p className="text-sm text-gray-500">
                      Prof: {apt.professional.user.name} •{" "}
                      {new Date(apt.scheduledStart).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      {" – "}
                      {new Date(apt.scheduledEnd).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    apt.status === "COMPLETED" ? "bg-green-100 text-green-700" :
                    apt.status === "IN_PROGRESS" ? "bg-blue-100 text-blue-700" :
                    apt.status === "CANCELLED" ? "bg-red-100 text-red-700" :
                    "bg-gray-100 text-gray-700"
                  }`}>
                    {apt.status === "SCHEDULED" ? "Agendado" :
                     apt.status === "IN_PROGRESS" ? "Em Andamento" :
                     apt.status === "COMPLETED" ? "Concluído" : "Cancelado"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
