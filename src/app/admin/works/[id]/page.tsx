import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { WorkImage } from "@/components/admin/work-image";
import { VisibilityToggleButton } from "@/components/admin/visibility-toggle-button";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Edit, Plus, Coins, FileImage, Trash2 } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function WorkDetailsPage({ params }: PageProps) {
  const { id } = await params;

  const work = await prisma.work.findUnique({
    where: { id },
    include: {
      chapters: {
        orderBy: { order: "desc" },
      },
    },
  });

  if (!work) return notFound();

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* --- HEADER --- */}
      <div className="flex items-start gap-6">
        <div className="w-48 aspect-[2/3] shrink-0 rounded-lg overflow-hidden border border-zinc-800 shadow-lg">
          <WorkImage src={work.coverUrl} alt={work.title} className="w-full h-full" />
        </div>
        <div className="flex-1 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
               <div className="flex items-center gap-3">
                 <Link href="/admin/works" className="text-zinc-500 hover:text-white transition-colors">
                   <ArrowLeft className="w-5 h-5" />
                 </Link>
                 {work.isAdult && <Badge variant="outline" className="text-red-400 border-red-900">+18</Badge>}
                 {work.isHidden ? (
                    <Badge variant="secondary">Oculto</Badge>
                 ) : (
                    <Badge className="bg-green-700 hover:bg-green-700">Público</Badge>
                 )}
               </div>
               <h1 className="text-4xl font-bold text-white tracking-tight">{work.title}</h1>
               <p className="text-xl text-zinc-400">{work.author} {work.studio && <span className="text-zinc-600">• {work.studio}</span>}</p>
            </div>
            
            <div className="flex gap-2">
               <VisibilityToggleButton workId={work.id} initialIsHidden={work.isHidden} />
               <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                 <Edit className="w-4 h-4 mr-2" /> Editar Dados
               </Button>
               <Button variant="destructive" size="icon" className="bg-red-950/30 text-red-500 border border-red-900/50 hover:bg-red-900/50">
                 <Trash2 className="w-4 h-4" />
               </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {work.genres.map((g) => (
              <span key={g} className="px-2 py-1 rounded text-xs font-medium bg-[#FFD700]/10 text-[#FFD700] border border-[#FFD700]/20">
                {g}
              </span>
            ))}
          </div>

          <p className="text-zinc-400 max-w-2xl line-clamp-3 leading-relaxed">
            {work.synopsis}
          </p>
        </div>
      </div>

      <Card className="bg-[#111111] border-[#27272a]">
        <CardContent className="p-6 flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 text-blue-500 rounded-full"><FileImage className="w-6 h-6" /></div>
          <div><p className="text-sm text-zinc-500">Total Capítulos</p><p className="text-2xl font-bold text-white">{work.chapters.length}</p></div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Gerenciar Capítulos</h2>
          <Link href={`/admin/works/${work.id}/chapters/new`}>
            <Button className="bg-[#FFD700] text-black hover:bg-[#FFD700]/90 font-bold">
              <Plus className="w-4 h-4 mr-2" /> Novo Capítulo
            </Button>
          </Link>
        </div>
        <div className="border border-[#27272a] rounded-lg overflow-hidden bg-[#111111]">
          {work.chapters.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-16 text-zinc-500 space-y-4">
                <FileImage className="w-12 h-12 opacity-20" />
                <p>Nenhum capítulo enviado ainda.</p>
             </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-[#1A1A1A] text-zinc-400 font-medium border-b border-[#27272a]">
                <tr>
                  <th className="px-4 py-3">#</th><th className="px-4 py-3">Título</th><th className="px-4 py-3">Preço (Lite/Premium)</th>
                  <th className="px-4 py-3">Páginas</th><th className="px-4 py-3">Data</th><th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272a]">
                {work.chapters.map((chapter) => (
                  <tr key={chapter.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-4 py-3 font-mono text-[#FFD700]">Cap. {chapter.order}</td>
                    <td className="px-4 py-3 text-white font-medium">
                      {chapter.title}
                      {chapter.isFree && <Badge variant="secondary" className="ml-2 text-[10px] h-5 bg-green-900/30 text-green-400">Grátis</Badge>}
                    </td>
                    <td className="px-4 py-3">
                       <div className="flex items-center gap-3">
                          <span className="flex items-center text-zinc-400"><Coins className="w-3 h-3 mr-1 text-zinc-600" /> {chapter.priceLite}</span>
                          <span className="flex items-center text-[#FFD700]"><Coins className="w-3 h-3 mr-1" /> {chapter.pricePremium}</span>
                       </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-500">{chapter.images.length} imgs</td>
                    <td className="px-4 py-3 text-zinc-500">{new Date(chapter.createdAt).toLocaleDateString('pt-BR')}</td>
                    <td className="px-4 py-3 text-right"><Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-400">Editar</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}