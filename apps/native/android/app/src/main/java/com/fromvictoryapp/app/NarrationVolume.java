package com.fromvictoryapp.app;

/** Strict bridge validation before any native player gain is changed. */
final class NarrationVolume {
    private NarrationVolume() { }

    static double validate(String requestedSession, String activeSession, boolean prepared, Object value) {
        if (requestedSession == null || activeSession == null || !requestedSession.equals(activeSession)) {
            throw new IllegalArgumentException("Inactive narration session");
        }
        if (!prepared) throw new IllegalStateException("Narration not ready");
        // Do not coerce strings, booleans, or null into a valid volume.
        if (!(value instanceof Number)) throw new IllegalArgumentException("Volume must be a number");
        double volume = ((Number) value).doubleValue();
        if (!Double.isFinite(volume) || volume < 0 || volume > 1) {
            throw new IllegalArgumentException("Volume must be between zero and one");
        }
        return volume;
    }
}
