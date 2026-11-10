package com.fromvictoryapp.app;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.charset.StandardCharsets;
import java.util.UUID;

/** Bounded app-private WAV transfer. Never accepts a caller-supplied path or URL. */
final class NarrationTransfer implements AutoCloseable {
    static final int MAX_BYTES = 64 * 1024 * 1024;
    static final int MAX_CHUNK_BYTES = 192 * 1024;
    final String sessionId;
    final File file;
    private final int expectedBytes;
    private FileOutputStream output;
    private int receivedBytes;
    private int nextIndex;

    static void validateBegin(String id, int bytes) {
        if (id == null || !UUID.fromString(id).toString().equalsIgnoreCase(id)) {
            throw new IllegalArgumentException("Invalid session ID");
        }
        if (bytes <= 44 || bytes > MAX_BYTES) throw new IllegalArgumentException("Invalid WAV size");
    }

    NarrationTransfer(File directory, String id, int bytes) throws IOException {
        validateBegin(id, bytes);
        sessionId = id;
        expectedBytes = bytes;
        file = File.createTempFile("fv-narration-", ".wav", directory);
        output = new FileOutputStream(file);
    }

    void append(int index, byte[] bytes) throws IOException {
        if (output == null || index != nextIndex || bytes.length == 0 ||
            bytes.length > MAX_CHUNK_BYTES || bytes.length > expectedBytes - receivedBytes) {
            throw new IllegalArgumentException("Invalid or out-of-order WAV chunk");
        }
        output.write(bytes);
        receivedBytes += bytes.length;
        nextIndex++;
    }

    void finish() throws IOException {
        if (output == null || receivedBytes != expectedBytes) throw new IllegalArgumentException("Incomplete WAV");
        output.close();
        output = null;
        byte[] header = new byte[44];
        try (FileInputStream input = new FileInputStream(file)) {
            if (input.read(header) != header.length) throw new IllegalArgumentException("Invalid WAV header");
        }
        ByteBuffer b = ByteBuffer.wrap(header).order(ByteOrder.LITTLE_ENDIAN);
        int sampleRate = b.getInt(24);
        if (!tag(header, 0, "RIFF") || !tag(header, 8, "WAVE") || !tag(header, 12, "fmt ") ||
            !tag(header, 36, "data") || b.getInt(4) != expectedBytes - 8 || b.getInt(16) != 16 ||
            b.getShort(20) != 1 || b.getShort(22) != 1 || b.getShort(34) != 16 ||
            sampleRate < 8000 || sampleRate > 96000 || b.getInt(28) != sampleRate * 2 ||
            b.getShort(32) != 2 || b.getInt(40) != expectedBytes - 44 || (expectedBytes - 44) % 2 != 0) {
            throw new IllegalArgumentException("Expected a complete mono PCM WAV");
        }
    }

    private static boolean tag(byte[] bytes, int offset, String expected) {
        return new String(bytes, offset, 4, StandardCharsets.US_ASCII).equals(expected);
    }

    @Override public void close() {
        if (output != null) {
            try { output.close(); } catch (IOException ignored) { }
            output = null;
        }
        file.delete();
    }
}
