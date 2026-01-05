import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { WorkImage } from "@/components/admin/work-image"; // <--- Importe o novo componente
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Eye, EyeOff } from "lucide-react";

export default async function WorksPage() {
  const works = await prisma.work.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      _count: {
        select: { chapters: true },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Obras</h1>
          <p className="text-zinc-400">Gerencie seu catálogo de Mangás e Webtoons.</p>
        </div>
        <Link href="/admin/works/new">
          <Button className="bg-[#FFD700] text-black hover:bg-[#FFD700]/90 font-bold">
            <Plus className="w-4 h-4 mr-2" />
            Nova Obra
          </Button>
        </Link>
      </div>

      <div className="border border-[#27272a] rounded-lg overflow-hidden bg-[#111111]">
        <Table>
          <TableHeader className="bg-[#1A1A1A]">
            <TableRow className="border-[#27272a] hover:bg-[#1A1A1A]">
              <TableHead className="text-zinc-400">Capa</TableHead>
              <TableHead className="text-zinc-400">Título / Slug</TableHead>
              <TableHead className="text-zinc-400">Status</TableHead>
              <TableHead className="text-zinc-400">Capítulos</TableHead>
              <TableHead className="text-zinc-400">Criador / Estúdio</TableHead>
              <TableHead className="text-zinc-400 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {works.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-zinc-500">
                  Nenhuma obra encontrada. Crie a primeira!
                </TableCell>
              </TableRow>
            ) : (
              works.map((work) => (
                <TableRow key={work.id} className="border-[#27272a] hover:bg-[#1A1A1A]/50 group">
                  <TableCell>
                    <div className="w-12 h-16 rounded overflow-hidden relative">
                       {/* Componente Cliente Seguro */}
                       <WorkImage 
                          src={work.coverUrl} 
                          alt={work.title} 
                          className="w-12 h-16"
                       />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-white">{work.title}</span>
                      <span className="text-xs text-zinc-500 font-mono">/{work.slug}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {work.isHidden ? (
                      <Badge variant="secondary" className="bg-zinc-800 text-zinc-400 hover:bg-zinc-800">
                        <EyeOff className="w-3 h-3 mr-1" /> Oculto
                      </Badge>
                    ) : (
                      <Badge className="bg-green-900/20 text-green-400 border-green-900 hover:bg-green-900/30">
                        <Eye className="w-3 h-3 mr-1" /> Publicado
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-[#FFD700]">{work._count.chapters}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col text-sm">
                      <span className="text-white">{work.author}</span>
                      <span className="text-zinc-500 text-xs">{work.studio || '-'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/admin/works/${work.id}`}>
                      <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-[#FFD700]">
                       Gerenciar
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}