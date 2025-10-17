import { Upload, Shield, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { parseFile, chunkText } from "@/lib/fileParser";
import { aiEngine } from "@/lib/aiEngine";

interface UploadFilesProps {
  onFilesUploaded: (files: File[]) => void;
  isProcessing: boolean;
  setIsProcessing: (value: boolean) => void;
}

export const UploadFiles = ({ onFilesUploaded, isProcessing, setIsProcessing }: UploadFilesProps) => {
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);
  // Upload constraints
  const MAX_FILES = 10;
  const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFiles(files);
    }
  };

  const handleFiles = async (files: File[]) => {
    const validExtensions = [".txt", ".md", ".json", ".csv", ".log", ".pdf", ".pptx", ".docx"];

    // Enforce max files
    let selected = files;
    if (files.length > MAX_FILES) {
      selected = files.slice(0, MAX_FILES);
      toast({
        title: "Too many files",
        description: `Only the first ${MAX_FILES} files will be processed.`,
      });
    }

    // Reject oversized files
    const tooLarge = selected.filter((f) => f.size > MAX_FILE_SIZE);
    if (tooLarge.length > 0) {
      toast({
        title: "File(s) too large",
        description: `${tooLarge.map((f) => f.name).join(", ")}: exceeds 20MB limit`,
        variant: "destructive",
      });
    }
    selected = selected.filter((f) => f.size <= MAX_FILE_SIZE);

    // Reject unsupported extensions
    const unsupported = selected.filter((file) => {
      const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
      return !validExtensions.includes(ext);
    });
    if (unsupported.length > 0) {
      toast({
        title: "Unsupported file type",
        description: `Only TXT, MD, JSON, CSV, LOG, PDF, PPTX, DOCX are supported. Skipped: ${unsupported
          .map((f) => f.name)
          .join(", ")}`,
        variant: "destructive",
      });
    }

    const validFiles = selected.filter((file) => {
      const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
      return validExtensions.includes(ext);
    });

    if (validFiles.length === 0) return;

    setIsProcessing(true);

    toast({
      title: "Processing files...",
      description: "Initializing AI models and processing your documents. This may take a minute.",
    });

      try {
        // Initialize AI engine
        await aiEngine.initialize();

        const succeeded: File[] = [];
        const failed: { name: string; reason?: string }[] = [];

        // Process each file individually and continue on errors
        for (const file of validFiles) {
          try {
            const parsed = await parseFile(file);
            if (!parsed.content || parsed.content.trim().length === 0) {
              throw new Error("Empty content");
            }
            const chunks = chunkText(parsed.content);
            await aiEngine.addDocument(parsed.fileName, parsed.content, chunks);
            succeeded.push(file);
          } catch (err: any) {
            console.error(`Failed to process ${file.name}:`, err);
            failed.push({ name: file.name, reason: err?.message });
          }
        }

        if (succeeded.length > 0) {
          onFilesUploaded(succeeded);
          toast({
            title: "Files processed",
            description: `${succeeded.length} file(s) indexed. You can ask questions now.`,
          });
        }

        if (failed.length > 0) {
          toast({
            title: "Some files failed",
            description: `We couldn't process: ${failed.map((f) => f.name).join(", ")}`,
            variant: "destructive",
          });
        }

        if (succeeded.length === 0) {
          throw new Error("No files processed successfully");
        }
      } catch (error) {
        console.error("Error processing files:", error);
        toast({
          title: "Processing error",
          description: "Failed to process files. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsProcessing(false);
      }
  };

  return (
    <div className="flex min-h-[calc(100vh-180px)] items-center justify-center p-6">
      <div
        className={`w-full max-w-2xl rounded-2xl border-2 border-dashed p-12 text-center transition-all ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border bg-card"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Upload className="h-8 w-8 text-primary" />
        </div>
        <h2 className="mb-3 text-2xl font-semibold text-foreground">Upload your documents</h2>
        <p className="mb-6 text-sm text-muted-foreground">
          Drag and drop files here, or click to browse. Supported:
          <br />
          <span className="font-medium">TXT, MD, JSON, CSV, LOG, PDF, PPTX, DOCX</span>
        </p>
        <input
          type="file"
          id="file-upload"
          className="hidden"
          multiple
          accept=".txt,.md,.json,.csv,.log,.pdf,.pptx,.docx"
          onChange={handleFileInput}
        />
        <Button
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-6"
          onClick={() => document.getElementById("file-upload")?.click()}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            "Choose Files"
          )}
        </Button>
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Shield className="h-4 w-4 text-primary" />
          <span>Files are stored locally on your device only</span>
        </div>
      </div>
    </div>
  );
};
