import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware, getCurrentUserId } from 'lyzr-architect';
import getAnalysisModel from '@/models/Analysis';

async function handler(req: NextRequest) {
  try {
    const Model = await getAnalysisModel();

    if (req.method === 'GET') {
      const data = await Model.find({}).sort({ createdAt: -1 }).lean();
      return NextResponse.json({ success: true, data });
    }

    if (req.method === 'POST') {
      const body = await req.json();
      const doc = await Model.create({
        ...body,
        owner_user_id: getCurrentUserId(),
      });
      return NextResponse.json({ success: true, data: doc });
    }

    if (req.method === 'DELETE') {
      const { searchParams } = new URL(req.url);
      const id = searchParams.get('id');
      if (!id) {
        return NextResponse.json({ success: false, error: 'Missing id parameter' }, { status: 400 });
      }
      await Model.findByIdAndDelete(id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Method not allowed' }, { status: 405 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 });
  }
}

export const GET = authMiddleware(handler);
export const POST = authMiddleware(handler);
export const DELETE = authMiddleware(handler);
