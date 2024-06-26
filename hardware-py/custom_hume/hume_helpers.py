from helper_functions import print_ascii_art

# ================================================
# Event Handlers
#
# These can be used to specify behavior when interfacing with the WebSocket.
#
# They can be synchronous (i.e. def handler: ...)
# or asynchronous (i.e. async def handler: ...) and awaitable.
# Both allow for dynamic updating of application state using global variables.
# Asynchronous handlers enable awaitable actions, such as transmitting data
# to a database.
#
# There are 4 handlers: on_open, on_message, on_error, and on_close.
#
# on_open: what happens when the WebSocket opens.
#
# on_message: what happens when a message is received.
# --> You can create conditional behavior to execute based on the type of message.
# --> Below are the types of messages you can receive, and their data:
# https://dev.hume.ai/reference/empathic-voice-interface-evi/chat/chat#receive
#
# on_error: what happens when an error occurs.
#
# on_close: what happens when the WebSocket closes.
# 
# ================================================

# Handler for when the connection is opened
def on_open():
    # Print a welcome message using ASCII art
    print_ascii_art("Say hello to EVI, Hume AI's Empathic Voice Interface!")

# Handler for incoming messages
def on_message(message):
    global message_counter
    # Increment the message counter for each received message
    message_counter += 1
    msg_type = message["type"]

    # Start the message box with the common header
    message_box = (
        f"\n{'='*60}\n"
        f"Message {message_counter}\n"
        f"{'-'*60}\n"
    )

    # Add role and content for user and assistant messages
    if msg_type in {"user_message", "assistant_message"}:
        role = message["message"]["role"]
        content = message["message"]["content"]
        message_box += (
            f"role: {role}\n"
            f"content: {content}\n"
            f"type: {msg_type}\n"
        )

        # Add top emotions if available
        if "models" in message and "prosody" in message["models"]:
            scores = message["models"]["prosody"]["scores"]
            num = 3
            # Get the top N emotions based on the scores
            top_emotions = get_top_n_emotions(prosody_inferences=scores, number=num)

            message_box += f"{'-'*60}\nTop {num} Emotions:\n"
            for emotion, score in top_emotions:
                message_box += f"{emotion}: {score:.4f}\n"

    # Add all key-value pairs for other message types, excluding audio_output
    elif msg_type != "audio_output":
        for key, value in message.items():
            message_box += f"{key}: {value}\n"
    else:
        message_box += (
            f"type: {msg_type}\n"
        )

    message_box += f"{'='*60}\n"
    # Print the constructed message box
    print(message_box)

# Function to get the top N emotions based on their scores
def get_top_n_emotions(prosody_inferences, number):
    # Sort the inferences by their scores in descending order
    sorted_inferences = sorted(prosody_inferences.items(), key=lambda item: item[1], reverse=True)
    # Return the top N inferences
    return sorted_inferences[:number]

# Handler for when an error occurs
def on_error(error):
    # Print the error message
    print(f"Error: {error}")

# Handler for when the connection is closed
def on_close():
    # Print a closing message using ASCII art
    print_ascii_art("Thank you for using EVI, Hume AI's Empathic Voice Interface!")