# Starmoon, the low-cost empathic AI device

<div align="center">
    <img src="./logo.png" alt="Starmoon-logo" width="20%"  style="border-radius: 50%; padding-bottom: 20px"/>


<!-- [![Discord Follow](https://dcbadge.vercel.app/api/server/HUpRgp2HG8?style=flat)](https://discord.gg/HUpRgp2HG8) -->
[![License: GPLv3](https://img.shields.io/badge/license-GPLv3-blue)](https://www.gnu.org/licenses/gpl-3.0.en.html)&ensp;&ensp;&ensp;
<!-- [![GitHub Repo stars](https://img.shields.io/github/stars/quivrhq/quivr?style=social)](https://github.com/quivrhq/quivr) -->
<!-- [![Twitter Follow](https://img.shields.io/twitter/follow/StanGirard?style=social)](https://twitter.com/_StanGirard) -->

</div>

What is Starmoon AI in 1 sentence.
Usecases: 1, 2, 3

[Check our Roadmap](www.starmoon.ai)
<!-- custom voice clone, RAG, agent -->

## 1. Demo Highlights 🎥

Video

## 2. Key features 🎯

Low-cost
Voice-enabled emotional intelligence
Open-source
Small size (as small as the Apple Watch)

## 3. Getting Started 🚀

123

### 3.0 Prerequisites 📋

1. Docker installed in your machine
   - Make sure localhost ports 8000, 3000, 6379, 5555 are not used

2. Supabase CLI
   - Follow the instructions here to install the Supabase CLI Follow the instructions here to install the Supabase CLI if you haven't installed
  
3. Vscode and PlatformIO plugin installed in your machine

4. API keys:
   - Supabase: For database
   - OpenAI: For AI language models
   - Deepgram API key: For speech-to-text
   - Azure speech API key: For text-to-speech
   - Huggingface: For emotion recognition

5. Hardware list (not sponsored):
   - Seeed Studio Xiao ESP32-C6
   - Microphone (model)
   - Amplifier (model)
   - Speaker (model)
   - PCB prototype board (link)
   - 28 AWG wires + soldering toolset

### 3.1 Software setup 🖥️

- **Step 1**: Clone the repository:

  ```bash
  git clone https://github.com/StarmoonAI/Starmoon.git && cd starmoon
  ```

- **Step 2**: Copy the `.env.example` files

  ```bash
  cp .env.example .env
  ```

- **Step 3**: Update the `.env` files

  ```bash
  vim .env # or emacs or vscode or nano
  ```

  Update **OPENAI_API_KEY** in the `.env` file.

- **Step 4**: Launch the project

  ```bash
  cd ../
  docker compose pull
  docker compose up
  ```

  If you have a Mac, go to Docker Desktop > Settings > General and check that the "file sharing implementation" is set to `VirtioFS`.

  If you are a **developer**, you can run the project in development mode with the following command: `docker compose -f docker-compose.yml up --build`

- **Step 5**: Login to the app

  - You can now sign in to the app with `admin@quivr.app` & `admin`. You can access the Starmoon webapp at [http://localhost:3000/login](http://localhost:3000/login) and sign up an account

  - You can access Starmoon backend API at [http://localhost:8000/docs](http://localhost:8000/docs)

  - You can access Supabase dashboard at [http://localhost:54323](http://localhost:54323)
  
  - You can access Celery Flower background task dashboard at [http://localhost:5555](http://localhost:5555) (`admin@quivr.app` & `admin`)

### 3.2 Hardware setup 🧰

- **Step 0**: Install PlatformIO in VSCode

  Follow the instructions [here](https://platformio.org/install/cli) to install PlatformIO that is required.

  ```bash
  platformio --version # Check that the installation worked
  ```

## 4. 3rd Party Integrations

123

## 5. License

123
