"use server";

import { r2, R2_BUCKET, R2_PUBLIC_URL } from '@/lib/r2';
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import JSZip from 'jszip';
import { redirect } from 'next/navigation';

const CreateChapterSchema = z.object({
  workId: z.string(),
  title: z.string().min(1, "Título obrigatório"),
  number: z.coerce.number().min(0, "Número inválido"),
  priceLite: z.coerce.number().min(0).default(10),
  pricePremium: z.coerce.number().min(0).default(3),
  isFree: z.string().optional(),
  file: z.instanceof(File).refine(file => file.size > 0, { message: "O arquivo ZIP é obrigatório." }),
});

export async function createChapter(prevState: any, formData: FormData) {
  
  // CORREÇÃO: Usamos Object.fromEntries para limpar os nomes dos campos
  const data = Object.fromEntries(formData);

  const validatedFields = CreateChapterSchema.safeParse({
    workId: data.workId,
    title: data.title,
    number: data.number,
    priceLite: data.priceLite,
    pricePremium: data.pricePremium,
    isFree: data.isFree,
    file: data.file
  });

  if (!validatedFields.success) {
    console.error(validatedFields.error.flatten());
    return { message: 'Erro nos dados do formulario. Verifique todos os campos.' };
  }

  const { workId, title, number, priceLite, pricePremium, isFree, file } = validatedFields.data;

  if (!file.name.endsWith('.zip')) {
    return { message: 'O arquivo deve ser um .zip.' };
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);
    
    const imageFiles: { name: string; data: Uint8Array }[] = [];
    const zipEntries = Object.keys(zip.files);
    for (const filename of zipEntries) {
      const fileEntry = zip.files[filename];
      if (!fileEntry.dir && filename.match(/\.(jpg|jpeg|png|webp)$/i)) {
        const content = await fileEntry.async('uint8array');
        imageFiles.push({ name: filename, data: content });
      }
    }
    if (imageFiles.length === 0) {
      return { message: 'O ZIP nao contem imagens validas.' };
    }

    imageFiles.sort((a, b) => 
      a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
    );

    const uploadPromises = imageFiles.map(async (img) => {
      const extension = img.name.split('.').pop();
      const key = `works/${workId}/ch-${number}/${crypto.randomUUID()}.${extension}`;
      
      await r2.send(new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
        Body: img.data,
        ContentType: `image/${extension === 'jpg' ? 'jpeg' : extension}`,
      }));

      return `${R2_PUBLIC_URL}/${key}`;
    });

    const imageUrls = await Promise.all(uploadPromises);

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
    return { message: 'Falha critica no upload. Verifique os logs do servidor.' };
  }

  revalidatePath(`/admin/works/${workId}`);
  redirect(`/admin/works/${workId}`);
}