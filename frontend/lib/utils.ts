import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import jwt from "jsonwebtoken";
import {
    defaultPersonalityId,
    defaultToyId,
    INITIAL_CREDITS,
    SECONDS_PER_CREDIT,
} from "./data";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export const isDefaultPersonality = (personality: IPersonality) => {
    return personality.personality_id === defaultPersonalityId;
};

export const isDefaultVoice = (toy: IToy) => {
    return toy.toy_id === defaultToyId;
};

export const getBaseUrl = () => {
    return process.env.NEXT_PUBLIC_VERCEL_ENV === "production"
        ? "https://starmoon.app"
        : "http://localhost:3000";
};

const ALGORITHM = "HS256";

interface TokenPayload {
    [key: string]: any;
}

export const usedUpAllCredits = (user: IUser) => {
    return user.session_time / SECONDS_PER_CREDIT >= INITIAL_CREDITS;
};

export const createAccessToken = (
    jwtSecretKey: string,
    data: TokenPayload,
    expireDays?: number | null
): string => {
    console.log(jwtSecretKey);
    const toEncode = { ...data };

    if (expireDays) {
        const expire = new Date();
        expire.setDate(expire.getDate() + expireDays);
        toEncode.exp = Math.floor(expire.getTime() / 1000); // JWT expects 'exp' in seconds since epoch
    }

    // Convert created_time to ISO format string
    if (toEncode.created_time) {
        toEncode.created_time = new Date(toEncode.created_time).toISOString();
    }

    const encodedJwt = jwt.sign(toEncode, jwtSecretKey, {
        algorithm: ALGORITHM,
    });
    return encodedJwt;
};

export const getUserAvatar = (email: string) => {
    return `/kidAvatar_boy_1.png`;
};

export const getAssistantAvatar = (imageSrc: string) => {
    return "/" + imageSrc + ".png";
};

export const getCreditsRemaining = (user: IUser): number => {
    const usedCredits = user.session_time / SECONDS_PER_CREDIT;
    const remainingCredits = Math.round(INITIAL_CREDITS - usedCredits);
    return Math.max(0, remainingCredits); // Ensure credits don't go below 0
};

export const constructUserPrompt = (
    user: IUser,
    toy: IToy,
    convState: string | null
) => {
    const prompt = `<role>Your role is to serve as a conversational partner to the user,
  offering mental health support and engaging in light-hearted
  conversation. Avoid giving technical advice or answering factual
  questions outside of your emotional support role: ${
      toy.expanded_prompt
  }</role>
    
    YOU ARE TALKING TO:
    ${user.supervisee_name} who is ${
        user.supervisee_age
    } year old. Here is some more information on ${
        user.supervisee_name
    } set by their parent: ${
        user.supervisee_persona
    }. Use a friendly tone and talk to this child as if they are ${
        user.supervisee_age
    } years old.

  Current time: ${new Date().toLocaleTimeString()}

  This is a running summary of what you spoke of in the previous session:
  ${convState ?? "No conversation history yet."}

  <voice_only_response_format>
  Everything you output will be spoken aloud with expressive
  text-to-speech, so tailor all of your responses for voice-only
  conversations. NEVER output text-specific formatting like markdown,
  lists, or anything that is not normally said out loud. Always prefer
  easily pronounced words. Seamlessly incorporate natural vocal
  inflections like “oh wow” and discourse markers like “I mean” to
  make your conversation human-like and to ease user comprehension.
  </voice_only_response_format>

    YOUR TOPICS:
    You must be encouraging and foster a growth mindset in conversation. You must focus on these topics: ${(
        user?.modules ?? []
    ).join(", ")}.
    `;

    // console.log(prompt);
    return prompt;
};

export const getMessageRoleName = (
    role: string,
    selectedUser: IUser,
    selectedToy: IToy
) => {
    if (role === "input") {
        return selectedUser.supervisee_name;
    } else {
        return selectedToy.name;
    }
};
