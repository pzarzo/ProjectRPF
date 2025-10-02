import { useCallback, useState } from "react";
import { Upload, FileText, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  acceptedFormats?: string[];
  maxSize?: number; // in MB
}

export default function UploadZone({
  onFileSelect,
  acceptedFormats = [".pdf", ".docx", ".doc", ".html"],
  maxSize = 50,
}: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string>("");

  const validateFile = (file: File): boolean => {
    const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();
    
    if (!acceptedFormats.includes(fileExtension)) {
      setError(`Invalid file format. Accepted: ${acceptedFormats.join(", ")}`);
      return false;
    }

    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSize) {
      setError(`File too large. Maximum size: ${maxSize}MB`);
      return false;
    }

    setError("");
    return true;
  };

  const handleFile = useCallback(
    (file: File) => {
      if (validateFile(file)) {
        setSelectedFile(file);
        onFileSelect(file);
      }
    },
    [onFileSelect, acceptedFormats, maxSize]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const clearFile = () => {
    setSelectedFile(null);
    setError("");
  };

  return (
    <div className="w-full">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "relative border-2 border-dashed rounded-lg p-12 transition-all duration-300",
          isDragging
            ? "border-primary bg-primary/5 scale-[1.02]"
            : "border-border bg-card hover:border-primary/50",
          selectedFile && "border-success bg-success/5"
        )}
      >
        <input
          type="file"
          id="file-upload"
          className="hidden"
          accept={acceptedFormats.join(",")}
          onChange={handleFileInput}
        />

        {!selectedFile ? (
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <div className={cn(
              "p-6 rounded-full transition-all duration-300",
              isDragging ? "bg-primary/10 scale-110" : "bg-muted"
            )}>
              <Upload className={cn(
                "h-12 w-12 transition-colors",
                isDragging ? "text-primary" : "text-muted-foreground"
              )} />
            </div>

            <div className="space-y-2">
              <p className="text-lg font-semibold text-foreground">
                Drop your RFP document here
              </p>
              <p className="text-sm text-muted-foreground">
                or{" "}
                <label
                  htmlFor="file-upload"
                  className="text-primary hover:text-primary/80 cursor-pointer font-medium underline underline-offset-4"
                >
                  browse files
                </label>
              </p>
            </div>

            <p className="text-xs text-muted-foreground">
              Supported formats: {acceptedFormats.join(", ")} • Max size: {maxSize}MB
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-4 rounded-lg bg-success/10">
                <FileText className="h-8 w-8 text-success" />
              </div>
              <div>
                <p className="font-semibold text-foreground">{selectedFile.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={clearFile}
              className="hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-3 text-sm text-destructive font-medium">{error}</p>
      )}
    </div>
  );
}
