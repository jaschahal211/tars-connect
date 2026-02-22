import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const store = mutation({
    args: {
        name: v.optional(v.string()),
        email: v.string(),
        image: v.optional(v.string()),
        clerkId: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Called storeUser without authentication");
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
            .unique();

        if (user !== null) {
            if (user.name !== args.name || user.image !== args.image || user.email !== args.email) {
                await ctx.db.patch(user._id, {
                    name: args.name,
                    image: args.image,
                    email: args.email,
                });
            }
            return user._id;
        }

        return await ctx.db.insert("users", {
            name: args.name,
            email: args.email,
            image: args.image,
            clerkId: args.clerkId,
        });
    },
});

export const currentUser = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return null;
        }

        return await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();
    },
});

export const listAll = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return [];
        }

        const allUsers = await ctx.db.query("users").collect();
        return allUsers.filter((user) => user.clerkId !== identity.subject);
    },
});

export const getById = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.userId);
    },
});
