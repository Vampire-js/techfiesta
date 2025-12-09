"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../app/contexts/AuthContext";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const router = useRouter();
  const { login, user } = useAuth();

  const [username, setUsername] = useState(""); // mapping "email" → "username"
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // Redirect if logged in
  useEffect(() => {
    if (user) router.push("/");
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const ok = await login(username, password);
    if (!ok) {
      setError("Invalid username or password");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("flex flex-col gap-6", className)}
      {...props}
    >
      <FieldGroup>
        
        {/* Header */}
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Login to your account</h1>
          <p className="text-muted-foreground text-sm">
            Enter your username and password to continue
          </p>
        </div>

        {/* Username */}
        <Field>
          <FieldLabel htmlFor="username">Email</FieldLabel>
          <Input
            id="username"
            type="email"
            placeholder="johnsmith"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </Field>

        {/* Password */}
        <Field>
          <div className="flex items-center">
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <button
              type="button"
              className="ml-auto text-sm underline-offset-4 hover:underline text-muted-foreground"
              onClick={() => alert("Password reset coming soon")}
            >
              Forgot password?
            </button>
          </div>
          <Input
            id="password"
            type="password"
            required
            placeholder="•••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>

        {/* Error message */}
        {error && (
          <p className="text-sm text-red-500 text-center">{error}</p>
        )}

        {/* Login Button */}
        <Field>
          <Button type="submit" className="w-full">
            Login
          </Button>
        </Field>

        <FieldSeparator></FieldSeparator>

        <Field>
         

          <FieldDescription className="text-center">
            Don&apos;t have an account?{" "}
            <span
              onClick={() => router.push("/signup")}
              className="cursor-pointer underline underline-offset-4"
            >
              Sign up
            </span>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
}
