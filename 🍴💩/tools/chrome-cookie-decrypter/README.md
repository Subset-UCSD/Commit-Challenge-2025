# Chrome Cookie Decrypter

This tool is a command-line utility for decrypting Google Chrome's cookies on Windows. Chrome encrypts its cookie database using a multi-layered approach involving both the Windows Data Protection API (DPAPI) and AES-256-GCM encryption. This tool helps you through the process of extracting and decrypting these cookies.

## How to Use

The decryption process is a multi-step procedure that requires you to run commands in different security contexts (as a regular user and as the SYSTEM user).

### Prerequisites

1.  **Build the tool:**
    ```bash
    cargo build --release
    ```
    The executable will be in the `target/release/` directory.

2.  **Locate Chrome's User Data:**
    You will need to find two files in your Chrome user profile directory (`%USERPROFILE%\AppData\Local\Google\Chrome\User Data\`):
    *   `Local State`: A JSON file containing the encrypted master key.
    *   `Default\Network\Cookies`: The SQLite database containing the encrypted cookies.

### Step 1: Extract the Encrypted Key

First, use the `extract-key` subcommand to get the `app_bound_encrypted_key` from the `Local State` file.

```bash
./target/release/chrome-cookie-decrypter extract-key --local-state-path "C:\Users\YourUser\AppData\Local\Google\Chrome\User Data\Local State"
```

This will print a long base64-encoded string. **Copy this string.**

### Step 2: Decrypt the Key (DPAPI - SYSTEM)

This is the first of two manual decryption steps. It requires running a command as the SYSTEM user.

1.  **Open a SYSTEM-level terminal.** You can use a tool like `psexec` from Sysinternals: `psexec -i -s cmd.exe`.
2.  In the SYSTEM terminal, run the following PowerShell command, replacing `<base64_key_from_step_1>` with the key you copied.

    ```powershell
    [System.Convert]::ToBase64String([System.Security.Cryptography.ProtectedData]::Unprotect([System.Convert]::FromBase64String("<base64_key_from_step_1>").SubString(4), $null, 'LocalMachine'))
    ```
    *Note: The `.SubString(4)` is important as it strips the `APPB` prefix from the key.*

3.  This command will output another base64-encoded string. **Copy this new string.**

### Step 3: Decrypt the Key (DPAPI - USER)

Now, switch back to a **regular user** terminal.

1.  Run the following PowerShell command, replacing `<base64_key_from_step_2>` with the key you just copied from the SYSTEM terminal.

    ```powershell
    [System.Convert]::ToBase64String([System.Security.Cryptography.ProtectedData]::Unprotect([System.Convert]::FromBase64String("<base64_key_from_step_2>"), $null, 'CurrentUser'))
    ```

2.  This will output yet another base64-encoded string. **Copy this string.** This is the intermediate key, which is still encrypted with AES-256-GCM.

### Step 4: Decrypt the Intermediate Key (AES-GCM)

Use the `decrypt-key` subcommand with the key from Step 3.

```bash
./target/release/chrome-cookie-decrypter decrypt-key --decrypted-key "<base64_key_from_step_3>"
```

This will print the **final, decrypted master key** as a base64 string. **Copy this final key.**

### Step 5: Decrypt Cookies

Finally, use the `decrypt-cookies` subcommand with the final key and the path to your `Cookies` database.

```bash
./target/release/chrome-cookie-decrypter decrypt-cookies --key "<final_key_from_step_4>" --cookie-db-path "C:\Users\YourUser\AppData\Local\Google\Chrome\User Data\Default\Network\Cookies" --host "example.com"
```

This will print the decrypted cookies for the specified host.

## The Decryption Process Explained

The process relies on reversing Chrome's encryption scheme. Here's a breakdown:

### 1. DPAPI Encryption

The `app_bound_encrypted_key` found in `Local State` is encrypted with two layers of the Windows Data Protection API (DPAPI):
*   **System-level DPAPI:** The key is first encrypted with `CryptProtectData` using the `LocalMachine` scope. This is why Step 2 requires SYSTEM privileges to decrypt.
*   **User-level DPAPI:** The result of the system-level encryption is then encrypted *again* with `CryptProtectData`, but this time using the `CurrentUser` scope. This is why Step 3 must be run as the logged-in user.

### 2. Intermediate Key Decryption (AES-256-GCM)

The result after the two DPAPI decryptions is an intermediate key that is *still* encrypted, this time with AES-256-GCM. The key for this decryption is hardcoded in Chrome's `elevation_service.exe`.

The data structure of this encrypted blob is:
`[1-byte flag | 12-byte IV | 32-byte ciphertext | 16-byte tag]`

The `decrypt-key` command uses the hardcoded AES key to decrypt the `ciphertext` and get the final master key.

### 3. Cookie Value Decryption (AES-256-GCM)

The actual cookie values in the `Cookies` database (for cookies starting with `v10` or `v11`) are also encrypted with AES-256-GCM. The key for this decryption is the final master key we recovered in Step 4.

The data structure for an encrypted cookie value is:
`[3-byte flag ("v10") | 12-byte IV | variable-length ciphertext | 16-byte tag]`

The `decrypt-cookies` command uses the final key to decrypt the cookie's `ciphertext` to reveal the plaintext cookie value.

## Browser-Based Implementation (Web Crypto API)

**A full implementation in browser-based JavaScript is not possible.**

The Web Crypto API is capable of performing the AES-256-GCM decryption steps (Steps 4 and 5). However, it has no way to perform the initial, crucial DPAPI decryption steps (Steps 2 and 3). The DPAPI is a low-level Windows OS feature that is not, and should not be, exposed to browser sandboxes for security reasons.

Therefore, while you can perform the AES part in JavaScript, you cannot get the necessary key without an external tool (like this one) to handle the DPAPI calls. A helper script (`decrypt.js`) is provided to demonstrate the AES-GCM logic.