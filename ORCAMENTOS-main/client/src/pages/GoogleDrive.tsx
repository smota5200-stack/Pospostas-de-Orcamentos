import { useQuery } from "@tanstack/react-query";
import { 
  FileIcon, 
  ExternalLink, 
  Download, 
  Search, 
  Loader2,
  HardDrive
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string;
  iconLink: string;
  size?: string;
  createdTime: string;
}

export default function GoogleDrive() {
  const [search, setSearch] = useState("");

  const { data: files = [], isLoading, error } = useQuery<DriveFile[]>({
    queryKey: ["/api/drive/files"],
    queryFn: () => fetch("/api/drive/files").then(r => {
      if (!r.ok) throw new Error("Erro ao carregar arquivos do Drive");
      return r.json();
    }),
  });

  const filteredFiles = files.filter(file => 
    file.name.toLowerCase().includes(search.toLowerCase())
  );

  const formatSize = (bytes?: string) => {
    if (!bytes) return "—";
    const b = parseInt(bytes);
    if (b < 1024) return `${b} B`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Google Drive</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie seus orçamentos salvos na nuvem.
          </p>
        </div>
        <div className="bg-primary/5 p-3 rounded-full">
          <HardDrive className="w-8 h-8 text-primary" />
        </div>
      </div>

      <Card className="mb-8">
        <CardHeader className="pb-3 text-center">
            <CardTitle>Meus Arquivos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar arquivos..." 
              className="pl-10 h-11"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-muted-foreground animate-pulse">Carregando seus arquivos...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12 bg-destructive/5 rounded-lg border border-destructive/20 mt-4">
              <p className="text-destructive font-medium">Ocorreu um erro ao carregar os arquivos.</p>
              <p className="text-sm text-destructive/70 mt-1">
                Verifique se o Google Drive está configurado corretamente no servidor.
              </p>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="text-center py-16 bg-muted/30 rounded-lg border-2 border-dashed">
              <HardDrive className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground font-medium">Nenhum arquivo encontrado.</p>
              {search && (
                <Button variant="link" onClick={() => setSearch("")} className="mt-2">
                  Limpar busca
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Nome do Arquivo</TableHead>
                    <TableHead>Tamanho</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFiles.map((file) => (
                    <TableRow key={file.id} className="hover:bg-primary/5 transition-colors group">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 flex items-center justify-center rounded bg-slate-100 group-hover:bg-white transition-colors">
                            {file.mimeType === "application/pdf" ? (
                              <FileIcon className="w-4 h-4 text-red-500" />
                            ) : (
                              <img src={file.iconLink} alt="" className="w-4 h-4" />
                            )}
                          </div>
                          <span className="truncate max-w-[300px]">{file.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatSize(file.size)}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(file.createdTime), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            asChild
                            title="Abrir no Drive"
                          >
                            <a href={file.webViewLink} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-4 h-4 text-primary" />
                            </a>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => window.open(file.webViewLink, '_blank')}
                            title="Baixar"
                          >
                            <Download className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
