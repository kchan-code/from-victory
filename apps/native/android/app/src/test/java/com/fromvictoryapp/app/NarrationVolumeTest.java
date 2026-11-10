package com.fromvictoryapp.app;

import org.junit.Test;
import static org.junit.Assert.*;

public class NarrationVolumeTest {
    private static final String CURRENT = "c64959b4-3d0d-46e3-9093-f0a22b9f2f38";
    private static final String OLD = "e80ee5f5-673b-48c7-9f08-8e4a068df0d9";

    @Test public void acceptsMuteFullVolumeAndFractionalGain() {
        assertEquals(0, NarrationVolume.validate(CURRENT, CURRENT, true, 0), 0);
        assertEquals(1, NarrationVolume.validate(CURRENT, CURRENT, true, 1), 0);
        assertEquals(0.35, NarrationVolume.validate(CURRENT, CURRENT, true, 0.35), 0);
    }
    @Test public void rejectsStaleSessionEvenWithValidGain() {
        assertThrows(IllegalArgumentException.class, () -> NarrationVolume.validate(OLD, CURRENT, true, 0.5));
    }
    @Test public void rejectsMissingOrDisposedSession() {
        assertThrows(IllegalArgumentException.class, () -> NarrationVolume.validate(null, CURRENT, true, 0.5));
        assertThrows(IllegalArgumentException.class, () -> NarrationVolume.validate(CURRENT, null, true, 0.5));
    }
    @Test public void rejectsPreparingOrInactivePlayer() {
        assertThrows(IllegalStateException.class, () -> NarrationVolume.validate(CURRENT, CURRENT, false, 0.5));
    }
    @Test public void rejectsMissingAndCoercedValues() {
        for (Object value : new Object[] {null, "0.5", true, new Object()}) {
            assertThrows(IllegalArgumentException.class, () -> NarrationVolume.validate(CURRENT, CURRENT, true, value));
        }
    }
    @Test public void rejectsNonFiniteAndOutOfRangeNumbers() {
        for (double value : new double[] {Double.NaN, Double.POSITIVE_INFINITY, Double.NEGATIVE_INFINITY, -0.01, 1.01}) {
            assertThrows(IllegalArgumentException.class, () -> NarrationVolume.validate(CURRENT, CURRENT, true, value));
        }
    }
}
