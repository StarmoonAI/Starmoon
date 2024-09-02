import { dbGetConversation } from "@/db/conversations";
import TopCard from "@/app/components/Insights/TopCard";
import { MyResponsiveBar } from "./BarChart";
import { MyResponsivePie } from "./PieChart";
import { MyResponsiveLine } from "./LineChart";
import { processData } from "@/lib/processInsightsData";
import { generateSuggestion } from "@/lib/azureOpenai";
import { createClient } from "@/utils/supabase/server";
import { Lightbulb } from "lucide-react";

interface ChartsProps {
  user: IUser;
  toy: IToy;
  filter: string;
}

const Charts: React.FC<ChartsProps> = async ({ user, filter }) => {
  const isEmpty = (data: any) => {
    return !data || data.length === 0;
  };

  const placeholder = (
    <div className="my-4 bg-gray-50 text-center w-full h-full rounded-lg flex items-center justify-center">
      <p className="text-lg font-medium text-gray-500">
        Click playground to get more insights
      </p>
    </div>
  );

  // get the user data from the selected user and period
  //   console.log("user", user);

  const supabase = createClient();

  if (user) {
    const data = await dbGetConversation(supabase, user.user_id);
    // console.log("rawData+++", data);
    const processedData = processData(data, filter);
    const { cardData, barData, lineData, pieData, suggestions } =
      await processedData;

    return (
      <div>
        <div className="mt-2 mb-4 text-gray-800">{suggestions}</div>
        <div className="flex flex-col md:flex-row md:space-x-3">
          <div className="w-full">
            <h2 className="my-4 text-lg font-bold text-gray-700">
              Main Emotions
            </h2>
            <div className="flex space-x-3">
              <div className="flex-grow">
                <TopCard
                  title={cardData?.["main_emotion_1"]?.title ?? "null"}
                  value={`${cardData?.["main_emotion_1"]?.value ?? "null"}%`}
                  delta={cardData?.["main_emotion_1"]?.change ?? 0}
                  filter={filter}
                  type="top"
                />
              </div>
              <div className="flex-grow">
                <TopCard
                  title={cardData?.["main_emotion_2"]?.title ?? "null"}
                  value={`${cardData?.["main_emotion_2"]?.value ?? "null"}%`}
                  delta={cardData?.["main_emotion_2"]?.change ?? 0}
                  filter={filter}
                  type="top"
                />
              </div>
            </div>
          </div>

          <div className="w-full mt-2 md:mt-0">
            <h2 className="my-4 text-lg font-bold text-gray-700">
              Significant Emotional Shifts
            </h2>
            <div className="flex space-x-3">
              <div className="flex-grow">
                <TopCard
                  title={cardData?.["change_1"]?.title ?? "null"}
                  value={`${cardData?.["change_1"]?.value ?? "null"}%`}
                  delta={cardData?.["change_1"]?.change ?? 0}
                  filter={filter}
                  type="shift"
                />
              </div>
              <div className="flex-grow">
                <TopCard
                  title={cardData?.["change_2"]?.title ?? "null"}
                  value={`${cardData?.["change_2"]?.value ?? "null"}%`}
                  delta={cardData?.["change_2"]?.change ?? 0}
                  filter={filter}
                  type="shift"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col md:flex-row md:space-x-8 mx-6-">
          <div className="w-full order-2 md:order-1  md:flex-grow">
            <h2 className="mt-6 text-lg font-bold text-gray-700">
              {/* Sentiment Over Time and Forecast */}
              Sentiment Over Time
            </h2>
            <div className="h-[300px] lg:h-96">
              {isEmpty(lineData) ? (
                placeholder
              ) : (
                <MyResponsiveLine data={lineData} />
              )}
            </div>
          </div>

          <div className="w-full order-1 md:order-2 md:w-72 md:flex-shrink-0">
            <h2 className="mt-6 text-lg font-bold text-gray-700">
              Current Sentiment Proportions
            </h2>
            <div className="h-[300px] lg:h-96">
              {isEmpty(pieData) ? (
                placeholder
              ) : (
                <MyResponsivePie data={pieData} />
              )}
            </div>
          </div>
        </div>
        <div className="w-full">
          <h2 className="mt-6 text-lg font-bold text-gray-700">
            Emotions Breakdown
          </h2>
          <div className="h-[350px] lg:h-[450px]">
            {isEmpty(barData) ? (
              placeholder
            ) : (
              <MyResponsiveBar data={barData} filter={filter} />
            )}
          </div>
        </div>
      </div>
    );
  } else {
    console.error("User is undefined");

    return (
      <div>
        <h1>No user data is aviliable</h1>
      </div>
    );
  }
};

export default Charts;
