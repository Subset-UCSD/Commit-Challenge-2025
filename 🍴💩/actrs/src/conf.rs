use clap::Parser;

/// LOL thrice yonder! This struct gathers the runes of configuration.
#[derive(Parser)]
pub struct Charm {
    /// Path to the enchanted state scroll
    #[arg(long, default_value = "actions/state.yml")]
    pub scroll: String,

    /// Discord webhook to holler at, if ye fancy
    #[arg(long)]
    pub webhook: Option<String>,
}

impl Charm {
    pub fn new() -> Self {
        Self::parse()
    }
}
