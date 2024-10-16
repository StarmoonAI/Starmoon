# <span ><img style='vertical-align:middle; display:inline;' src="./logo.png"  width="5%" height="5%"><span style='vertical-align: middle; line-height: normal;'>&nbsp;Starmoon - An affordable, empathic, and conversational AI companion</span></span>

Starmoon is an affordable, compact AI-enabled device, you can take anywhere and converse with. It can understand your emotions and respond with empathy, offering supportive conversations and personalized learning assistance.


[Check our Roadmap](roadmap.md)

<!-- Put on a toy, Hanging on the hand, put on the desktop near macbook -->

<div align="center">
    <img src="./usecases.png" alt="Starmoon-logo" width="100%" padding-bottom: 20px"/>

[![Discord Follow](https://dcbadge.vercel.app/api/server/KJWxDPBRUj?style=flat)](https://discord.gg/KJWxDPBRUj)

[![License: GPLv3](https://img.shields.io/badge/license-GPLv3-blue)](https://www.gnu.org/licenses/gpl-3.0.en.html)&ensp;&ensp;&ensp;

![GitHub forks](https://img.shields.io/github/forks/StarmoonAI/Starmoon.svg?style=social&label=Fork)
![GitHub stars](https://img.shields.io/github/stars/StarmoonAI/Starmoon.svg?style=social&label=Star)
![Node.js](https://img.shields.io/badge/Node.js-14.17.0-brightgreen.svg)
![React](https://img.shields.io/badge/React-17.0.2-blue.svg)

</div>

## Demo Highlights 🎥

https://github.com/user-attachments/assets/89394491-9d87-48ab-b2df-90028118450b

If you can't see the video, you can watch it [here](https://www.youtube.com/watch?v=59rwFuCMviE)

## Key features 🎯

-   **Cost-effective**: Assemble the device yourself with affordable off-the-shelf components.
-   **Voice-enabled emotional intelligence**: Understand and analyze insights in your emotions through your conversations in real time.
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
    - [Huggingface API key](https://huggingface.co/settings/tokens): For emotion intelligence

2. Hardware list (Tax and shipping rates may vary by region)
    - [Seeed Studio Xiao ESP32S3](https://www.aliexpress.us/item/1005007341749305.html)
    - [Microphone (INMP441)](https://www.aliexpress.us/item/3256806674485209.html)
    - [Amplifier (MAX98357A)](https://www.aliexpress.us/item/3256806524695775.html)
    - [Speaker (3525)](https://www.aliexpress.us/item/3256805515112434.html)
    - [LED light](https://www.aliexpress.us/item/3256805384408000.html)
    - [Button](https://www.aliexpress.us/item/3256803815119722.html)
    - [PCB prototype board](https://www.aliexpress.com/item/1005005038301414.html) or [custom PCB](https://www.aliexpress.com/item/1005005038301414.html)
    - [3D printed case](case_model.stl)
    - Tools: [28AWG wires](https://www.aliexpress.us/item/3256801511896966.html) + [soldering toolset](https://www.aliexpress.com/item/1005007010143403.html) + [flux](https://www.aliexpress.com/item/1005007003481283.html)

### Software setup 🖥️

-   **Step 0**: Clone the repository:

    ```bash
    git clone https://github.com/StarmoonAI/Starmoon.git && cd Starmoon
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

    -   You can access Celery Flower background task dashboard at [http://localhost:5555](http://localhost:5555) (`admin` & `admin`)

### Hardware setup 🧰

-   **Step 0 (Optional)**: Build the device yourself (alternatively, the [Starmoon DIY Dev Kit](https://www.starmoon.app/products) comes pre-assembled so you can focus on working with your own frontend + backend)

    -   Follow the instructions [here](firmware/README.md) in Pin Configuration section for more details on assembly

-   **Step 1**: Click PlatformIO Icon in VScode left sidebar

    -   Click "Pick a folder"
    -   Select the location of the `firmware` folder in the current project.

-   **Step 2**: Update and WebSocket server details in `src/Config.cpp`

    -   Find your WiFi ip adress (websocket_server_host) by command `ipconfig` (under `Default Gateway`) in Windows or `ifconfig` (under `inet xxx.x.x.x netmask 0xff000000`) in Linux/MacOS, or you can also follow the instructions [here](https://nordvpn.com/blog/find-router-ip-address/)

        ```cpp
        const char *websocket_server = "<your-server-host-ip>"; // Wifi settings -> Your Wifi I.P.
        const uint16_t websocket_port = 8000; 
        const char *websocket_path = "/starmoon";
        const char *auth_token = "<your-STARMOON_API_KEY-here>"; // generate your STARMOON_API_KEY in your starmoon account settings page
        ```

-   **Step 3**: Build the firmware

    -   Click `Build` button in the PlatformIO toolbar or run the build task.

-   **Step 4**: Upload the firmware to the device
    -   Connect your ESP32-S3 to your computer using usb.
    -   Click the `Upload` button to run the upload task, or `Upload and Monitor` button to run the upload task and monitor the device.
-   **Step 5**: Hardware usage

    -   Power the device -> Use your phone/tablet/pc to connect "Starmoon device" WiFi and follow the instructions to set up internet connection (only support 2.4Ghz WiFi).
    -   Once the software and firmware are set up, you can push the button to power on the ESP32 device and start talking to the device.

        <!-- -   The LED indicates the current status:
            -   Off: Not connected
            -   Solid On: Connected and listening on microphone
            -   Pulsing: Streaming audio output (receiving from server) -->

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
