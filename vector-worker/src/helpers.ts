/**
 * Shared helper functions for encoding and hex conversion.
 *
 * These utilities are used across multiple modules for
 * cryptographic operations and data transformation.
 */

/**
 * Encodes a string into a Uint8Array using UTF-8 encoding.
 *
 * @param value - The string to encode
 * @returns A Uint8Array containing the UTF-8 bytes
 */
export function toU8(value: string): Uint8Array {
	return new TextEncoder().encode(value);
}

/**
 * Converts an ArrayBuffer to a lowercase hex string.
 *
 * @param buffer - The ArrayBuffer to convert
 * @returns A hex string representation of the buffer
 */
export function toHex(buffer: ArrayBuffer): string {
	return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
