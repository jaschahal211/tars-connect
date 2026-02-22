"use client";

import { useMutation, useQuery } from "convex/react";
import { useEffect } from "react";
import { api } from "convex/_generated/api";
import { Id } from "convex/_generated/dataModel";

export const PresenceObserver = ({ conversationId }: { conversationId?: Id<"conversations"> }) => {
    const updatePresence = useMutation(api.presence.update);

    useEffect(() => {
        // Initial update
        updatePresence({ isTyping: conversationId });

        // Periodic update every 10 seconds to keep online
        const interval = setInterval(() => {
            updatePresence({ isTyping: conversationId });
        }, 10000);

        // Update before unmount
        return () => {
            clearInterval(interval);
            updatePresence({ isTyping: undefined });
        };
    }, [updatePresence, conversationId]);

    return null;
};
