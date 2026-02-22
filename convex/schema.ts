import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    users: defineTable({
        name: v.optional(v.string()),
        email: v.string(),
        image: v.optional(v.string()),
        clerkId: v.string(),
    }).index("by_clerkId", ["clerkId"]),

    conversations: defineTable({
        name: v.optional(v.string()), // For group chats
        isGroup: v.boolean(),
        participants: v.array(v.id("users")),
        lastRead: v.optional(v.any()), // Map of userId -> timestamp
    }),

    messages: defineTable({
        conversationId: v.id("conversations"),
        senderId: v.id("users"),
        senderName: v.optional(v.string()),
        content: v.string(),
        isDeleted: v.optional(v.boolean()),
    }).index("by_conversation", ["conversationId"]),

    reactions: defineTable({
        messageId: v.id("messages"),
        userId: v.id("users"),
        emoji: v.string(),
    }).index("by_message", ["messageId"]),

    presence: defineTable({
        userId: v.id("users"),
        lastSeen: v.number(),
        isTyping: v.optional(v.id("conversations")),
    }).index("by_user", ["userId"]),
});
