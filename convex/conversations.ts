import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
    args: {
        participants: v.array(v.id("users")),
        isGroup: v.boolean(),
        name: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Unauthorized");
        }

        // Check if 1v1 conversation already exists
        if (!args.isGroup && args.participants.length === 2) {
            const existing = await ctx.db
                .query("conversations")
                .filter((q) =>
                    q.and(
                        q.eq(q.field("isGroup"), false),
                        // This is a simple participant check, might need better logic for scale
                        q.eq(q.field("participants"), args.participants)
                    )
                )
                .unique();

            if (existing) return existing._id;
        }

        return await ctx.db.insert("conversations", {
            participants: args.participants,
            isGroup: args.isGroup,
            name: args.name,
            lastRead: {},
        });
    },
});

export const list = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!user) return [];

        const conversations = await ctx.db
            .query("conversations")
            .collect();

        // Filter conversations where user is a participant
        return conversations.filter((c) => c.participants.includes(user._id));
    },
});

export const markAsRead = mutation({
    args: { conversationId: v.id("conversations") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();
        if (!user) throw new Error("User not found");

        const conversation = await ctx.db.get(args.conversationId);
        if (!conversation) throw new Error("Conversation not found");

        const lastRead = conversation.lastRead || {};
        lastRead[user._id] = Date.now();

        await ctx.db.patch(args.conversationId, { lastRead });
    },
});

export const getById = query({
    args: { conversationId: v.id("conversations") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.conversationId);
    },
});
