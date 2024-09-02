// types/type.d.ts

declare global {
    interface IInbound {
        inbound_id?: string;
        name: string;
        email: string;
        type: "demo" | "preorder";
    }
    interface IUser {
        user_id: string;
        avatar_url: string;
        supervisor_name: string;
        email: string;
        supervisee_name: string;
        supervisee_persona: string;
        supervisee_age: number;
        toy_id: string;
        toy?: IToy;
        modules: Module[];
        most_recent_chat_group_id: string | null;
        session_time: number;
    }

    interface IConversation {
        conversation_id?: string;
        toy_id: string;
        user_id: string;
        role: string;
        content: string;
        metadata: any;
        chat_group_id: string;
        is_sensitive: boolean;
        emotion_model: string;
    }

    interface IToy {
        toy_id: string;
        name: string;
        hume_ai_config_id: string;
        prompt: string;
        third_person_prompt: string;
        expanded_prompt: string;
        image_src?: string;
    }

    interface InsightsConversation {
        conversation_id?: string;
        created_at: string;
        toy_id: string;
        user_id: string;
        role: string;
        content: string;
        metadata: any;
        chat_group_id: string;
    }

    type Module = "math" | "science" | "spelling" | "general_trivia";

    type PieChartData = {
        id: string;
        label: string;
        value: number | null;
    };

    interface DataPoint {
        x: string;
        y: number;
    }

    interface HeatMapData {
        id: string;
        data: DataPoint[];
    }

    interface LineChartData {
        id: any;
        name: string;
        data: any;
    }

    interface ProcessedData {
        cardData: CardData | null;
        barData: BarData[];
        lineData: LineData[];
        pieData: PieData[];
        suggestions: string | undefined;
    }

    interface CardData {
        [key: string]: {
            title: string;
            value: number;
            change: number | null;
        };
    }

    interface BarData {
        emotion: string;
        [key: string]: number | string;
    }

    interface LineData {
        id: string;
        name: string;
        data: { x: string; y: number | null }[];
    }

    interface PieData {
        id: string;
        label: string;
        value: number | null;
    }

    interface PlaygroundProps {
        selectedUser: IUser;
        selectedToy: IToy;
        accessToken: string;
    }

    interface LastJsonMessageType {
        type: string;
        audio_data: string | null;
        text_data: string | null;
        boundary: string | null;
        task_id: string;
    }

    export interface MessageHistoryType {
        type: string;
        text_data: string | null;
        task_id: string;
    }
}

export {}; // This is necessary to make this file a module and avoid TypeScript errors.
