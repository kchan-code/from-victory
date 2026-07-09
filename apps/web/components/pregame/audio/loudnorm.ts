// Canonical ffmpeg loudnorm filter string used across all pregame audio clips.
// This module exports a single constant to avoid duplication and circular imports.
export const CLIP_LOUDNORM_FILTER = "loudnorm=I=-16:TP=-1.5:LRA=11";
