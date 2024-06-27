const { AzureOpenAI } = require("openai");

// Load the .env file if it exists
const dotenv = require("dotenv");
dotenv.config();

export const generateSuggestion = async (
    cardData: string,
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
    console.log("cardData", cardData);

    const client = new AzureOpenAI({
        endpoint,
        apiKey,
        apiVersion,
        deployment,
    });
    const result = await client.chat.completions.create({
        messages: [
            {
                role: "system",
                content: `You are an assistant who helps parents provide insight based on children's emotional data.`,
            },
            {
                role: "user",
                content: `Please provide a 50-word of suggestion of the below data:

        Main Emotions & Significant Emotional Shifts with today and yesterday data:\n
        ${cardData}

        Sentiment Over Time:
        ${lineData}

        Current Sentiment Proportions
        ${pieData}
        
        Current top 10 Emotions Breakdown 
        ${barData}`,
            },
        ],
    });

    return result.choices[0].message.content;
};
