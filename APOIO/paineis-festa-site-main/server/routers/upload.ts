import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { storagePut } from "../storage";
import { nanoid } from "nanoid";

export const uploadRouter = router({
  // Upload de imagem para pedido personalizado
  customOrderImage: protectedProcedure
    .input(z.object({
      file: z.string(), // Base64 encoded file
      fileName: z.string(),
      mimeType: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Validar tipo de arquivo
        const allowedMimes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
        if (!allowedMimes.includes(input.mimeType)) {
          throw new Error("Tipo de arquivo não permitido. Use JPEG, PNG, WebP ou GIF.");
        }

        // Converter base64 para buffer
        const buffer = Buffer.from(input.file, "base64");

        // Validar tamanho (máx 5MB)
        const maxSize = 5 * 1024 * 1024;
        if (buffer.length > maxSize) {
          throw new Error("Arquivo muito grande. Máximo 5MB.");
        }

        // Gerar nome único para o arquivo
        const fileExtension = input.fileName.split(".").pop() || "jpg";
        const uniqueFileName = `custom-orders/${ctx.user.id}/${nanoid()}.${fileExtension}`;

        // Upload para S3
        const { url } = await storagePut(
          uniqueFileName,
          buffer,
          input.mimeType
        );

        return {
          success: true,
          url,
          fileName: uniqueFileName,
        };
      } catch (error) {
        console.error("[Upload] Error uploading image:", error);
        throw error;
      }
    }),

  // Upload de múltiplas imagens
  multipleImages: protectedProcedure
    .input(z.object({
      files: z.array(z.object({
        file: z.string(),
        fileName: z.string(),
        mimeType: z.string(),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const uploadedFiles = [];
        const allowedMimes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
        const maxSize = 5 * 1024 * 1024;

        for (const fileData of input.files) {
          // Validar tipo
          if (!allowedMimes.includes(fileData.mimeType)) {
            throw new Error(`Tipo de arquivo não permitido: ${fileData.fileName}`);
          }

          // Converter e validar tamanho
          const buffer = Buffer.from(fileData.file, "base64");
          if (buffer.length > maxSize) {
            throw new Error(`Arquivo muito grande: ${fileData.fileName}`);
          }

          // Upload
          const fileExtension = fileData.fileName.split(".").pop() || "jpg";
          const uniqueFileName = `custom-orders/${ctx.user.id}/${nanoid()}.${fileExtension}`;
          const { url } = await storagePut(
            uniqueFileName,
            buffer,
            fileData.mimeType
          );

          uploadedFiles.push({
            url,
            fileName: uniqueFileName,
            originalName: fileData.fileName,
          });
        }

        return {
          success: true,
          files: uploadedFiles,
        };
      } catch (error) {
        console.error("[Upload] Error uploading multiple images:", error);
        throw error;
      }
    }),
});
