"use client";

import Image1 from "@/public/images/image1.png";
import Image2 from "@/public/images/image2.png";
import Illustration from "@/public/usecase_section.svg";

import Usecase from "./Usecase";
import TopCard from "./Insights/TopCard";
import { MyResponsiveLine } from "./Insights/LineChart";
import { MyResponsivePie } from "./Insights/PieChart";
import { MyResponsiveBar } from "./Insights/BarChart";

const suggestions =
  "Based on the recent data, maintaining a neutral emotional state is predominant. Although there is a slight emergence of negative emotions like disgust, sadness, and anger, they are balanced by an equal presence of joy and surprise. Encourage positive interactions and activities to enhance the joy and neutral emotions further.";

const cardData = {
  main_emotion_1: { title: "joy", value: 28.8, change: 28 },
  main_emotion_2: { title: "suprise", value: 19.2, change: -12 },
  change_1: { title: "anger", value: 12.1, change: 69 },
  change_2: { title: "fear", value: 5.9, change: -52 },
};

const barData = [
  { emotion: "surprise", Today: 0.28, Yesterday: 0.25 },
  { emotion: "joy", Today: 0.13, Yesterday: 0.22 },
  { emotion: "sadness", Today: 0.12, Yesterday: 0.18 },
  { emotion: "anger", Today: 0.12, Yesterday: 0.12 },
  { emotion: "neutral", Today: 0.12, Yesterday: 0.1 },
  { emotion: "fear", Today: 0.12, Yesterday: 0.1 },
  { emotion: "disgust", Today: 0.12, Yesterday: 0.09 },
];

const lineData = [
  {
    id: "Negative",
    name: "Negative",
    data: [
      { x: "2024-09-4", y: 0.23122093090355336 },
      { x: "2024-09-5", y: 0.21122093090355345 },
      { x: "2024-09-6", y: 0.13122093090355345 },
      { x: "2024-09-7", y: 0.18122093090355345 },
      { x: "2024-09-8", y: 0.43122093090355345 },
      { x: "2024-09-9", y: 0.23122093090355345 },
      { x: "2024-09-10", y: 0.13122093090355345 },
    ],
  },
  {
    id: "Neutral",
    name: "Neutral",
    data: [
      { x: "2024-09-4", y: 0.2433541552767576 },
      { x: "2024-09-5", y: 0.1433541552767577 },
      { x: "2024-09-6", y: 0.11122093090355345 },
      { x: "2024-09-7", y: 0.20122093090355345 },
      { x: "2024-09-8", y: 0.23122093090355345 },
      { x: "2024-09-9", y: 0.20122093090355345 },
      { x: "2024-09-10", y: 0.23122093090355345 },
    ],
  },
  {
    id: "Positive",
    name: "Positive",
    data: [
      { x: "2024-09-4", y: 0.3233541552767576 },
      { x: "2024-09-5", y: 0.2433541552767577 },
      { x: "2024-09-6", y: 0.23122093090355345 },
      { x: "2024-09-7", y: 0.23122093090355345 },
      { x: "2024-09-8", y: 0.13122093090355345 },
      { x: "2024-09-9", y: 0.28122093090355345 },
      { x: "2024-09-10", y: 0.33122093090355345 },
    ],
  },
];

const pieData = [
  { id: "Positive", label: "Positive", value: 0.23 },
  { id: "Neutral", label: "Neutral", value: 0.54 },
  { id: "Negative", label: "Negative", value: 0.23 },
];

export default function InsightsDemo() {
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

  return (
    <div className="">
      {/* <div className="text-3xl font-medium mb-8 text-gray-800">Insights</div>
      <div className="mt-2 mb-4 text-gray-800">{suggestions}</div> */}
      <div className="flex flex-col md:flex-row md:space-x-3">
        <div className="w-full">
          <h2 className="mb-4 text-lg font-bold text-gray-700">
            Today Main Emotions
          </h2>
          <div className="flex space-x-3">
            <div className="flex-grow">
              <TopCard
                title={cardData?.["main_emotion_1"]?.title ?? "null"}
                value={`${cardData?.["main_emotion_1"]?.value ?? "null"}%`}
                delta={cardData?.["main_emotion_1"]?.change ?? 0}
                filter={"days"}
                type="top"
              />
            </div>
            <div className="flex-grow">
              <TopCard
                title={cardData?.["main_emotion_2"]?.title ?? "null"}
                value={`${cardData?.["main_emotion_2"]?.value ?? "null"}%`}
                delta={cardData?.["main_emotion_2"]?.change ?? 0}
                filter={"days"}
                type="top"
              />
            </div>
          </div>
        </div>

        <div className="w-full mt-2 md:mt-0">
          <h2 className="mb-4 text-lg font-bold text-gray-700">
            Significant Emotional Shifts
          </h2>
          <div className="flex space-x-3">
            <div className="flex-grow">
              <TopCard
                title={cardData?.["change_1"]?.title ?? "null"}
                value={`${cardData?.["change_1"]?.value ?? "null"}%`}
                delta={cardData?.["change_1"]?.change ?? 0}
                filter={"days"}
                type="shift"
              />
            </div>
            <div className="flex-grow">
              <TopCard
                title={cardData?.["change_2"]?.title ?? "null"}
                value={`${cardData?.["change_2"]?.value ?? "null"}%`}
                delta={cardData?.["change_2"]?.change ?? 0}
                filter={"days"}
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
            Today Sentiment Proportions
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
      {/* <div className="w-full">
        <h2 className="mt-6 text-lg font-bold text-gray-700">
          Emotions Breakdown
        </h2>
        <div className="h-[350px] lg:h-[450px]">
          {isEmpty(barData) ? (
            placeholder
          ) : (
            <MyResponsiveBar data={barData} filter={"days"} />
          )}
        </div>
      </div> */}
    </div>
  );
}