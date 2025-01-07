use serenity::all::{CreateMessage, GatewayIntents};
use serenity::model::id::UserId;
use serenity::Client;
use std::collections::HashMap;
use std::{env, fs};

#[tokio::main]
async fn main() {
    let token = env::var("DISCORD_TOKEN").expect("Expected a token in the environment");

    let file_content =
        fs::read_to_string("messages.json").expect("Failed to read messages.json file");
    let messages: HashMap<u64, String> =
        serde_json::from_str(&file_content).expect("Failed to parse JSON into HashMap");

    let client = Client::builder(token, GatewayIntents::non_privileged())
        .await
        .expect("Error creating client");

    for (user_id, message) in messages.iter() {
        send_direct_message(&client, user_id, message).await;
    }
}

async fn send_direct_message(client: &Client, user_id: &u64, message: &str) {
    let user_id = UserId::new(*user_id);

    if let Err(why) = user_id.create_dm_channel(&client.http).await {
        eprintln!("Error creating DM channel to <@{user_id}>: {:?}", why);
    } else if let Err(why) = user_id
        .direct_message(&client.http, CreateMessage::new().content(message))
        .await
    {
        eprintln!("Error sending DM to <@{user_id}>: {:?}", why);
    } else {
        println!("DM sent to <@{user_id}> successfully: {message}");
    }
}
