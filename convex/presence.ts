import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const update = mutation({
    args: {
        isTyping: v.optional(v.id("conversations")),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return;

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!user) return;

        const existing = await ctx.db
            .query("presence")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .unique();

        if (existing) {
            await ctx.db.patch(existing._id, {
                lastSeen: Date.now(),
                isTyping: args.isTyping,
            });
        } else {
            await ctx.db.insert("presence", {
                userId: user._id,
                lastSeen: Date.now(),
                isTyping: args.isTyping,
            });
        }
    },
});

export const listForConversation = query({
    args: { conversationId: v.id("conversations") },
    handler: async (ctx, args) => {
        const presence = await ctx.db
            .query("presence")
            .collect();

        // Filtering in JS for simplicity, though indexing is better for production
        return presence.filter(p =>
            p.isTyping === args.conversationId &&
            p.lastSeen > Date.now() - 30000 // Last seen in the last 30s
        );
    }
});

export const getOnlineUsers = query({
    args: {},
    handler: async (ctx) => {
        const presence = await ctx.db.query("presence").collect();
        return presence.filter(p => p.lastSeen > Date.now() - 60000); // Online if seen in last 1m
    }
});
