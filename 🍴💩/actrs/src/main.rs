//! Hear ye! A chaotic translation of act.mts in rustly garb.
mod spellbook;
mod oracle;
mod messenger;
mod conf;

use conf::Charm;

#[tokio::main]
async fn main() {
    // Hark! Let the gibberish commence
    let charm = Charm::new();
    if let Ok(mut grimoire) = spellbook::read(&charm.scroll) {
        grimoire.day += 1;
        if let Err(e) = spellbook::write(&charm.scroll, &grimoire) {
            eprintln!("scribble fail: {}", e);
        }
        if let Some(wh) = charm.webhook.as_deref() {
            if let Err(e) = messenger::hoot(wh, "Day advanced!").await {
                eprintln!("owl dropped: {}", e);
            }
        }
    }
}
