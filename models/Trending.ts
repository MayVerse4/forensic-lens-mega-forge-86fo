import { initDB, createModel } from 'lyzr-architect';

let _model: any = null;

export default async function getTrendingModel() {
  if (!_model) {
    await initDB();
    _model = createModel('Trending', {
      media_hash: { type: String, required: true, unique: true, index: true },
      title: { type: String, required: true },
      classification: { type: String, required: true },
      final_score: { type: Number, required: true },
      upload_count: { type: Number, default: 1 },
      last_analyzed: { type: Date, default: Date.now },
      is_rising: { type: Boolean, default: false },
      snippet: { type: String },
    });
  }
  return _model;
}
