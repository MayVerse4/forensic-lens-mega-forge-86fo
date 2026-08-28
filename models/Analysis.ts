import { initDB, createModel } from 'lyzr-architect';

let _model: any = null;

export default async function getAnalysisModel() {
  if (!_model) {
    await initDB();
    _model = createModel('Analysis', {
      user_id: { type: String, default: '' },
      media_hash: { type: String, index: true, default: '' },
      media_type: { type: String, default: 'image' },
      filename: { type: String, required: true },
      final_score: { type: Number, default: 0 },
      classification: { type: String, default: 'Inconclusive' },
      spatial_score: { type: Number, default: 0 },
      temporal_score: { type: Number, default: 0 },
      frequency_score: { type: Number, default: 0 },
      metadata_score: { type: Number, default: 0 },
      source_score: { type: Number, default: 0 },
      metadata_status: { type: String },
      metadata_flag: { type: String, default: 'missing' },
      override_applied: { type: Boolean, default: false },
      source_assessment: { type: String, default: 'unknown' },
      top_contributing_signal: { type: String, default: 'Unknown' },
      forensic_reasoning: { type: String, default: '' },
      confidence_level: { type: String, default: 'Low' },
      media_preview: { type: String },
    });
  }
  return _model;
}
