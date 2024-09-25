# <span ><img style='vertical-align:middle; display:inline;' src="./logo.png"  width="5%" height="5%"><span style='vertical-align: middle; line-height: normal;'>&nbsp;Starmoon - An affordable, empathic, and conversational AI companion</span></span>

Starmoon is an affordable, compact AI-enabled device, you can take anywhere and converse with. It can understand your emotions and respond with empathy, offering supportive conversations and personalized learning assistance.

[Check our Roadmap](roadmap.md)

<!-- Put on a toy, Hanging on the hand, put on the desktop near macbook -->

<div align="center">
    <img src="./logo.png" alt="Starmoon-logo" width="20%"  style="border-radius: 50%; padding-bottom: 20px"/>

<!-- [![Discord Follow](https://dcbadge.vercel.app/api/server/HUpRgp2HG8?style=flat)](https://discord.gg) -->

[![License: GPLv3](https://img.shields.io/badge/license-GPLv3-blue)](https://www.gnu.org/licenses/gpl-3.0.en.html)&ensp;&ensp;&ensp;

<!-- [![GitHub Repo stars](https://img.shields.io/github/stars/quivrhq/quivr?style=social)](https://github.com/quivrhq/quivr) -->
<!-- [![Twitter Follow](https://img.shields.io/twitter/follow/StanGirard?style=social)](https://twitter.com/_StanGirard) -->
</div>

## Demo Highlights 🎥

Video

## Key features 🎯

-   **Cost-effective**: Assemble the device yourself with off-the-shelf components costing <$20.
-   **Voice-enabled emotional intelligence**: Understand and analyze trends in your emotions through your conversations in real time.
-   **Open-source**: Fully open-source, you can deploy Starmoon locally and self-host to ensure the privacy of your data.
-   **Compact device**: Only slightly larger than an Apple Watch, you can carry the device anywhere.
-   **Reduced screen time**: A myriad of AI companions are screen-based, and our intention is to give your eyes a rest.

## Getting Started 🚀

### Prerequisites 📋

1. API keys and services:

    - [Docker](https://docs.docker.com/get-started/get-docker/)
    - Supabase CLI: Follow the instructions [here](https://supabase.com/docs/guides/cli/getting-started) to install if you haven't installed
    - Vscode and [PlatformIO](https://platformio.org/install/ide?install=vscode) plugin: For firmware burning
    - [OpenAI API key](https://platform.openai.com/api-keys): For AI language models
    - [Deepgram API key](https://developers.deepgram.com/docs/create-additional-api-keys): For speech-to-text
    - [Azure speech API keys](https://vitalpbx.com/blog/how-to-create-microsoft-azure-tts-api-key/): For text-to-speech
    - [Huggingface API key](https://huggingface.co/docs/api-inference/en/quicktour#get-your-api-token): For emotion recognition

2. Hardware list (Tax and shipping rates may vary by region)
    - [Seeed Studio Xiao ESP32S3](https://www.aliexpress.us/item/1005007341749305.html)
    - [Microphone (INMP441)](https://www.aliexpress.us/item/3256806674485209.html)
    - [Amplifier (MAX98357A)](https://www.aliexpress.us/item/3256806524695775.html)
    - [Speaker (3525)](https://www.aliexpress.us/item/3256805515112434.html)
    - [LED light](https://www.aliexpress.us/item/3256805384408000.html)
    - [Button](https://www.aliexpress.us/item/3256803815119722.html)
    - [PCB prototype board](https://www.aliexpress.com/item/1005005038301414.html)
    - 3D printed case (link)
    - Tools: [28AWG wires](https://www.aliexpress.us/item/3256801511896966.html) + [soldering toolset](https://www.aliexpress.com/item/1005007010143403.html) + [flux](https://www.aliexpress.com/item/1005007003481283.html)

### Software setup 🖥️

-   **Step 0**: Clone the repository:

    ```bash
    git clone https://github.com/StarmoonAI/Starmoon.git && cd starmoon
    ```

-   **Step 1**: Set up Supabase:

    ```bash
    supabase start
    ```

    ```bash
    supabase db reset
    ```

-   **Step 2**: Copy the `.env.example` files

    ```bash
    cp .env.example .env
    ```

-   **Step 3**: Update tokens in the `.env` file
    -   For local set up, you only need to update `OPENAI_API_KEY`, `MS_SPEECH_ENDPOINTY`, `SPEECH_KEY`, `SPEECH_REGION`, `DG_API_KEY`, `HF_ACCESS_TOKEN`
-   **Step 4**: Launch the project

    -   If you have a Mac, go to Docker Desktop > Settings > General and check that the "file sharing implementation" is set to `VirtioFS`.

    ```bash
    docker compose pull
    docker compose up
    ```

    If you are a **developer**, you can run the project in development mode with the following command: `docker compose -f docker-compose.yml up --build`

-   **Step 5**: Login to the app

    -   You can now sign in to the app with `admin@starmoon.app` & `admin`. You can access the Starmoon webapp at [http://localhost:3000/login](http://localhost:3000/login) and sign up an account

    -   You can access Starmoon backend API at [http://localhost:8000/docs](http://localhost:8000/docs)

    -   You can access Supabase dashboard at [http://localhost:54323](http://localhost:54323)

    -   You can access Celery Flower background task dashboard at [http://localhost:5555](http://localhost:5555) (`admin@starmoon.app` & `admin`)

### Hardware setup 🧰

-   **Step 0 (Optional)**: Build the device yourself (or, alternatively, consider purchasing the [Starmoon DIY Dev Kit](www.starmoon.app/products) so you can focus on creating your own backend)

    -   Follow the instructions [here](firmware/README.md) for more details on assembly

-   **Step 1**: Open PlatformIO Icon (VScode icon left sidebar)

    -   Click "Pick a folder"
    -   Select the location of the `firmware` folder in the current project.

-   **Step 2**: Update the WiFi (only support 2.4Ghz) credentials and WebSocket server details in `src/main.cpp`

    -   Find the following lines in the code and update them with your information:
    -   Find the WiFi host by command `ipconfig` (under `Default Gateway`) in Windows or `ifconfig` (under `inet xxx.x.x.x netmask 0xff000000`) in Linux/MacOS

        ```cpp
        // Wifi setup
        Power the device -> Find the Access Point Wifi capture portal under "Starmoon device"

        // WebSocket setup
        const char *websocket_server_host = "<your-server-host-ip>"; // Wifi settings -> Your Wifi I.P.
        const uint16_t websocket_server_port = 8000;
        const char *websocket_server_path = "/starmoon";
        const char *auth_token = "<your-STARMOON_API_KEY-here>"; // generate your STARMOON_API_KEY in your starmoon account settings page
        ```

-   **Step 3**: Build the firmware

    -   Click `Build` button in the PlatformIO toolbar or run the build task.

-   **Step 4**: Upload the firmware to the device
    -   Connect your ESP32-S3 to your computer using usb.
    -   Click the `Upload` button to run the upload task, or `Upload and Monitor` button to run the upload task and monitor the device.
-   **Step 5**: Hardware usage
    -   Once the software and firmware are set up, you can push the button to power on the ESP32 device and start talking to the device.
    -   The LED indicates the current status:
        -   Off: Not connected
        -   Solid On: Connected and listening on microphone
        -   Pulsing: Streaming audio output (receiving from server)

## Updating Starmoon App 🚀

-   **Step 1**: Pull the latest changes

    ```bash
    git pull
    ```

-   **Step 2**: Update the migration

    ```bash
    supabase migration up
    ```

## License

This project is licensed under the GPL-3.0 License - see the [LICENSE](LICENSE) file for details
