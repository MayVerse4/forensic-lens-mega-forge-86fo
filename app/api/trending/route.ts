import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware, getCurrentUserId } from 'lyzr-architect';
import getTrendingModel from '@/models/Trending';

async function handler(req: NextRequest) {
  try {
    const Model = await getTrendingModel();

    if (req.method === 'GET') {
      const data = await Model.find({}).sort({ upload_count: -1, last_analyzed: -1 }).limit(20).lean();
      return NextResponse.json({ success: true, data });
    }

    if (req.method === 'POST') {
      const body = await req.json();
      const { media_hash, title, classification, final_score, snippet } = body;

      const existing = await Model.findOne({ media_hash });
      if (existing) {
        const updated = await Model.findOneAndUpdate(
          { media_hash },
          {
            $inc: { upload_count: 1 },
            $set: {
              last_analyzed: new Date(),
              classification,
              final_score,
              snippet,
              is_rising: (existing.upload_count || 0) + 1 >= 3,
            },
          },
          { new: true }
        );
        return NextResponse.json({ success: true, data: updated });
      } else {
        const doc = await Model.create({
          media_hash,
          title,
          classification,
          final_score,
          upload_count: 1,
          last_analyzed: new Date(),
          is_rising: false,
          snippet,
          owner_user_id: getCurrentUserId(),
        });
        return NextResponse.json({ success: true, data: doc });
      }
    }

    return NextResponse.json({ success: false, error: 'Method not allowed' }, { status: 405 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 });
  }
}

export const GET = authMiddleware(handler);
export const POST = authMiddleware(handler);
