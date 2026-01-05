'use server';

// Import corrigido (sem .ts)
import { r2, R2_BUCKET, R2_PUBLIC_URL } from '@/lib/r2';
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import JSZip from 'jszip';
import { redirect } from 'next/navigation';

// Schema de Validação
const CreateChapterSchema = z.object({
  workId: z.string(),
  title: z.string().min(1, "Título obrigatório"),
  number: z.coerce.number().min(0, "Número inválido"),
  priceLite: z.coerce.number().min(0).default(10),
  pricePremium: z.coerce.number().min(0).default(3),
  isFree: z.string().optional(),
});

export async function createChapter(prevState: any, formData: FormData) {
  const file = formData.get('file') as File;
  
  // 1. Validação do Arquivo
  if (!file || file.size === 0) {
    return { message: 'Por favor, envie um arquivo .zip válido.' };
  }
  // Algums sistemas enviam zip como 'application/x-zip-compressed'
  if (!file.name.endsWith('.zip')) {
    return { message: 'O arquivo deve ser um .zip contendo imagens.' };
  }

  const validatedFields = CreateChapterSchema.safeParse({
    workId: formData.get('workId'),
    title: formData.get('title'),
    number: formData.get('number'),
    priceLite: formData.get('priceLite'),
    pricePremium: formData.get('pricePremium'),
    isFree: formData.get('isFree'),
  });

  if (!validatedFields.success) {
    return { message: 'Erro nos dados do formulário.' };
  }

  const { workId, title, number, priceLite, pricePremium, isFree } = validatedFields.data;

  try {
    // 2. Processar ZIP em Memória
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);
    
    const imageFiles: { name: string; data: Uint8Array }[] = [];

    // Extração
    const zipEntries = Object.keys(zip.files);
    for (const filename of zipEntries) {
      const fileEntry = zip.files[filename];
      if (!fileEntry.dir && filename.match(/\.(jpg|jpeg|png|webp)$/i)) {
        const content = await fileEntry.async('uint8array');
        imageFiles.push({
          name: filename,
          data: content
        });
      }
    }

    if (imageFiles.length === 0) {
      return { message: 'O ZIP não contém imagens válidas (jpg, png, webp).' };
    }

    // Ordenação Numérica (1, 2, 10...)
    imageFiles.sort((a, b) => 
      a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
    );

    // 3. Upload Paralelo para o Cloudflare R2
    const uploadPromises = imageFiles.map(async (img) => {
      const extension = img.name.split('.').pop();
      // Caminho: works/{id}/ch-{num}/{uuid}.jpg
      const key = `works/${workId}/ch-${number}/${crypto.randomUUID()}.${extension}`;
      
      await r2.send(new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
        Body: img.data,
        ContentType: `image/${extension === 'jpg' ? 'jpeg' : extension}`,
        // ACL: 'public-read' // Cloudflare R2 geralmente gerencia isso pelo Bucket Policy
      }));

      return `${R2_PUBLIC_URL}/${key}`;
    });

    const imageUrls = await Promise.all(uploadPromises);

    // 4. Salvar no Banco
    await prisma.chapter.create({
      data: {
        workId,
        title,
        slug: `cap-${number}`,
        order: number,
        priceLite,
        pricePremium,
        isFree: isFree === 'on',
        images: imageUrls,
      }
    });

  } catch (error) {
    console.error('Erro no upload:', error);
    return { message: 'Falha crítica no upload. Verifique os logs do servidor.' };
  }

  revalidatePath(`/admin/works/${workId}`);
  redirect(`/admin/works/${workId}`);
}