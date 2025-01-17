use serenity::all::{CreateMessage, GatewayIntents, GetMessages};
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

    let dm_channel = match user_id.create_dm_channel(&client.http).await {
        Ok(dm_channel) => dm_channel,
        Err(why) => {
            eprintln!("Error creating DM channel to <@{user_id}>: {:?}", why);
            return;
        }
    };

    let channel_id = dm_channel.id;
    let last_message = match channel_id
        .messages(&client.http, GetMessages::new().limit(5))
        .await
    {
        Ok(messages) => {
            for message in &messages {
                if message.author.id != user_id {
                    break;
                }
                println!(
                    "[{}] {}: {}",
                    message.timestamp, message.author.name, message.content
                );
            }
            messages
                .get(0)
                .cloned()
                .filter(|message| message.author.id == user_id)
        }
        Err(why) => {
            eprintln!("Error fetching messages for <@{user_id}>: {:?}", why);
            None
        }
    };

    if let Err(why) = match last_message {
        Some(last_message) => last_message.reply(&client.http, message).await,
        None => {
            user_id
                .direct_message(&client.http, CreateMessage::new().content(message))
                .await
        }
    } {
        eprintln!("Error sending DM to <@{user_id}>: {:?}", why);
        return;
    }
    eprintln!("DM sent to <@{user_id}> successfully: {message}");
}
