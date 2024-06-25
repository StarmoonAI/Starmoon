const { AzureOpenAI } = require("openai");

// Load the .env file if it exists
const dotenv = require("dotenv");
dotenv.config();

export const generateSuggestion = async (
  cardData: any,
  barData: any,
  lineData: any,
  pieData: any
) => {
  // You will need to set these environment variables or edit the following values
  const endpoint = process.env["AZURE_OPENAI_ENDPOINT"];
  const apiKey = process.env["AZURE_OPENAI_API_KEY"];
  const apiVersion = "2024-02-01"; //"2024-02-01"
  const deployment = process.env["MODEL_NAME"] || "gpt-4o";

  // convert cardData to string

  const client = new AzureOpenAI({
    endpoint,
    apiKey,
    apiVersion,
    deployment,
  });
  const result = await client.chat.completions.create({
    messages: [
      { role: "system", content: `You are a helpful assistant.` },
      {
        role: "user",
        content: `Please tell me a 50-word story of ${cardData}`,
      },
    ],
    model: "",
  });

  return result.choices[0].message.content;
};
