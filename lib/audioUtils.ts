/**
 * Audio processing helpers for Gemini Live 24kHz PCM playback and 16kHz PCM capture.
 */

export function decodeBase64Bytes(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

export function encodeBase64Bytes(bytes: Uint8Array): string {
    const chunkSize = 0x8000;
    const parts: string[] = [];
    for (let i = 0; i < bytes.length; i += chunkSize) {
        parts.push(String.fromCharCode(...bytes.subarray(i, i + chunkSize)));
    }
    return btoa(parts.join(''));
}

/**
 * Synchronously decodes little-endian signed 16-bit PCM bytes into normalized [-1, 1] Float32 samples.
 * Handles odd byte lengths and non-zero Uint8Array byteOffset safely without alignment errors.
 */
export function decodePcm16ToFloat32(bytes: Uint8Array): Float32Array {
    const sampleCount = Math.floor(bytes.byteLength / 2);
    const float32 = new Float32Array(sampleCount);
    const view = new DataView(bytes.buffer, bytes.byteOffset, sampleCount * 2);
    for (let i = 0; i < sampleCount; i++) {
        float32[i] = view.getInt16(i * 2, true) / 32768.0;
    }
    return float32;
}

/**
 * Converts normalized Float32 samples into 16kHz signed 16-bit PCM payload for Gemini Live.
 */
export function float32ToPcm16Base64(data: Float32Array): string {
    const int16 = new Int16Array(data.length);
    for (let i = 0; i < data.length; i++) {
        const clamped = Math.max(-1, Math.min(1, data[i]));
        int16[i] = clamped < 0 ? Math.round(clamped * 32768) : Math.round(clamped * 32767);
    }
    return encodeBase64Bytes(new Uint8Array(int16.buffer));
}

/**
 * Box-averages (anti-aliased downsampling) a Float32 audio buffer when the browser
 * hardware forces a higher sample rate (e.g., 44.1kHz or 48kHz) instead of 16kHz.
 */
export function downsampleFloat32(
    buffer: Float32Array,
    inputSampleRate: number,
    targetSampleRate: number = 16000
): Float32Array {
    if (!inputSampleRate || inputSampleRate <= targetSampleRate) {
        return buffer;
    }
    const ratio = inputSampleRate / targetSampleRate;
    const outputLength = Math.floor(buffer.length / ratio);
    const result = new Float32Array(outputLength);
    let offsetBuffer = 0;
    for (let i = 0; i < outputLength; i++) {
        const nextOffsetBuffer = Math.round((i + 1) * ratio);
        let accum = 0;
        let count = 0;
        for (let j = offsetBuffer; j < nextOffsetBuffer && j < buffer.length; j++) {
            accum += buffer[j];
            count++;
        }
        result[i] = count > 0 ? accum / count : 0;
        offsetBuffer = nextOffsetBuffer;
    }
    return result;
}
