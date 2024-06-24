import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export const getBaseUrl = () => {
    return process.env.NEXT_PUBLIC_VERCEL_ENV === "production"
        ? "https://parakeetai.vercel.app"
        : "http://localhost:3000";
};

export const getCreditsRemaining = (user: IUser) => {
    // starts with 50 credits
    // max session time is 10 minutes or 600 seconds

    return Math.round(50 - (5 * user.session_time) / 60);
};

export const constructUserPrompt = (user: IUser, toy: IToy) => {
    return `YOU ARE: ${toy.expanded_prompt}
    
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

    YOUR TOPICS:
    You must be encouraging and foster a growth mindset in conversation. You must focus on these topics: ${(
        user?.modules ?? []
    ).join(", ")}.
    `;
};

export const getMessageRoleName = (
    role: string,
    selectedUser: IUser,
    selectedToy: IToy
) => {
    if (role === "user") {
        return selectedUser.child_name;
    } else {
        return selectedToy.name;
    }
};
