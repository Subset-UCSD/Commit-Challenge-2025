use reqwest::Client;
use serde_json::json;

/// Whisper to the mighty Gemini.
pub async fn ask(key: &str, chant: &str) -> Result<String, reqwest::Error> {
    let cli = Client::new();
    let spell = json!({"contents": [{"parts": [{"text": chant}]}]});
    let resp = cli
        .post(format!("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={}", key))
        .json(&spell)
        .send()
        .await?;
    let j: serde_json::Value = resp.json().await?;
    Ok(j["candidates"][0]["content"]["parts"][0]["text"].as_str().unwrap_or("").to_string())
}
