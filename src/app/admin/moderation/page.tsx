import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ModerationActions } from "@/components/admin/moderation/moderation-actions";
import { ShieldCheck } from "lucide-react";

export default async function ModerationPage() {
  // A query busca denúncias pendentes tanto de comentários quanto de posts
  const pendingReports = await prisma.report.findMany({
    where: { status: 'PENDING' },
    orderBy: { createdAt: 'asc' },
    include: {
      comment: {
        include: { user: { select: { name: true, image: true, username: true } } },
      },
      post: {
        include: { user: { select: { name: true, image: true, username: true } } },
      },
      reporter: {
        select: { name: true, username: true },
      },
    },
  });

  // Agrupamento robusto de denúncias
  const groupedReports = pendingReports.reduce((acc, report) => {
    // CORREÇÃO: Verificamos qual ID existe e usamos um prefixo para evitar colisões
    const contentId = report.commentId ? `comment-${report.commentId}` : report.postId ? `post-${report.postId}` : null;
    
    // Se não houver ID, ignora esta denúncia (não deveria acontecer, mas é uma proteção)
    if (!contentId) {
        return acc;
    }
    
    if (!acc[contentId]) {
      acc[contentId] = {
        // Armazena tanto o comentário quanto o post, um deles será null
        content: report.comment || report.post,
        contentType: report.commentId ? 'Comentário' : 'Post',
        reports: [],
      };
    }
    acc[contentId].reports.push(report);
    return acc;
  }, {} as Record<string, { content: any; contentType: string; reports: any[] }>);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Fila de Moderação</h1>
        <p className="text-zinc-400">
          Analise o conteúdo denunciado pela comunidade ({Object.keys(groupedReports).length} itens pendentes).
        </p>
      </div>

      <div className="space-y-6">
        {Object.keys(groupedReports).length === 0 ? (
          <div className="text-center py-20 border border-dashed border-zinc-800 rounded-xl">
            <ShieldCheck className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-500">A fila de moderação está limpa. Bom trabalho!</p>
          </div>
        ) : (
          Object.values(groupedReports).map(({ content, contentType, reports }) => (
            <Card key={reports[0].id} className="bg-[#111] border-[#27272a]">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {contentType} Denunciado <Badge variant="destructive">{reports.length}x</Badge>
                    </CardTitle>
                    <CardDescription className="text-zinc-500">
                      Postado por <span className="font-medium text-zinc-300">{content.user.name}</span>
                    </CardDescription>
                  </div>
                  {/* Passamos o ID da *primeira* denúncia do grupo para as ações */}
                  <ModerationActions reportId={reports[0].id} />
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800 italic text-zinc-300">
                  "{content.content}"
                </div>

                <div>
                  <h4 className="text-sm font-bold text-zinc-400 mb-2">Motivos das Denúncias:</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
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