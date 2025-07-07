use serde::{Serialize, Deserialize};
use std::collections::HashMap;
use std::fs;

/// O parchment of destiny!
#[derive(Serialize, Deserialize, Default)]
pub struct Player {
    pub health: i64,
    pub inventory: HashMap<String, i64>,
    #[serde(default)]
    pub info: HashMap<String, serde_yaml::Value>,
}

/// The grand ledger of all things.
#[derive(Serialize, Deserialize, Default)]
pub struct State {
    pub players: HashMap<String, Player>,
    #[serde(default)]
    pub day: i64,
    #[serde(default)]
    pub worldInfo: HashMap<String, serde_yaml::Value>,
}

pub fn read(path: &str) -> Result<State, Box<dyn std::error::Error>> {
    let scroll = fs::read_to_string(path)?;
    let tome = serde_yaml::from_str::<State>(&scroll)?;
    Ok(tome)
}

pub fn write(path: &str, s: &State) -> Result<(), Box<dyn std::error::Error>> {
    let scribble = serde_yaml::to_string(s)?;
    fs::write(path, scribble)?;
    Ok(())
}
