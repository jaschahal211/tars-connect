"use client";

import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import { ReactNode } from "react";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!convexUrl) {
    console.warn("NEXT_PUBLIC_CONVEX_URL is missing. Check your Vercel Environment Variables.");
}
if (!publishableKey) {
    console.warn("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is missing. Check your Vercel Environment Variables.");
}

const convex = new ConvexReactClient(convexUrl || "https://placeholder-url.convex.cloud");

export function ConvexClientProvider({ children }: { children: ReactNode }) {
    if (!publishableKey || !convexUrl) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-zinc-950 text-white p-4 text-center">
                <div className="max-w-md space-y-4">
                    <h1 className="text-xl font-bold text-indigo-400">Configuration Missing</h1>
                    <p className="text-zinc-400 text-sm">
                        It looks like your Vercel Environment Variables aren't fully set up yet.
                        Please ensure both <b>NEXT_PUBLIC_CONVEX_URL</b> and <b>NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</b> are added in Vercel.
                    </p>
                    <p className="text-xs text-zinc-600">See the browser console for more details.</p>
                </div>
            </div>
        );
    }

    return (
        <ClerkProvider publishableKey={publishableKey}>
            <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
                {children}
            </ConvexProviderWithClerk>
        </ClerkProvider>
    );
}
