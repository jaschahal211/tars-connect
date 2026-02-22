import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const toggle = mutation({
    args: { messageId: v.id("messages"), emoji: v.string() },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();
        if (!user) throw new Error("User not found");

        const existing = await ctx.db
            .query("reactions")
            .withIndex("by_message", (q) => q.eq("messageId", args.messageId))
            .filter((q) =>
                q.and(
                    q.eq(q.field("userId"), user._id),
                    q.eq(q.field("emoji"), args.emoji)
                )
            )
            .unique();

        if (existing) {
            await ctx.db.delete(existing._id);
        } else {
            await ctx.db.insert("reactions", {
                messageId: args.messageId,
                userId: user._id,
                emoji: args.emoji,
            });
        }
    },
});

export const listByMessage = query({
    args: { messageId: v.id("messages") },
    handler: async (ctx, args) => {
        const reactions = await ctx.db
            .query("reactions")
            .withIndex("by_message", (q) => q.eq("messageId", args.messageId))
            .collect();

        // Group reactions by emoji
        const grouped: Record<string, { count: number, users: string[] }> = {};
        for (const r of reactions) {
            if (!grouped[r.emoji]) {
                grouped[r.emoji] = { count: 0, users: [] };
            }
            grouped[r.emoji].count++;
            grouped[r.emoji].users.push(r.userId);
        }
        return grouped;
    },
});
