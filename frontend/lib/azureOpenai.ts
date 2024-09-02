const { AzureOpenAI } = require("openai");

// Load the .env file if it exists
const dotenv = require("dotenv");
dotenv.config();

export const generateSuggestion = async (
    cardData: CardData | null,
    barData: BarData[],
    lineData: LineData[],
    pieData: PieData[],
): Promise<string | undefined> => {
    // You will need to set these environment variables or edit the following values
    const endpoint = process.env["AZURE_OPENAI_ENDPOINT"];
    const apiKey = process.env["AZURE_OPENAI_API_KEY"];
    const apiVersion = "2024-02-01"; //"2024-02-01"
    const deployment = process.env["LLM_MODEL_NAME"] || "gpt-4o";

    // convert cardData to string
    // console.log("cardData", cardData);

    //   if cardData is null
    if (
        cardData === null &&
        barData.length === 0 &&
        lineData.length === 0 &&
        pieData.length === 0
    ) {
        return "Please talk to one of our plush in playground to get insights.";
    }

    const cardDataString = JSON.stringify(cardData);
    const barDatatring = JSON.stringify(barData);
    const lineDataString = JSON.stringify(lineData);
    const pieDataString = JSON.stringify(pieData);

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
        ${cardDataString}

        Sentiment Over Time:
        ${lineDataString}

        Current Sentiment Proportions
        ${pieDataString}
        
        Current Emotions Breakdown 
        ${barDatatring}`,
            },
        ],
    });

    return result.choices[0].message.content;
};
