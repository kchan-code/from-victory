package com.fromvictoryapp.app;

import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.TemporaryFolder;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.UUID;
import static org.junit.Assert.*;

public class NarrationTransferTest {
    @Rule public TemporaryFolder directory = new TemporaryFolder();
    private byte[] wav() {
        ByteBuffer b = ByteBuffer.allocate(48).order(ByteOrder.LITTLE_ENDIAN);
        b.put("RIFF".getBytes(StandardCharsets.US_ASCII)).putInt(40);
        b.put("WAVEfmt ".getBytes(StandardCharsets.US_ASCII)).putInt(16);
        b.putShort((short) 1).putShort((short) 1).putInt(24000).putInt(48000);
        b.putShort((short) 2).putShort((short) 16);
        b.put("data".getBytes(StandardCharsets.US_ASCII)).putInt(4).putInt(0);
        return b.array();
    }
    private NarrationTransfer transfer(int length) throws Exception {
        return new NarrationTransfer(directory.getRoot(), UUID.randomUUID().toString(), length);
    }
    @Test public void acceptsCompleteOrderedWavAndRemovesCacheOnClose() throws Exception {
        byte[] bytes = wav();
        NarrationTransfer value = transfer(bytes.length);
        value.append(0, Arrays.copyOfRange(bytes, 0, 24));
        value.append(1, Arrays.copyOfRange(bytes, 24, bytes.length));
        value.finish();
        assertTrue(value.file.exists());
        value.close();
        assertFalse(value.file.exists());
    }
    @Test public void rejectsIncompleteTransfer() throws Exception {
        try (NarrationTransfer value = transfer(48)) {
            value.append(0, new byte[10]);
            assertThrows(IllegalArgumentException.class, value::finish);
        }
    }
    @Test public void rejectsDuplicateAndOutOfOrderChunksWithoutConsumingBytes() throws Exception {
        try (NarrationTransfer value = transfer(48)) {
            assertThrows(IllegalArgumentException.class, () -> value.append(1, new byte[10]));
            value.append(0, wav());
            assertThrows(IllegalArgumentException.class, () -> value.append(0, new byte[1]));
            value.finish();
        }
    }
    @Test public void rejectsDeclaredSizeOverflowAndOversizeChunk() throws Exception {
        try (NarrationTransfer value = transfer(48)) {
            assertThrows(IllegalArgumentException.class, () -> value.append(0, new byte[49]));
        }
        try (NarrationTransfer value = transfer(NarrationTransfer.MAX_BYTES)) {
            assertThrows(IllegalArgumentException.class, () -> value.append(0, new byte[NarrationTransfer.MAX_CHUNK_BYTES + 1]));
        }
        assertThrows(IllegalArgumentException.class, () -> NarrationTransfer.validateBegin(UUID.randomUUID().toString(), NarrationTransfer.MAX_BYTES + 1));
    }
    @Test public void rejectsPathsInsteadOfSessionIdentifiers() {
        assertThrows(IllegalArgumentException.class, () -> NarrationTransfer.validateBegin("../../some-file", 48));
        assertThrows(IllegalArgumentException.class, () -> NarrationTransfer.validateBegin("", 48));
    }
    @Test public void rejectsNonWavAndMismatchedHeaderSize() throws Exception {
        try (NarrationTransfer value = transfer(48)) {
            value.append(0, new byte[48]);
            assertThrows(IllegalArgumentException.class, value::finish);
        }
        try (NarrationTransfer value = transfer(48)) {
            byte[] bytes = wav();
            bytes[40] = 6;
            value.append(0, bytes);
            assertThrows(IllegalArgumentException.class, value::finish);
        }
    }
    @Test public void rejectsAppendAfterPrepare() throws Exception {
        try (NarrationTransfer value = transfer(48)) {
            value.append(0, wav());
            value.finish();
            assertThrows(IllegalArgumentException.class, () -> value.append(1, new byte[2]));
        }
    }
}
