use reqwest::Client;
use serde_json::json;

/// Summon a Discord crow to caw thy news.
pub async fn hoot(url: &str, cry: &str) -> Result<(), reqwest::Error> {
    let cli = Client::new();
    cli.post(url)
        .json(&json!({"content": cry}))
        .send()
        .await?
        .error_for_status()?;
    Ok(())
}
