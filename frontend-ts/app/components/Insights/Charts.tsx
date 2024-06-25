import { dbGetConversation } from "@/db/conversations";
import supabaseServerClient from "@/db/supabaseServerClient";
import TopCard from "@/app/components/Insights/TopCard";
import { MyResponsiveBar } from "./BarChart";
import { MyResponsivePie } from "./PieChart";
import { MyResponsiveLine } from "./LineChart";
import { processData } from "@/lib/processInsightsData";

// export const pieData: PieChartData[] = [
//     {
//         id: "Positive",
//         label: "Positive",
//         value: 60.0,
//     },
//     {
//         id: "Neutral",
//         label: "Neutral",
//         value: 15.5,
//     },
//     {
//         id: "Negative",
//         label: "Negative",
//         value: 24.5,
//     },
// ];

// const lineData = [
//     {
//         id: "Negative",
//         name: "Negative",
//         data: [
//             {
//                 x: 0,
//                 y: 8,
//             },
//             {
//                 x: 1,
//                 y: 10,
//             },
//             {
//                 x: 2,
//                 y: 11,
//             },
//             {
//                 x: 3,
//                 y: 9,
//             },
//             {
//                 x: 4,
//                 y: 6,
//             },
//             {
//                 x: 5,
//                 y: 10,
//             },
//             {
//                 x: 6,
//                 y: 12,
//             },
//         ],
//     },
//     {
//         id: "Neg-P",
//         name: "Negative-Prediction",
//         data: [
//             {
//                 x: 6,
//                 y: 12,
//             },
//             {
//                 x: 7,
//                 y: 13,
//             },
//             {
//                 x: 8,
//                 y: 9,
//             },
//         ],
//     },
//     {
//         id: "Neutral",
//         name: "Neutral",
//         data: [
//             {
//                 x: 0,
//                 y: 9,
//             },
//             {
//                 x: 1,
//                 y: 10,
//             },
//             {
//                 x: 2,
//                 y: 12,
//             },
//             {
//                 x: 3,
//                 y: 10,
//             },
//             {
//                 x: 4,
//                 y: 12,
//             },
//             {
//                 x: 5,
//                 y: 15,
//             },
//             {
//                 x: 6,
//                 y: 13,
//             },
//         ],
//     },
//     {
//         id: "Neu-P",
//         name: "Neutral-Prediction",
//         data: [
//             {
//                 x: 6,
//                 y: 13,
//             },
//             {
//                 x: 7,
//                 y: 9,
//             },
//             {
//                 x: 8,
//                 y: 12,
//             },
//         ],
//     },
//     {
//         id: "Postive",
//         name: "Postive",
//         data: [
//             {
//                 x: 0,
//                 y: 10,
//             },
//             {
//                 x: 1,
//                 y: 12,
//             },
//             {
//                 x: 2,
//                 y: 13,
//             },
//             {
//                 x: 3,
//                 y: 12,
//             },
//             {
//                 x: 4,
//                 y: 16,
//             },
//             {
//                 x: 5,
//                 y: 14,
//             },
//             {
//                 x: 6,
//                 y: 17,
//             },
//         ],
//     },
//     {
//         id: "Pos-P",
//         name: "Postive-Prediction",
//         data: [
//             {
//                 x: 6,
//                 y: 17,
//             },
//             {
//                 x: 7,
//                 y: 16,
//             },
//             {
//                 x: 8,
//                 y: 17,
//             },
//         ],
//     },
// ];

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

    const supabase = supabaseServerClient();

    if (user) {
        const data = await dbGetConversation(supabase, user.user_id);
        const processedData = processData(data, filter);
        const { cardData, barData, lineData, pieData } = processedData;

        return (
            <div>
                <div className="flex flex-col md:flex-row md:space-x-3">
                    <div className="w-full">
                        <h2 className="my-4 text-lg font-bold text-gray-700">
                            Main Emotions
                        </h2>

                        <div className="flex space-x-3">
                            <div className="flex-grow">
                                <TopCard
                                    title={
                                        cardData.get("main_1")?.title ?? null
                                    }
                                    value={`${
                                        cardData.get("main_1")?.value ?? ""
                                    }%`}
                                    delta={cardData.get("main_1")?.change ?? 0}
                                    filter={filter}
                                    type="top"
                                />
                            </div>
                            <div className="flex-grow">
                                <TopCard
                                    title={
                                        cardData.get("main_2")?.title ?? null
                                    }
                                    value={`${
                                        cardData.get("main_2")?.value ?? ""
                                    }%`}
                                    delta={cardData.get("main_2")?.change ?? 0}
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
                                    title={
                                        cardData.get("change_1")?.title ?? null
                                    }
                                    value={`${
                                        cardData.get("change_1")?.value ?? ""
                                    }%`}
                                    delta={
                                        cardData.get("change_1")?.change ?? 0
                                    }
                                    filter={filter}
                                    type="shift"
                                />
                            </div>
                            <div className="flex-grow">
                                <TopCard
                                    title={
                                        cardData.get("change_2")?.title ?? null
                                    }
                                    value={`${
                                        cardData.get("change_2")?.value ?? ""
                                    }%`}
                                    delta={
                                        cardData.get("change_2")?.change ?? 0
                                    }
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
                        Top 10 Emotions Breakdown (sheet)
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
