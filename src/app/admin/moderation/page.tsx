import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ModerationActions } from "@/components/admin/moderation/moderation-actions"; // Criaremos este
import { ShieldCheck, User, MessageCircle } from "lucide-react";

export default async function ModerationPage() {
  // Busca denúncias pendentes, agrupando pelo comentário
  const pendingReports = await prisma.report.findMany({
    where: { status: 'PENDING' },
    orderBy: { createdAt: 'asc' },
    include: {
      comment: {
        include: {
          user: { select: { name: true, image: true, username: true } },
        },
      },
      reporter: {
        select: { name: true, username: true },
      },
    },
  });

  // Agrupa denúncias pelo mesmo comentário
  const groupedReports = pendingReports.reduce((acc, report) => {
    const commentId = report.commentId;
    if (!acc[commentId]) {
      acc[commentId] = {
        comment: report.comment,
        reports: [],
      };
    }
    acc[commentId].reports.push(report);
    return acc;
  }, {} as Record<string, { comment: any; reports: any[] }>);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Fila de Moderação</h1>
        <p className="text-zinc-400">
          Analise os comentários denunciados pela comunidade.
        </p>
      </div>

      <div className="space-y-6">
        {Object.values(groupedReports).length === 0 ? (
          <div className="text-center py-20 border border-dashed border-zinc-800 rounded-xl">
            <ShieldCheck className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-500">A fila de moderação está limpa. Bom trabalho!</p>
          </div>
        ) : (
          Object.values(groupedReports).map(({ comment, reports }) => (
            <Card key={comment.id} className="bg-[#111] border-[#27272a]">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      Comentário Denunciado <Badge variant="destructive">{reports.length}x</Badge>
                    </CardTitle>
                    <CardDescription className="text-zinc-500">
                      Postado por <span className="font-medium text-zinc-300">{comment.user.name}</span>
                    </CardDescription>
                  </div>
                  <ModerationActions reportId={reports[0].id} />
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* O Comentário */}
                <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800 italic text-zinc-300">
                  "{comment.content}"
                </div>

                {/* Lista de Denúncias */}
                <div>
                  <h4 className="text-sm font-bold text-zinc-400 mb-2">Motivos das Denúncias:</h4>
                  <div className="space-y-2">
                    {reports.map(report => (
                      <div key={report.id} className="text-xs p-2 bg-zinc-800 rounded">
                        <span className="font-bold text-yellow-400">{report.reason}</span> por <span className="font-medium text-zinc-300">{report.reporter.name}</span>
                        {report.notes && <p className="text-zinc-400 mt-1">Nota: "{report.notes}"</p>}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}