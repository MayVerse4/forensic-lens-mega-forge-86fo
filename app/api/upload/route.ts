import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 300 // 5 minutes for large video uploads
export const dynamic = 'force-dynamic'

const LYZR_UPLOAD_URL = `${process.env.LYZR_AGENT_BASE_URL || 'https://agent-prod.studio.lyzr.ai'}/v3/assets/upload`
const LYZR_API_KEY = process.env.LYZR_API_KEY || ''

export async function POST(request: NextRequest) {
  try {
    if (!LYZR_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          asset_ids: [],
          files: [],
          total_files: 0,
          successful_uploads: 0,
          failed_uploads: 0,
          message: 'LYZR_API_KEY not configured',
          timestamp: new Date().toISOString(),
          error: 'LYZR_API_KEY not configured on server',
        },
        { status: 500 }
      )
    }

    let formData: FormData
    try {
      formData = await request.formData()
    } catch (parseError) {
      console.error('Failed to parse form data:', parseError)
      return NextResponse.json(
        {
          success: false,
          asset_ids: [],
          files: [],
          total_files: 0,
          successful_uploads: 0,
          failed_uploads: 0,
          message: 'Failed to parse uploaded file. The file may be too large.',
          timestamp: new Date().toISOString(),
          error: parseError instanceof Error ? parseError.message : 'Failed to parse form data',
        },
        { status: 413 }
      )
    }

    const files = formData.getAll('files')

    if (files.length === 0) {
      return NextResponse.json(
        {
          success: false,
          asset_ids: [],
          files: [],
          total_files: 0,
          successful_uploads: 0,
          failed_uploads: 0,
          message: 'No files provided',
          timestamp: new Date().toISOString(),
          error: 'No files provided',
        },
        { status: 400 }
      )
    }

    // Forward the request to Lyzr API
    const uploadFormData = new FormData()
    for (const file of files) {
      if (file instanceof File) {
        uploadFormData.append('files', file, file.name)
      }
    }

    // Use AbortController for timeout (4 minutes for large videos)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 240_000)

    let response: Response
    try {
      response = await fetch(LYZR_UPLOAD_URL, {
        method: 'POST',
        headers: {
          'x-api-key': LYZR_API_KEY,
        },
        body: uploadFormData,
        signal: controller.signal,
      })
    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      if (fetchError?.name === 'AbortError') {
        console.error('Upload to Lyzr API timed out')
        return NextResponse.json(
          {
            success: false,
            asset_ids: [],
            files: [],
            total_files: files.length,
            successful_uploads: 0,
            failed_uploads: files.length,
            message: 'Upload timed out. The file may be too large. Try a shorter or lower-resolution video.',
            timestamp: new Date().toISOString(),
            error: 'Upload timed out after 4 minutes',
          },
          { status: 504 }
        )
      }
      throw fetchError
    }
    clearTimeout(timeoutId)

    if (response.ok) {
      const data = await response.json()

      const uploadedFiles = (data.results || []).map((r: any) => ({
        asset_id: r.asset_id || '',
        file_name: r.file_name || '',
        success: r.success ?? true,
        error: r.error,
      }))

      const assetIds = uploadedFiles
        .filter((f: any) => f.success && f.asset_id)
        .map((f: any) => f.asset_id)

      return NextResponse.json({
        success: true,
        asset_ids: assetIds,
        files: uploadedFiles,
        total_files: data.total_files || files.length,
        successful_uploads: data.successful_uploads || assetIds.length,
        failed_uploads: data.failed_uploads || 0,
        message: `Successfully uploaded ${assetIds.length} file(s)`,
        timestamp: new Date().toISOString(),
      })
    } else {
      const errorText = await response.text()
      console.error('Upload API error:', response.status, errorText)

      let userMessage = `Upload failed with status ${response.status}`
      if (response.status === 413) {
        userMessage = 'File is too large. Try a shorter or lower-resolution video.'
      } else if (response.status === 415) {
        userMessage = 'Unsupported file format. Please use MP4, MOV, WEBM, AVI, JPG, or PNG.'
      } else if (response.status >= 500) {
        userMessage = 'Upload server is temporarily unavailable. Please try again in a moment.'
      }

      return NextResponse.json(
        {
          success: false,
          asset_ids: [],
          files: [],
          total_files: files.length,
          successful_uploads: 0,
          failed_uploads: files.length,
          message: userMessage,
          timestamp: new Date().toISOString(),
          error: errorText || userMessage,
        },
        { status: response.status }
      )
    }
  } catch (error) {
    console.error('File upload error:', error)

    return NextResponse.json(
      {
        success: false,
        asset_ids: [],
        files: [],
        total_files: 0,
        successful_uploads: 0,
        failed_uploads: 0,
        message: 'Server error during upload. Please try again.',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
