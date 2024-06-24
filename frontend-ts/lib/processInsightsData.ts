import { startOfDay, subDays, endOfDay } from "date-fns";

export const positiveEmotions = [
    "Admiration",
    "Adoration",
    "Aesthetic Appreciation",
    "Amusement",
    "Awe",
    "Calmness",
    "Contentment",
    "Craving",
    "Desire",
    "Determination",
    "Ecstasy",
    "Excitement",
    "Interest",
    "Joy",
    "Love",
    "Nostalgia",
    "Pride",
    "Realization",
    "Relief",
    "Romance",
    "Satisfaction",
    "Surprise (positive)",
    "Triumph",
];

export const negativeEmotions = [
    "Anger",
    "Anxiety",
    "Contempt",
    "Disappointment",
    "Disgust",
    "Distress",
    "Embarrassment",
    "Empathic Pain",
    "Envy",
    "Fear",
    "Guilt",
    "Horror",
    "Pain",
    "Sadness",
    "Shame",
    "Surprise (negative)",
    "Tiredness",
];

export const neutralEmotions = [
    "Awkwardness",
    "Boredom",
    "Concentration",
    "Confusion",
    "Contemplation",
    "Doubt",
    "Entrancement",
    "Sympathy",
];

export const processData = (rawData: any[], filter: string) => {
    // Perform your heavy computations here

    let currentPeriod = new Date();
    let previousPeriod = subDays(currentPeriod, 1);

    const previousPeriodData = filterDataByDate(rawData, previousPeriod);
    const currentPeriodData = filterDataByDate(rawData, currentPeriod);
    // console.log(previousPeriodData);

    const { prevAvgSorted, curAvgSorted } = getSortedAvgData(
        previousPeriodData,
        currentPeriodData,
        2,
    );

    // console.log(curAvgSorted);
    // console.log(prevAvgSorted);

    const cardData = getCardsData(prevAvgSorted, curAvgSorted);
    const barData = getBarData(prevAvgSorted, curAvgSorted, 10, filter);

    const { lineData, pieData } = getLinePinedata(rawData);
    // print lineData to json
    console.log(JSON.stringify(lineData));
    console.log(JSON.stringify(pieData));

    return {
        cardData,
        barData,
        lineData,
        pieData,
    };
};

const filterDataByDate = (data: any[], date: Date) => {
    const targetDate = startOfDay(date);
    // const targetDate = subDays(targetDate_, 1);

    return data.filter((item) => {
        const createdAt = new Date(item.created_at);
        const createdDate = startOfDay(createdAt);
        return (
            createdDate.getTime() === targetDate.getTime() &&
            item.role === "user"
        );
    });
};

const averages = (data: any[]) => {
    const scoresSum: { [key: string]: number } = {};
    const averages: { [key: string]: number } = {};

    data.forEach((item) => {
        if (item.metadata && item.metadata.scores) {
            for (const [key, value] of Object.entries(item.metadata.scores)) {
                if (scoresSum[key]) {
                    scoresSum[key] += value as number;
                } else {
                    scoresSum[key] = value as number;
                }
            }
        }
    });

    for (const [key, value] of Object.entries(scoresSum)) {
        averages[key] = value / data.length;
    }

    return scoresSum;
};

const getCardsData = (prevAvg: any, curAvg: any) => {
    const changes: { [key: string]: number } = {};

    const cardData = new Map<
        string,
        { title: string; value: number; change: number }
    >();

    for (const key of Object.keys(curAvg)) {
        if (prevAvg[key] !== undefined) {
            const change = ((curAvg[key] - prevAvg[key]) / prevAvg[key]) * 100;
            changes[key] = change;
        }
    }

    const changesSorted = Object.fromEntries(
        Object.entries(changes).sort(([, a], [, b]) => b - a),
    );

    const curAvgEntries = Object.entries(curAvg);
    const [firstCurAvg, secondCurAvg] = curAvgEntries;

    // Get the first and last k,v in changesSorted
    const changesEntries = Object.entries(changesSorted);

    if (changesEntries.length === 0) {
        return new Map();
    }

    let firstChange: [string, number];
    let lastChange: [string, number];

    if (changesEntries[0][1] < 0) {
        firstChange = changesEntries[changesEntries.length - 1];
        lastChange = changesEntries[changesEntries.length - 2];
    } else if (changesEntries[changesEntries.length - 1][1] > 0) {
        firstChange = changesEntries[0];
        lastChange = changesEntries[1];
    } else {
        firstChange = changesEntries[0];
        lastChange = changesEntries[changesEntries.length - 1];
    }

    cardData.set("main_1", {
        title: firstCurAvg[0],
        value: roundDecimal(firstCurAvg[1] as number),
        change: roundDecimal(changesSorted[firstCurAvg[0]]),
    });

    cardData.set("main_2", {
        title: secondCurAvg[0],
        value: roundDecimal(secondCurAvg[1] as number),
        change: roundDecimal(changesSorted[secondCurAvg[0]]),
    });

    cardData.set("change_1", {
        title: firstChange[0],
        value: roundDecimal(curAvg[firstChange[0]]),
        change: roundDecimal(firstChange[1]),
    });

    cardData.set("change_2", {
        title: lastChange[0],
        value: roundDecimal(curAvg[lastChange[0]]),
        change: roundDecimal(lastChange[1]),
    });

    return cardData;
};

const getBarData = (
    prevAvg: { [key: string]: number },
    curAvg: { [key: string]: number },
    topN: number,
    filter: string,
) => {
    // Get first N of curAvg data
    const curAvgEntries = Object.entries(curAvg);
    const curAvgTopN = curAvgEntries.slice(0, topN);

    // Determine the labels based on the filter
    let currentPeriodLabel = "Current Period";
    let previousPeriodLabel = "Previous Period";

    if (filter === "days") {
        currentPeriodLabel = "Today";
        previousPeriodLabel = "Yesterday";
    } else if (filter === "weeks") {
        currentPeriodLabel = "This month";
        previousPeriodLabel = "Last month";
    }

    // Map through curAvgTopN to create the desired schema
    const barData = curAvgTopN.map(([emotion, currentPeriodValue]) => {
        const prevPeriodValue =
            prevAvg[emotion] !== undefined ? prevAvg[emotion] : 0;
        return {
            emotion,
            [currentPeriodLabel]: roundDecimal(currentPeriodValue), // Ensure this is a number
            [previousPeriodLabel]: roundDecimal(prevPeriodValue), // Ensure this is a number
        };
    });

    return barData;
};

const getSortedAvgData = (prevData: any, curData: any, topN: number) => {
    const prevAvg = averages(prevData);
    const curAvg = averages(curData);

    const prevAvgSorted = Object.fromEntries(
        Object.entries(prevAvg).sort(([, a], [, b]) => b - a),
    );

    const curAvgSorted = Object.fromEntries(
        Object.entries(curAvg).sort(([, a], [, b]) => b - a),
    );

    return { prevAvgSorted, curAvgSorted };
};

const roundDecimal = function (num: number) {
    if (num > 100 || num < -100) {
        return Math.round(num);
    } else if (num > 10 || num < -10) {
        return Math.round(num * 10) / 10;
    } else {
        return Math.round(num * 100) / 100;
    }
};

export const getLinePinedata = (data: any) => {
    const dailyScores: {
        [date: string]: {
            positive: number[];
            negative: number[];
            neutral: number[];
        };
    } = {};
    let pieData: {
        id: string;
        label: string;
        value: number | null;
    }[] = [];

    // Loop through each item in the data array
    data.forEach((entry: any) => {
        const date = new Date(entry.created_at).toISOString().split("T")[0];
        if (!dailyScores[date]) {
            dailyScores[date] = { positive: [], negative: [], neutral: [] };
        }

        // Check if metadata and scores are not null
        if (entry.metadata && entry.metadata.scores) {
            Object.keys(entry.metadata.scores).forEach((emotion) => {
                const score = entry.metadata.scores![emotion];
                if (positiveEmotions.includes(emotion)) {
                    dailyScores[date].positive.push(score);
                } else if (negativeEmotions.includes(emotion)) {
                    dailyScores[date].negative.push(score);
                } else if (neutralEmotions.includes(emotion)) {
                    dailyScores[date].neutral.push(score);
                }
            });
        } else {
            dailyScores[date].positive.push(0);
            dailyScores[date].negative.push(0);
            dailyScores[date].neutral.push(0);
        }
    });

    const lineData: {
        id: string;
        name: string;
        data: { x: string; y: number | null }[];
    }[] = [
        { id: "Negative", name: "Negative", data: [] },
        // { id: "Neg-P", name: "Negative-Prediction", data: [] },
        { id: "Neutral", name: "Neutral", data: [] },
        // { id: "Neu-P", name: "Neutral-Prediction", data: [] },
        { id: "Positive", name: "Positive", data: [] },
        // { id: "Pos-P", name: "Positive-Prediction", data: [] },
    ];

    Object.keys(dailyScores).forEach((date) => {
        const positiveScores = dailyScores[date].positive;
        const negativeScores = dailyScores[date].negative;
        const neutralScores = dailyScores[date].neutral;

        const average = (arr: number[]) =>
            arr.reduce((a, b) => a + b, 0) / arr.length || 0;

        const positiveAverage = average(positiveScores);
        const negativeAverage = average(negativeScores);
        const neutralAverage = average(neutralScores);

        const totalSum = positiveAverage + negativeAverage + neutralAverage;

        const normalizedPositive = positiveAverage / totalSum || null;
        const normalizedNegative = negativeAverage / totalSum || null;
        const normalizedNeutral = neutralAverage / totalSum || null;

        lineData[0].data.push({ x: date, y: normalizedNegative });
        lineData[1].data.push({ x: date, y: normalizedPositive });
        lineData[2].data.push({ x: date, y: normalizedNeutral });
    });

    const idx = lineData[0].data.length - 1;

    pieData = [
        {
            id: "Positive",
            label: "Positive",
            value: roundDecimal(lineData[2].data[idx].y ?? 0), // Default to 0 if null
        },
        {
            id: "Neutral",
            label: "Neutral",
            value: roundDecimal(lineData[1].data[idx].y ?? 0), // Default to 0 if null
        },
        {
            id: "Negative",
            label: "Negative",
            value: roundDecimal(lineData[0].data[idx].y ?? 0), // Default to 0 if null
        },
    ];

    return { lineData, pieData };
};
function elif(arg0: boolean) {
    throw new Error("Function not implemented.");
}
