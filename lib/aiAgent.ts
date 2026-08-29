'use client'

/**
 * AI Agent Client Utility
 *
 * Client-side wrapper for calling the AI Agent API route.
 * API keys are kept secure on the server.
 *
 * @example
 * ```tsx
 * import { callAIAgent } from '@/lib/aiAgent'
 *
 * const result = await callAIAgent('Hello!', 'agent-id')
 * if (result.success) {
 *   console.log(result.response.result)
 * }
 * ```
 */

import { useState } from 'react'
import fetchWrapper from '@/lib/fetchWrapper'

// Types
export interface NormalizedAgentResponse {
  status: 'success' | 'error'
  result: Record<string, any>
  message?: string
  metadata?: {
    agent_name?: string
    timestamp?: string
    [key: string]: any
  }
}

export interface ArtifactFile {
  file_url: string
  name: string
  format_type: string
}

export interface ModuleOutputs {
  artifact_files?: ArtifactFile[]
  [key: string]: any
}

export interface AIAgentResponse {
  success: boolean
  response: NormalizedAgentResponse
  module_outputs?: ModuleOutputs
  agent_id?: string
  user_id?: string
  session_id?: string
  timestamp?: string
  raw_response?: string
  error?: string
  details?: string
}

export interface UploadedFile {
  asset_id: string
  file_name: string
  success: boolean
  error?: string
}

export interface UploadResponse {
  success: boolean
  asset_ids: string[]
  files: UploadedFile[]
  total_files: number
  successful_uploads: number
  failed_uploads: number
  message: string
  timestamp: string
  error?: string
}

const POLL_TIMEOUT_MS = 8 * 60 * 1000 // 8 minutes (videos need longer with 5 sub-agents)

/**
 * Call the AI Agent via server-side API route.
 * Submits an async task then polls from the client until completion.
 */
export async function callAIAgent(
  message: string,
  agent_id: string,
  options?: { user_id?: string; session_id?: string; assets?: string[]; abortSignal?: AbortSignal }
): Promise<AIAgentResponse> {
  try {
    // 1. Submit task — returns { task_id, agent_id, user_id, session_id }
    const submitRes = await fetchWrapper('/api/agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        agent_id,
        user_id: options?.user_id,
        session_id: options?.session_id,
        assets: options?.assets,
      }),
    })

    if (!submitRes) {
      return {
        success: false,
        response: { status: 'error', result: {}, message: 'No response from server' },
        error: 'No response from server',
      }
    }

    const submitData = await submitRes.json()

    // If submit itself failed or no task_id returned, return as-is
    if (!submitData.task_id) {
      return submitData.success === false
        ? submitData
        : {
            success: false,
            response: { status: 'error', result: {}, message: 'No task_id in response' },
            error: 'No task_id in response',
          }
    }

    const { task_id, user_id, session_id } = submitData

    // 2. Poll POST /api/agent with { task_id } — adaptive backoff from CSR
    const startTime = Date.now()
    let attempt = 0

    while (Date.now() - startTime < POLL_TIMEOUT_MS) {
      // Check if cancelled before polling
      if (options?.abortSignal?.aborted) {
        return {
          success: false,
          response: { status: 'error', result: {}, message: 'Analysis cancelled by user' },
          error: 'Analysis cancelled by user',
        }
      }

      const delay = Math.min(300 * Math.pow(1.5, attempt), 3000)
      await new Promise(r => setTimeout(r, delay))
      attempt++

      const pollRes = await fetchWrapper('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_id }),
      })
      if (!pollRes) {
        continue // fetchWrapper returned undefined (redirect/error) — retry next poll
      }
      const pollData = await pollRes.json()

      if (pollData.status === 'processing') {
        continue
      }

      // Completed or failed — attach agent_id/user_id/session_id and return
      return {
        ...pollData,
        agent_id,
        user_id,
        session_id,
      }
    }

    // Timed out
    return {
      success: false,
      response: {
        status: 'error',
        result: {},
        message: 'Agent task timed out after 8 minutes',
      },
      error: 'Agent task timed out after 8 minutes',
    }
  } catch (error) {
    return {
      success: false,
      response: {
        status: 'error',
        result: {},
        message: error instanceof Error ? error.message : 'Network error',
      },
      error: error instanceof Error ? error.message : 'Network error',
    }
  }
}

/**
 * Upload files with XHR progress tracking and abort support.
 */
export function uploadFilesWithProgress(
  files: File | File[],
  onProgress?: (percent: number) => void,
  abortSignal?: { current: XMLHttpRequest | null }
): Promise<UploadResponse> {
  const fileArray = Array.isArray(files) ? files : [files]

  if (fileArray.length === 0) {
    return Promise.resolve({
      success: false,
      asset_ids: [],
      files: [],
      total_files: 0,
      successful_uploads: 0,
      failed_uploads: 0,
      message: 'No files provided',
      timestamp: new Date().toISOString(),
      error: 'No files provided',
    })
  }

  return new Promise((resolve) => {
    const formData = new FormData()
    for (const file of fileArray) {
      formData.append('files', file, file.name)
    }

    const xhr = new XMLHttpRequest()
    if (abortSignal) abortSignal.current = xhr

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        const percent = Math.round((e.loaded / e.total) * 100)
        onProgress(percent)
      }
    })

    xhr.addEventListener('load', () => {
      try {
        const data = JSON.parse(xhr.responseText)
        resolve(data)
      } catch {
        resolve({
          success: false,
          asset_ids: [],
          files: [],
          total_files: fileArray.length,
          successful_uploads: 0,
          failed_uploads: fileArray.length,
          message: 'Failed to parse upload response',
          timestamp: new Date().toISOString(),
          error: 'Invalid server response',
        })
      }
    })

    xhr.addEventListener('error', () => {
      resolve({
        success: false,
        asset_ids: [],
        files: [],
        total_files: fileArray.length,
        successful_uploads: 0,
        failed_uploads: fileArray.length,
        message: 'Upload failed',
        timestamp: new Date().toISOString(),
        error: 'Network error during upload',
      })
    })

    xhr.addEventListener('abort', () => {
      resolve({
        success: false,
        asset_ids: [],
        files: [],
        total_files: fileArray.length,
        successful_uploads: 0,
        failed_uploads: fileArray.length,
        message: 'Upload cancelled',
        timestamp: new Date().toISOString(),
        error: 'Upload was cancelled by user',
      })
    })

    xhr.timeout = 300000 // 5 minutes for large video uploads
    xhr.addEventListener('timeout', () => {
      resolve({
        success: false,
        asset_ids: [],
        files: [],
        total_files: fileArray.length,
        successful_uploads: 0,
        failed_uploads: fileArray.length,
        message: 'Upload timed out. The file may be too large. Try a shorter or lower-resolution video.',
        timestamp: new Date().toISOString(),
        error: 'Upload timed out',
      })
    })

    xhr.open('POST', '/api/upload')
    xhr.send(formData)
  })
}

/**
 * Upload files via server-side API route.
 * Retries up to MAX_RETRIES times on failure for reliability.
 */
const UPLOAD_MAX_RETRIES = 2

export async function uploadFiles(files: File | File[]): Promise<UploadResponse> {
  const fileArray = Array.isArray(files) ? files : [files]

  if (fileArray.length === 0) {
    return {
      success: false,
      asset_ids: [],
      files: [],
      total_files: 0,
      successful_uploads: 0,
      failed_uploads: 0,
      message: 'No files provided',
      timestamp: new Date().toISOString(),
      error: 'No files provided',
    }
  }

  let lastError = ''

  for (let attempt = 0; attempt <= UPLOAD_MAX_RETRIES; attempt++) {
    try {
      const formData = new FormData()
      for (const file of fileArray) {
        formData.append('files', file, file.name)
      }

      const response = await fetchWrapper('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response) {
        lastError = 'No response from server'
        if (attempt < UPLOAD_MAX_RETRIES) {
          await new Promise(r => setTimeout(r, 1000 * (attempt + 1)))
          continue
        }
        break
      }

      const data = await response.json()

      if (data.success && Array.isArray(data.asset_ids) && data.asset_ids.length > 0) {
        return data
      }

      lastError = data.error || data.message || 'Upload returned no asset IDs'
      if (attempt < UPLOAD_MAX_RETRIES) {
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)))
        continue
      }
      return data
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error)
      if (attempt < UPLOAD_MAX_RETRIES) {
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)))
        continue
      }
    }
  }

  return {
    success: false,
    asset_ids: [],
    files: [],
    total_files: fileArray.length,
    successful_uploads: 0,
    failed_uploads: fileArray.length,
    message: 'Upload failed after multiple attempts',
    timestamp: new Date().toISOString(),
    error: lastError,
  }
}

/**
 * React hook for using AI Agent in components
 */
export function useAIAgent() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [response, setResponse] = useState<NormalizedAgentResponse | null>(null)

  const callAgent = async (
    message: string,
    agent_id: string,
    options?: { user_id?: string; session_id?: string; assets?: string[] }
  ) => {
    setLoading(true)
    setError(null)
    setResponse(null)

    const result = await callAIAgent(message, agent_id, options)

    if (result.success) {
      setResponse(result.response)
    } else {
      setError(result.error || 'Unknown error')
      setResponse(result.response)
    }

    setLoading(false)
    return result
  }

  return {
    callAgent,
    loading,
    error,
    response,
  }
}

/**
 * React hook for file uploads
 */
export function useFileUpload() {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<UploadResponse | null>(null)

  const upload = async (files: File | File[]) => {
    setUploading(true)
    setError(null)
    setResult(null)

    const uploadResult = await uploadFiles(files)

    if (uploadResult.success) {
      setResult(uploadResult)
    } else {
      setError(uploadResult.error || 'Upload failed')
      setResult(uploadResult)
    }

    setUploading(false)
    return uploadResult
  }

  return {
    upload,
    uploading,
    error,
    result,
  }
}

/**
 * Extract text from agent response
 */
export function extractText(response: NormalizedAgentResponse): string {
  if (response.message) return response.message
  if (response.result?.text) return response.result.text
  if (response.result?.message) return response.result.message
  if (response.result?.response) return response.result.response
  if (response.result?.answer) return response.result.answer
  if (response.result?.answer_text) return response.result.answer_text
  if (response.result?.summary) return response.result.summary
  if (response.result?.content) return response.result.content
  if (typeof response.result === 'string') return response.result
  return ''
}
