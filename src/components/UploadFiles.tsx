import { Upload, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface UploadFilesProps {
  onFilesUploaded: (files: File[]) => void;
}

export const UploadFiles = ({ onFilesUploaded }: UploadFilesProps) => {
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);

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

  const handleFiles = (files: File[]) => {
    const validExtensions = [".txt", ".md", ".json", ".csv", ".log", ".pdf", ".pptx", ".docx"];
    const validFiles = files.filter((file) => {
      const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
      return validExtensions.includes(ext);
    });

    if (validFiles.length !== files.length) {
      toast({
        title: "Some files were rejected",
        description: "Only TXT, MD, JSON, CSV, LOG, PDF, PPTX, DOCX files are supported.",
        variant: "destructive",
      });
    }

    if (validFiles.length > 0) {
      onFilesUploaded(validFiles);
      toast({
        title: "Files uploaded successfully",
        description: `${validFiles.length} file(s) processed locally.`,
      });
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
        >
          Choose Files
        </Button>
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Shield className="h-4 w-4 text-primary" />
          <span>Files are stored locally on your device only</span>
        </div>
      </div>
    </div>
  );
};
