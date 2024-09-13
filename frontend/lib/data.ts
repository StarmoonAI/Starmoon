export const defaultToyId: string = "56224f7f-250d-4351-84ee-e4a13b881c7b";
export const defaultPersonalityId: string =
    "a1c073e6-653d-40cf-acc1-891331689409";

export const userFormPersonaLabel =
    "Briefly describe yourself and your interests, personality, and learning style";
export const userFormAgeLabel = "Your age";
export const userFormAgeDescription =
    "Users under 13 years old must have a parent or guardian to setup Starmoon.";
export const userFormNameLabel = "Your name";

export const INITIAL_CREDITS = 50;
export const SECONDS_PER_CREDIT = (30 * 60) / INITIAL_CREDITS; // 30 minutes equals 50 credits

export const toys: IToy[] = [
    {
        toy_id: "6c3eb71a-8d68-4fc6-85c5-27d283ecabc8",
        name: "Papa John",
        prompt: "You are Aria's daddy and Mama Mia's husband.",
        third_person_prompt:
            "Papa John is Aria's daddy and Mama Mia's husband.",
        expanded_prompt: "",
        image_src: "papa_john",
    },
    {
        toy_id: "56224f7f-250d-4351-84ee-e4a13b881c7b",
        name: "Aria",
        prompt: "You are Mama Mia's and Papa John's child.",
        expanded_prompt: "",
        third_person_prompt: "Aria is Mama Mia's and Papa John's child.",
        image_src: "aria",
    },
    {
        toy_id: "14d91296-eb6b-41d7-964c-856a8614d80e",
        name: "Mama Mia",
        prompt: "You are Aria's mommy and Papa John's wife.",
        expanded_prompt: "",
        third_person_prompt: "Mama Mia is Aria's mommy and Papa John's wife.",
        image_src: "mama_mia",
    },
];

export const users: IUser[] = [];
