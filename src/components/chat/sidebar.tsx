"use client";

import { Search, Plus, Users as UsersIcon, MessageSquare, X, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { UserButton } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Id } from "convex/_generated/dataModel";

interface SidebarProps {
    onSelectUser?: (userId: Id<"users">) => void;
    onSelectConversation?: (conversationId: Id<"conversations">) => void;
    selectedUserId?: Id<"users">;
    selectedConversationId?: Id<"conversations">;
}

export const Sidebar = ({ onSelectUser, onSelectConversation, selectedUserId, selectedConversationId }: SidebarProps) => {
    const users = useQuery(api.users.listAll);
    const currentUser = useQuery(api.users.currentUser);
    const conversations = useQuery(api.conversations.list);
    const onlineUsers = useQuery(api.presence.getOnlineUsers);
    const createConversation = useMutation(api.conversations.create);

    const [search, setSearch] = useState("");
    const [view, setView] = useState<"chats" | "users">("chats");
    const [isCreatingGroup, setIsCreatingGroup] = useState(false);
    const [groupName, setGroupName] = useState("");
    const [selectedParticipants, setSelectedParticipants] = useState<Id<"users">[]>([]);

    const filteredUsers = users?.filter((user) =>
        user.name?.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase())
    );

    const handleCreateGroup = async () => {
        if (!currentUser || !groupName || selectedParticipants.length === 0) return;
        const convId = await createConversation({
            name: groupName,
            participants: [currentUser._id, ...selectedParticipants],
            isGroup: true,
        });
        setIsCreatingGroup(false);
        setGroupName("");
        setSelectedParticipants([]);
        onSelectConversation?.(convId as any);
        setView("chats");
    };

    const toggleParticipant = (userId: Id<"users">) => {
        setSelectedParticipants(prev =>
            prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
        );
    };

    const handleUserClick = async (userId: Id<"users">) => {
        if (!currentUser) return;
        if (isCreatingGroup) {
            toggleParticipant(userId);
            return;
        }
        const convId = await createConversation({
            participants: [currentUser._id, userId],
            isGroup: false,
        });
        onSelectUser?.(userId);
        onSelectConversation?.(convId as any);
        setView("chats");
    };

    return (
        <div className="flex flex-col h-full w-full bg-zinc-950/40 backdrop-blur-xl text-zinc-100 border-r border-white/5">
            <div className="p-4 flex items-center justify-between border-b border-white/5 bg-white/5">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <MessageSquare className="w-5 h-5 text-white" />
                    </div>
                    <h1 className="text-lg font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                        Tars Connect
                    </h1>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        className={`h-8 w-8 rounded-lg hover:bg-white/10 transition-all ${isCreatingGroup ? "bg-indigo-600/20 text-indigo-400" : "text-zinc-400"}`}
                        onClick={() => {
                            setIsCreatingGroup(!isCreatingGroup);
                            if (!isCreatingGroup) setView("users");
                            else setSelectedParticipants([]);
                        }}
                    >
                        {isCreatingGroup ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    </Button>
                    <UserButton afterSignOutUrl="/sign-in" />
                </div>
            </div>

            <div className="p-4 space-y-4">
                {isCreatingGroup ? (
                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                        <Input
                            placeholder="Group Name..."
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            className="bg-white/5 border-white/10 focus-visible:ring-indigo-500/50 h-9"
                        />
                        <div className="flex items-center justify-between">
                            <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest pl-1">
                                {selectedParticipants.length} selected
                            </p>
                            <Button
                                size="sm"
                                disabled={!groupName || selectedParticipants.length === 0}
                                onClick={handleCreateGroup}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white h-7 px-3 text-xs rounded-md shadow-lg shadow-indigo-500/20"
                            >
                                <Check className="w-3 h-3 mr-1" /> Create
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
                        <button
                            onClick={() => setView("chats")}
                            className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-semibold rounded-lg transition-all ${view === "chats" ? "bg-zinc-800 text-white shadow-xl border border-white/10" : "text-zinc-500 hover:text-zinc-300"
                                }`}
                        >
                            <MessageSquare className="w-3.5 h-3.5" />
                            Chats
                        </button>
                        <button
                            onClick={() => setView("users")}
                            className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-semibold rounded-lg transition-all ${view === "users" ? "bg-zinc-800 text-white shadow-xl border border-white/10" : "text-zinc-500 hover:text-zinc-300"
                                }`}
                        >
                            <UsersIcon className="w-3.5 h-3.5" />
                            Explore
                        </button>
                    </div>
                )}

                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-indigo-400 transition-colors" />
                    <Input
                        placeholder={view === "chats" ? "Search conversations..." : "Search users..."}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10 bg-white/5 border-white/10 focus-visible:ring-indigo-500/50 h-9 transition-all"
                    />
                </div>
            </div>

            <ScrollArea className="flex-1 px-2">
                <div className="space-y-1 pb-4">
                    {view === "users" ? (
                        users === undefined ? (
                            <LoadingSkeletons />
                        ) : (filteredUsers ?? []).length === 0 ? (
                            <EmptyState message="No users found" />
                        ) : (
                            filteredUsers?.map((user) => (
                                <UserItem
                                    key={user._id}
                                    user={user}
                                    isActive={selectedUserId === user._id || selectedParticipants.includes(user._id)}
                                    isOnline={onlineUsers?.some(u => u.userId === user._id)}
                                    onClick={() => handleUserClick(user._id)}
                                    isSelectMode={isCreatingGroup}
                                    isSelected={selectedParticipants.includes(user._id)}
                                />
                            ))
                        )
                    ) : (
                        conversations === undefined ? (
                            <LoadingSkeletons />
                        ) : conversations.length === 0 ? (
                            <EmptyState message="No conversations yet" />
                        ) : (
                            conversations.map((conv) => (
                                <ConversationItem
                                    key={conv._id}
                                    conversation={conv}
                                    isActive={selectedConversationId === conv._id}
                                    currentUserId={currentUser?._id}
                                    onSelect={() => onSelectConversation?.(conv._id)}
                                />
                            ))
                        )
                    )}
                </div>
            </ScrollArea>
        </div>
    );
};

const UserItem = ({ user, isActive, isOnline, onClick, isSelectMode, isSelected }: any) => (
    <div
        onClick={onClick}
        className={`group flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer border border-transparent ${isActive ? "bg-white/10 border-white/10 shadow-xl" : "hover:bg-white/5 hover:border-white/5"
            }`}
    >
        <div className="relative">
            <Avatar className="w-11 h-11 border border-white/10 shadow-lg">
                <AvatarImage src={user.image} />
                <AvatarFallback className="bg-zinc-800 text-zinc-400">{user.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            {isOnline && (
                <div className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-green-500 border-2 border-zinc-950 rounded-full shadow-lg" />
            )}
            {isSelectMode && isSelected && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center border-2 border-zinc-950 text-white shadow-xl animate-in zoom-in duration-200">
                    <Check className="w-3 h-3" />
                </div>
            )}
        </div>
        <div className="flex-1 min-w-0">
            <span className="font-semibold text-sm block truncate group-hover:text-white transition-colors">{user.name}</span>
            <p className="text-xs text-zinc-500 truncate">{user.email}</p>
        </div>
    </div>
);

const ConversationItem = ({ conversation, isActive, currentUserId, onSelect }: any) => {
    const otherUserId = conversation.participants.find((p: any) => p !== currentUserId);
    const otherUser = useQuery(api.users.getById, otherUserId ? { userId: otherUserId } : "skip");
    const lastMessage = useQuery(api.messages.getLastMessage, { conversationId: conversation._id });

    return (
        <div
            onClick={onSelect}
            className={`group flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer border border-transparent ${isActive ? "bg-indigo-600/10 border-indigo-500/20 shadow-xl" : "hover:bg-white/5 hover:border-white/5"
                }`}
        >
            <Avatar className="w-11 h-11 border border-white/10 shadow-lg">
                <AvatarImage src={conversation.isGroup ? "" : otherUser?.image} />
                <AvatarFallback className="bg-zinc-800 text-zinc-400">
                    {conversation.isGroup ? conversation.name?.charAt(0) : otherUser?.name?.charAt(0)}
                </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                    <span className={`font-semibold text-sm truncate transition-colors ${isActive ? "text-indigo-300" : "group-hover:text-white"}`}>
                        {conversation.isGroup ? conversation.name : (otherUser?.name || "Loading...")}
                    </span>
                    <UnreadCount conversationId={conversation._id} userId={currentUserId} />
                </div>
                <p className="text-xs text-zinc-500 truncate line-clamp-1">
                    {lastMessage ?
                        (lastMessage.isDeleted ? <span className="italic opacity-60">This message was deleted</span> : lastMessage.content)
                        : <span className="opacity-40 italic">No messages yet</span>}
                </p>
            </div>
        </div>
    );
};

const UnreadCount = ({ conversationId, userId }: { conversationId: any, userId: any }) => {
    const count = useQuery(api.messages.countUnread, { conversationId, userId });
    if (!count || count === 0) return null;
    return (
        <div className="bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-lg shadow-indigo-500/40 animate-pulse-subtle">
            {count}
        </div>
    );
};

const LoadingSkeletons = () => (
    <div className="space-y-1">
        {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3">
                <Skeleton className="w-11 h-11 rounded-xl bg-white/5" />
                <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-24 bg-white/5" />
                    <Skeleton className="h-3 w-32 bg-white/5" />
                </div>
            </div>
        ))}
    </div>
);

const EmptyState = ({ message }: { message: string }) => (
    <div className="py-12 px-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4 border border-white/5">
            <Search className="w-6 h-6 text-zinc-700" />
        </div>
        <p className="text-sm text-zinc-500 italic">{message}</p>
    </div>
);
