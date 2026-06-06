import { useRef, useState } from 'react'
import { Upload, X, ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

const MAX_FILES = 5
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

interface ImageUploadProps {
  value: File[]
  onChange: (files: File[]) => void
}

export function ImageUpload({ value, onChange }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  function addFiles(newFiles: FileList | null) {
    if (!newFiles) return
    const valid = Array.from(newFiles)
      .filter((f) => ACCEPTED_TYPES.includes(f.type))
      .slice(0, MAX_FILES - value.length)
    if (valid.length) onChange([...value, ...valid])
  }

  function removeFile(index: number) {
    onChange(value.filter((_, i) => i !== index))
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    addFiles(e.dataTransfer.files)
  }

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-8 transition-colors',
          isDragging
            ? 'border-brand-secondary bg-brand-secondary/5'
            : 'border-border bg-muted/30 hover:border-brand-secondary/50 hover:bg-muted/50',
          value.length >= MAX_FILES && 'cursor-not-allowed opacity-50'
        )}
      >
        <Upload className="mb-2 h-6 w-6 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground">
          {value.length >= MAX_FILES ? 'Limite atingido' : 'Clique ou arraste para adicionar'}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          PNG, JPG ou WEBP · máx. {MAX_FILES} fotos · {value.length}/{MAX_FILES} selecionadas
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(',')}
          multiple
          className="hidden"
          disabled={value.length >= MAX_FILES}
          onChange={(e) => addFiles(e.target.files)}
        />
      </div>

      {/* Previews */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((file, i) => (
            <div key={i} className="group relative h-16 w-16 overflow-hidden rounded-lg border bg-muted">
              <img
                src={URL.createObjectURL(file)}
                alt={`foto ${i + 1}`}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/40">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removeFile(i) }}
                  className="rounded-full bg-white p-0.5 opacity-0 shadow transition-opacity group-hover:opacity-100"
                >
                  <X className="h-3 w-3 text-foreground" />
                </button>
              </div>
            </div>
          ))}
          {Array.from({ length: MAX_FILES - value.length }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed bg-muted/30"
            >
              <ImageIcon className="h-5 w-5 text-muted-foreground/40" />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
