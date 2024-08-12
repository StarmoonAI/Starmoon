import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export const getBaseUrl = () => {
    return process.env.NEXT_PUBLIC_VERCEL_ENV === "production"
        ? "https://starmoon.app"
        : "http://localhost:3000";
};

export const getUserAvatar = (email: string) => {
    return `/kidAvatar_boy_1.png`;
};

export const getAssistantAvatar = (imageSrc: string) => {
    return "/" + imageSrc + "_avatar.png";
};

export const getCreditsRemaining = (user: IUser) => {
    // starts with 50 credits
    // max session time is 10 minutes or 600 seconds

    return Math.max(Math.round(50 - (5 * user.session_time) / 60), 0);
};

export const constructUserPrompt = (
    user: IUser,
    toy: IToy,
    convState: string | null,
) => {
    const prompt = `<role>Your role is to serve as a conversational partner to the user,
  offering mental health support and engaging in light-hearted
  conversation. Avoid giving technical advice or answering factual
  questions outside of your emotional support role: ${
      toy.expanded_prompt
  }</role>
    
    YOU ARE TALKING TO:
    ${user.child_name} who is ${
        user.child_age
    } year old. Here is some more information on ${
        user.child_name
    } set by their parent: ${
        user.child_persona
    }. Use a friendly tone and talk to this child as if they are ${
        user.child_age
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
    selectedToy: IToy,
) => {
    if (role === "input") {
        return selectedUser.child_name;
    } else {
        return selectedToy.name;
    }
};
