'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ProgressTracker } from './ProgressTracker'

type UploadState = 'idle' | 'uploading' | 'generating' | 'error'

export function UploadForm() {
  const router = useRouter()
  const [state, setState] = useState<UploadState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [storyId, setStoryId] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [branchCount, setBranchCount] = useState(3)
  const [protagonistName, setProtagonistName] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback((file: File) => {
    if (!file.name.match(/\.(pdf|txt)$/i)) {
      setError('Only PDF and TXT files are supported.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File too large. Maximum size is 10MB.')
      return
    }
    setError(null)
    setSelectedFile(file)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  const handleSubmit = async () => {
    if (!selectedFile) return
    setState('uploading')
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('branchesPerChapter', String(branchCount))
      if (protagonistName.trim()) {
        formData.append('protagonistName', protagonistName.trim())
      }

      const res = await fetch('/api/generate', { method: 'POST', body: formData })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error ?? 'Upload failed')
      }

      setStoryId(data.storyId)
      setState('generating')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
      setState('error')
    }
  }

  const handleComplete = useCallback(() => {
    if (storyId) {
      router.push(`/stories/${storyId}`)
    }
  }, [storyId, router])

  const handleGenError = useCallback((msg: string) => {
    setError(msg)
    setState('error')
  }, [])

  if (state === 'generating' && storyId) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-slate-400 text-center">
          Generating your interactive story — this takes a few minutes...
        </p>
        <ProgressTracker
          storyId={storyId}
          onComplete={handleComplete}
          onError={handleGenError}
        />
        {error && (
          <div className="space-y-3">
            <p className="text-sm text-red-400">{error}</p>
            <Button
              variant="outline"
              onClick={() => {
                setState('idle')
                setError(null)
                setStoryId(null)
              }}
            >
              Try again
            </Button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* File dropzone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => fileInputRef.current?.click()}
        className={`relative cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition-all ${
          dragOver
            ? 'border-amber-500 bg-amber-500/10'
            : selectedFile
            ? 'border-amber-500/50 bg-amber-500/5'
            : 'border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/8'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
        {selectedFile ? (
          <div className="space-y-1">
            <div className="text-2xl">📖</div>
            <p className="font-medium text-slate-200">{selectedFile.name}</p>
            <p className="text-sm text-slate-500">
              {(selectedFile.size / 1024).toFixed(0)} KB · Click to change
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-3xl">📂</div>
            <p className="font-medium text-slate-300">
              Drop your story file here
            </p>
            <p className="text-sm text-slate-500">PDF or TXT · up to 10MB</p>
          </div>
        )}
      </div>

      {/* Config */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="branches" className="text-slate-300">
            Branches per chapter
          </Label>
          <Input
            id="branches"
            type="number"
            min={1}
            max={5}
            value={branchCount}
            onChange={(e) => setBranchCount(parseInt(e.target.value) || 3)}
            className="bg-white/5 border-white/20 text-slate-200"
          />
          <p className="text-xs text-slate-500">1–5 choices per chapter</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="protagonist" className="text-slate-300">
            Protagonist name
          </Label>
          <Input
            id="protagonist"
            type="text"
            placeholder="Auto-detect"
            value={protagonistName}
            onChange={(e) => setProtagonistName(e.target.value)}
            className="bg-white/5 border-white/20 text-slate-200 placeholder:text-slate-600"
          />
          <p className="text-xs text-slate-500">Optional override</p>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-400 bg-red-400/10 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <Button
        onClick={handleSubmit}
        disabled={!selectedFile || state === 'uploading'}
        className="w-full bg-amber-600 hover:bg-amber-500 text-white font-medium"
      >
        {state === 'uploading' ? 'Uploading...' : 'Generate Branching Story'}
      </Button>
    </div>
  )
}
