"use server";

import { encodedRedirect } from "@/utils/utils";
import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createAccessToken } from "@/lib/utils";
import { addUserToDevice, dbCheckUserCode } from "@/db/devices";

export const signUpAction = async (formData: FormData) => {
    const email = formData.get("email")?.toString();
    const password = formData.get("password")?.toString();
    const supabase = createClient();
    const origin = headers().get("origin");

    if (!email || !password) {
        return { error: "Email and password are required" };
    }

    const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            emailRedirectTo: `${origin}/auth/callback`,
        },
    });

    if (error) {
        console.error(error.code + " " + error.message);
        return encodedRedirect("error", "/login", error.message);
    } else {
        return encodedRedirect(
            "success",
            "/login",
            "Thanks for signing up! Please check your email for a verification link."
        );
    }
};

export const signInAction = async (formData: FormData) => {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        return encodedRedirect("error", "/login", error.message);
    }

    return redirect("/home");
};

export const forgotPasswordAction = async (formData: FormData) => {
    const email = formData.get("email")?.toString();
    const supabase = createClient();
    const origin = headers().get("origin");
    const callbackUrl = formData.get("callbackUrl")?.toString();

    if (!email) {
        return encodedRedirect(
            "error",
            "/forgot-password",
            "Email is required"
        );
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/auth/callback?redirect_to=/protected/reset-password`,
    });

    if (error) {
        console.error(error.message);
        return encodedRedirect(
            "error",
            "/forgot-password",
            "Could not reset password"
        );
    }

    if (callbackUrl) {
        return redirect(callbackUrl);
    }

    return encodedRedirect(
        "success",
        "/forgot-password",
        "Check your email for a link to reset your password."
    );
};

export const resetPasswordAction = async (formData: FormData) => {
    const supabase = createClient();

    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (!password || !confirmPassword) {
        encodedRedirect(
            "error",
            "/protected/reset-password",
            "Password and confirm password are required"
        );
    }

    if (password !== confirmPassword) {
        encodedRedirect(
            "error",
            "/protected/reset-password",
            "Passwords do not match"
        );
    }

    const { error } = await supabase.auth.updateUser({
        password: password,
    });

    if (error) {
        encodedRedirect(
            "error",
            "/protected/reset-password",
            "Password update failed"
        );
    }

    encodedRedirect("success", "/protected/reset-password", "Password updated");
};

export const signOutAction = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    return redirect("/login");
};

export const checkDoctorAction = async (authCode: string) => {
    return authCode === "kiwi-subtle-emu";
};

export const generateStarmoonAuthKey = async (user: IUser) => {
    return createAccessToken(process.env.JWT_SECRET_KEY!, {
        user_id: user.user_id,
        email: user.email,
    });
};

export const connectUserToDevice = async (
    userId: string,
    userDeviceCode: string
) => {
    const supabase = createClient();

    const isCodeValid = await dbCheckUserCode(supabase, userDeviceCode.trim());
    if (!isCodeValid) {
        return false;
    }

    // if user code is valid, add user to device
    const successfullyAdded = await addUserToDevice(
        supabase,
        userDeviceCode,
        userId
    );
    return successfullyAdded;
};
