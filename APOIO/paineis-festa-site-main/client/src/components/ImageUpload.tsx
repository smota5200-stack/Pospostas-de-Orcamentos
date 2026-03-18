import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface ImageUploadProps {
  onImageUpload: (url: string) => void;
  maxSize?: number; // em MB
  multiple?: boolean;
}

export default function ImageUpload({
  onImageUpload,
  maxSize = 5,
  multiple = false,
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<Array<{ url: string; name: string }>>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = trpc.upload.customOrderImage.useMutation({
    onSuccess: (data) => {
      const newImage = { url: data.url, name: data.fileName };
      setUploadedImages([...uploadedImages, newImage]);
      onImageUpload(data.url);
      toast.success("Imagem enviada com sucesso!");
      setIsUploading(false);
    },
    onError: (error) => {
      toast.error("Erro ao enviar imagem: " + error.message);
      setIsUploading(false);
    },
  });

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];

    // Validar tipo
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Tipo de arquivo não permitido. Use JPEG, PNG, WebP ou GIF.");
      return;
    }

    // Validar tamanho
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSize) {
      toast.error(`Arquivo muito grande. Máximo ${maxSize}MB.`);
      return;
    }

    // Converter para base64
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = (e.target?.result as string)?.split(",")[1];
      if (base64) {
        setIsUploading(true);
        uploadMutation.mutate({
          file: base64,
          fileName: file.name,
          mimeType: file.type,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const removeImage = (index: number) => {
    setUploadedImages(uploadedImages.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {/* Área de Upload */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging
            ? "border-purple-500 bg-purple-50"
            : "border-gray-300 bg-gray-50 hover:border-purple-400"
        }`}
      >
        <Upload className="w-12 h-12 mx-auto text-gray-400 mb-3" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Arraste a imagem aqui ou clique para selecionar
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Formatos aceitos: JPEG, PNG, WebP, GIF (máx. {maxSize}MB)
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="border-purple-300 text-purple-600 hover:bg-purple-50"
        >
          Selecionar Arquivo
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
          disabled={isUploading}
        />
      </div>

      {/* Status de Upload */}
      {isUploading && (
        <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="animate-spin">
            <Upload className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-sm text-blue-800">Enviando imagem...</p>
        </div>
      )}

      {/* Imagens Carregadas */}
      {uploadedImages.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-900">Imagens Carregadas</h4>
          {uploadedImages.map((image, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg"
            >
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {image.name}
                </p>
                <a
                  href={image.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-green-600 hover:text-green-700 truncate block"
                >
                  Ver imagem
                </a>
              </div>
              <button
                onClick={() => removeImage(index)}
                className="text-red-500 hover:text-red-700 flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Aviso */}
      {uploadedImages.length === 0 && !isUploading && (
        <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            Envie uma imagem de referência para ajudar a descrever seu painel personalizado.
          </p>
        </div>
      )}
    </div>
  );
}
