"use client";

import { useConvexAuth, useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { api } from "../../../convex/_generated/api";

export const SyncUser = () => {
    const { isLoaded, isSignedIn, user } = useUser();
    const { isAuthenticated } = useConvexAuth();
    const storeUser = useMutation(api.users.store);
    const [synced, setSynced] = useState(false);

    useEffect(() => {
        if (isLoaded && isSignedIn && isAuthenticated && !synced) {
            const sync = async () => {
                try {
                    await storeUser({
                        name: user.fullName || user.username || "Anonymous",
                        email: user.primaryEmailAddress?.emailAddress || "",
                        image: user.imageUrl,
                        clerkId: user.id,
                    });
                    setSynced(true);
                } catch (error) {
                    console.error("Error syncing user:", error);
                }
            };
            sync();
        }
    }, [isLoaded, isSignedIn, isAuthenticated, user, storeUser, synced]);

    return null;
};
