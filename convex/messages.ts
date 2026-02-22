import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const send = mutation({
    args: {
        conversationId: v.id("conversations"),
        content: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!user) throw new Error("User not found");

        return await ctx.db.insert("messages", {
            conversationId: args.conversationId,
            senderId: user._id,
            senderName: user.name || "Anonymous",
            content: args.content,
        });
    },
});

export const list = query({
    args: { conversationId: v.id("conversations") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        return await ctx.db
            .query("messages")
            .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
            .collect();
    },
});

export const getLastMessage = query({
    args: { conversationId: v.id("conversations") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("messages")
            .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
            .order("desc")
            .first();
    },
});

export const countUnread = query({
    args: { conversationId: v.id("conversations"), userId: v.id("users") },
    handler: async (ctx, args) => {
        const conversation = await ctx.db.get(args.conversationId);
        if (!conversation) return 0;

        const lastRead = conversation.lastRead?.[args.userId] || 0;

        const unreadMessages = await ctx.db
            .query("messages")
            .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
            .filter((q) => q.gt(q.field("_creationTime"), lastRead))
            .collect();

        return unreadMessages.filter(m => m.senderId !== args.userId).length;
    },
});

export const remove = mutation({
    args: { messageId: v.id("messages") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const message = await ctx.db.get(args.messageId);
        if (!message) throw new Error("Message not found");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!user || message.senderId !== user._id) {
            throw new Error("Unauthorized to delete this message");
        }

        await ctx.db.patch(args.messageId, { isDeleted: true });
    },
});
