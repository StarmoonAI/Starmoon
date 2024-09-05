# Starmoon, your low-cost physical empathic AI companion

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

123

## 2. Key features 🎯

Low-cost
Voice-enabled emotional intelligence
Open-source

## 3. Getting Started 🚀

123

### 3.0 Prerequisites 📋

Docker installed in your machine

Hardware list (direct link to buy):
1
2

Tokens:
1 Supabase
2 Qdrant
3 OpenAI
4 deepgram
5 Azure speech
6 huggingface

  make sure localhost ports 8000, 3000, 6379, 5555 are not used.

### 3.1 Software setup 🖥️

- **Step 2**: Supabase setup

  please follow the instructions

- **Step 2**: Clone the repository:

  ```bash
  git clone https://github.com/StarmoonAI/Starmoon.git && cd starmoon
  ```

- **Step 3**: Copy the `.env.example` files

  ```bash
  cp .env.example .env
  ```

- **Step 4**: Update the `.env` files

  ```bash
  vim .env # or emacs or vscode or nano
  ```

  Update **OPENAI_API_KEY** in the `.env` file.

  You just need to update the `OPENAI_API_KEY` variable in the `.env` file. You can get your API key [here](https://platform.openai.com/api-keys). You need to create an account first. And put your credit card information. Don't worry, you won't be charged unless you use the API. You can find more information about the pricing [here](https://openai.com/pricing/).

- **Step 5**: Launch the project

  ```bash
  cd ../
  docker compose pull
  docker compose up
  ```

  If you have a Mac, go to Docker Desktop > Settings > General and check that the "file sharing implementation" is set to `VirtioFS`.

  If you are a **developer**, you can run the project in development mode with the following command: `docker compose -f docker-compose.yml up --build`

- **Step 5**: Login to the app

  You can now sign in to the app with `admin@starmoon.app` & `admin`. You can access the app at [http://localhost:3000/login](http://localhost:3000/login).

  You can access Quivr backend API at [http://localhost:5050/docs](http://localhost:5050/docs)

  You can access supabase at [http://localhost:54323](http://localhost:54323)

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
