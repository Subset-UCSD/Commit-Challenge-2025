// This script demonstrates the AES-GCM decryption logic using the Web Crypto API.
// Note: This script CANNOT perform the full cookie decryption process on its own,
// as it cannot access the Windows DPAPI to get the initial key.

/**
 * Decodes a base64 string into a Uint8Array.
 * @param {string} b64 - The base64-encoded string.
 * @returns {Uint8Array} The decoded byte array.
 */
function b64ToBytes(b64) {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) {
        bytes[i] = bin.charCodeAt(i);
    }
    return bytes;
}

/**
 * Decrypts the intermediate key using the hardcoded AES key.
 * This corresponds to the `decrypt-key` subcommand.
 *
 * @param {string} intermediateKeyB64 - The base64-encoded intermediate key (from DPAPI user decryption).
 * @returns {Promise<Uint8Array>} A promise that resolves to the final decrypted master key.
 */
async function decryptIntermediateKey(intermediateKeyB64) {
    const hardcodedAesKeyB64 = "sxxuJBrIRnKNqcH6xJNmUc/7lE0UOrgWJ2vMbaAoR4c=";
    const aesKey = await crypto.subtle.importKey(
        "raw",
        b64ToBytes(hardcodedAesKeyB64),
        "AES-GCM",
        false,
        ["decrypt"]
    );

    const encryptedKeyBytes = b64ToBytes(intermediateKeyB64);

    // [flag|iv|ciphertext|tag]
    // [1byte|12bytes|32bytes|16bytes]
    const iv = encryptedKeyBytes.slice(1, 1 + 12);
    const ciphertext = encryptedKeyBytes.slice(1 + 12); // The rest is ciphertext + tag

    const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: iv },
        aesKey,
        ciphertext
    );

    return new Uint8Array(decrypted);
}

/**
 * Decrypts a V10/V11 cookie value using the final master key.
 * This corresponds to the logic in the `decrypt-cookies` subcommand.
 *
 * @param {Uint8Array} masterKey - The final master key (as a byte array).
 * @param {Uint8Array} encryptedCookie - The raw encrypted cookie value from the database.
 * @returns {Promise<string>} A promise that resolves to the decrypted cookie value as a string.
 */
async function decryptCookieValue(masterKey, encryptedCookie) {
    const key = await crypto.subtle.importKey(
        "raw",
        masterKey,
        "AES-GCM",
        false,
        ["decrypt"]
    );

    // [flag|iv|ciphertext|tag]
    // [3bytes|12bytes|variable|16bytes]
    const iv = encryptedCookie.slice(3, 3 + 12);
    const ciphertext = encryptedCookie.slice(3 + 12); // The rest is ciphertext + tag

    const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: iv },
        key,
        ciphertext
    );

    // The decrypted value is the cookie data, decode it from UTF-8
    return new TextDecoder().decode(decrypted);
}

// --- Example Usage ---
// To use this in a browser, you would need to get the intermediate key and encrypted
// cookie values from the Rust tool first, then paste them here.

async function runExample() {
    // 1. Paste the base64 intermediate key from Step 3 of the README.
    const intermediateKeyB64 = "PASTE_INTERMEDIATE_KEY_HERE";

    // 2. Paste an encrypted cookie value (as base64) from the database.
    const encryptedCookieB64 = "PASTE_ENCRYPTED_COOKIE_B64_HERE";

    if (intermediateKeyB64 === "PASTE_INTERMEDIATE_KEY_HERE") {
        console.log("Please edit the script to provide example data.");
        return;
    }

    try {
        // Decrypt the intermediate key to get the master key
        const masterKey = await decryptIntermediateKey(intermediateKeyB64);
        console.log("Master Key (bytes):", masterKey);

        // Decrypt the cookie
        const encryptedCookie = b64ToBytes(encryptedCookieB64);
        const decryptedValue = await decryptCookieValue(masterKey, encryptedCookie);
        console.log("Decrypted Cookie:", decryptedValue);

    } catch (e) {
        console.error("Decryption failed:", e);
    }
}

// runExample();