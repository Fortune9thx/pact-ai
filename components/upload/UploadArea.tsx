"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { cn } from "@/lib/utils";
import { Upload, File, X, CheckCircle2, ImageIcon, FileText } from "lucide-react";

interface UploadAreaProps {
  onFileSelect?: (file: File) => void;
  onUrlChange?: (url: string) => void;
  submissionUrl?: string;
  accept?: string;
  className?: string;
}

function FileIcon({ type }: { type: string }) {
  if (type.startsWith("image/")) return <ImageIcon className="size-4" />;
  return <FileText className="size-4" />;
}

export function UploadArea({ onFileSelect, onUrlChange, submissionUrl, accept, className }: UploadAreaProps) {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<"upload" | "url">("url");
  const [urlValue, setUrlValue] = useState(submissionUrl ?? "");

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const f = acceptedFiles[0];
      if (!f) return;
      setFile(f);
      onFileSelect?.(f);
      // In production, upload to IPFS/Arweave and get URL
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: accept ? { [accept]: [] } : undefined,
  });

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Mode selector */}
      <div className="flex gap-1 p-1 rounded-lg bg-[var(--color-surface-raised)] w-fit">
        {(["url", "upload"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
              mode === m
                ? "bg-[var(--color-surface-overlay)] text-[var(--color-foreground)] shadow-sm"
                : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
            )}
          >
            {m === "url" ? "Submit URL" : "Upload File"}
          </button>
        ))}
      </div>

      {mode === "url" ? (
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-[var(--color-muted-foreground)] uppercase tracking-wide">
            Submission URL
          </label>
          <input
            type="url"
            value={urlValue}
            onChange={(e) => {
              setUrlValue(e.target.value);
              onUrlChange?.(e.target.value);
            }}
            placeholder="https://your-work.com/portfolio/project"
            className={cn(
              "h-9 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-input)] px-3 text-sm text-[var(--color-foreground)]",
              "placeholder:text-[var(--color-muted-foreground)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]/50 focus:border-[var(--color-ring)] transition-colors"
            )}
          />
          <p className="text-xs text-[var(--color-muted-foreground)]">
            Link to Behance, Dribbble, personal site, Notion, Google Drive, or any public URL.
          </p>
        </div>
      ) : (
        <>
          {!file ? (
            <div
              {...getRootProps()}
              className={cn(
                "flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 cursor-pointer transition-all",
                isDragActive
                  ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
                  : "border-[var(--color-border)] hover:border-[var(--color-primary)]/40 hover:bg-[var(--color-surface-raised)]"
              )}
            >
              <input {...getInputProps()} />
              <div className={cn(
                "flex size-10 items-center justify-center rounded-xl transition-colors",
                isDragActive ? "bg-[var(--color-primary)]/15" : "bg-[var(--color-surface-overlay)]"
              )}>
                <Upload className={cn("size-5", isDragActive ? "text-[var(--color-primary)]" : "text-[var(--color-muted-foreground)]")} />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-[var(--color-foreground)]">
                  {isDragActive ? "Drop file here" : "Drag & drop your work"}
                </p>
                <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">
                  or click to browse · PNG, JPG, PDF, ZIP up to 50MB
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-3.5 rounded-xl border border-[var(--color-verdict-pass)]/30 bg-[var(--color-verdict-pass)]/5">
              <div className="flex size-9 items-center justify-center rounded-lg bg-[var(--color-surface-overlay)] text-[var(--color-muted-foreground)]">
                <FileIcon type={file.type} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--color-foreground)] truncate">{file.name}</p>
                <p className="text-xs text-[var(--color-muted-foreground)]">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <CheckCircle2 className="size-4 text-[var(--color-verdict-pass)] shrink-0" />
              <button
                type="button"
                onClick={() => setFile(null)}
                className="text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
