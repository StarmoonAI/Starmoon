"use client";

import { FaGoogle } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { loginWithGoogle } from "@/app/components/GoogleAuth";

interface GoogleLoginButtonProps {
  toy_id?: string;
}

export default function GoogleLoginButton({ toy_id }: GoogleLoginButtonProps) {
  console.log("1324355345435", toy_id);
  return (
    <Button variant="default" onClick={() => loginWithGoogle(toy_id)}>
      <FaGoogle className="w-4 h-4 mr-4" />
      <span>Continue with Google</span>
    </Button>
  );
}
