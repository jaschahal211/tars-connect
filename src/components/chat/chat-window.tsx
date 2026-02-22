"use client";

import { Send, Smile, Paperclip, MoreVertical, Phone, Video, Loader2, Trash2, ChevronLeft, AlertCircle, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery, useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import { useState, useRef, useEffect } from "react";
import { Id } from "convex/_generated/dataModel";
import { formatChatTimestamp } from "@/lib/date-utils";
import { PresenceObserver } from "./presence-observer";

interface ChatWindowProps {
    userId?: Id<"users">;
    conversationId?: Id<"conversations">;
    onBack?: () => void;
}

export const ChatWindow = ({ userId, conversationId, onBack }: ChatWindowProps) => {
    const [content, setContent] = useState("");
    const [isPending, setIsPending] = useState(false);
    const [lastError, setLastError] = useState<string | null>(null);

    const currentUser = useQuery(api.users.currentUser);
    const otherUser = useQuery(api.users.getById, userId ? { userId } : "skip");

    const conversations = useQuery(api.conversations.list);
    const activeConvId = conversationId || conversations?.find(c =>
        !c.isGroup && c.participants.includes(userId as Id<"users">)
    )?._id;

    const activeConv = useQuery(api.conversations.getById, activeConvId ? { conversationId: activeConvId } : "skip");

    const messages = useQuery(
        api.messages.list,
        activeConvId ? { conversationId: activeConvId } : "skip"
    );

    const typingUsers = useQuery(api.presence.listForConversation, activeConvId ? { conversationId: activeConvId } : "skip");
    const otherTypingUsers = typingUsers?.filter(u => u.userId !== currentUser?._id);

    const markAsRead = useMutation(api.conversations.markAsRead);
    const sendMessage = useMutation(api.messages.send);
    const deleteMessage = useMutation(api.messages.remove);

    const [showScrollButton, setShowScrollButton] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
        setShowScrollButton(false);
    };

    const handleScroll = (e: any) => {
        const target = e.target;
        const isAtBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 100;
        setShowScrollButton(!isAtBottom);
    };

    useEffect(() => {
        if (activeConvId) {
            markAsRead({ conversationId: activeConvId });
        }
    }, [activeConvId, markAsRead]);

    useEffect(() => {
        if (!showScrollButton) {
            scrollToBottom();
        }
    }, [messages, showScrollButton, otherTypingUsers]);

    const handleSend = async () => {
        if (!content.trim() || !activeConvId || isPending) return;

        setIsPending(true);
        setLastError(null);

        try {
            await sendMessage({
                conversationId: activeConvId,
                content: content,
            });
            setContent("");
        } catch (error) {
            console.error("Failed to send message:", error);
            setLastError("Failed to send. Click to retry.");
        } finally {
            setIsPending(false);
        }
    };

    if (!activeConvId && !userId) {
        return (
            <div className="flex flex-col h-full w-full bg-mesh items-center justify-center text-zinc-500">
                <div className="text-center space-y-4 max-w-xs animate-in fade-in zoom-in duration-500">
                    <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center mx-auto border border-white/5 shadow-2xl">
                        <MessageSquare className="w-8 h-8 text-indigo-400 opacity-60" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white tracking-tight">Your Space</h3>
                        <p className="text-sm text-zinc-500 mt-1 leading-relaxed">Select a conversation from the sidebar to start connected</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full w-full bg-zinc-950/40 relative">
            <PresenceObserver conversationId={activeConvId} />

            {/* Header */}
            <header className="p-4 flex items-center justify-between border-b border-white/5 bg-zinc-950/40 backdrop-blur-2xl z-20">
                <div className="flex items-center gap-3 min-w-0">
                    {onBack && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onBack}
                            className="md:hidden text-zinc-400 hover:text-white hover:bg-white/10 mr-1 rounded-full h-9 w-9"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </Button>
                    )}
                    <div className="relative">
                        <Avatar className="w-10 h-10 border border-white/10 shadow-lg">
                            <AvatarImage src={activeConv?.isGroup ? "" : otherUser?.image} />
                            <AvatarFallback className="bg-zinc-800 text-zinc-400">
                                {activeConv?.isGroup ? activeConv.name?.charAt(0) : otherUser?.name?.charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                        {!activeConv?.isGroup && (
                            <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-zinc-950 shadow-sm ${otherTypingUsers?.length ? "bg-indigo-400 animate-pulse" : "bg-green-500"}`} />
                        )}
                    </div>
                    <div className="min-w-0 text-left">
                        <h2 className="font-bold text-sm text-white truncate leading-tight">
                            {activeConv?.isGroup ? activeConv.name : (otherUser?.name || "Loading...")}
                        </h2>
                        <p className="text-[11px] font-medium text-zinc-500 truncate mt-0.5">
                            {activeConv?.isGroup
                                ? `${activeConv.participants.length} members`
                                : (otherTypingUsers?.length ? "typing..." : "Online now")
                            }
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white hover:bg-white/10 rounded-full h-9 w-9">
                        <Phone className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white hover:bg-white/10 rounded-full h-9 w-9">
                        <Video className="w-4 h-4" />
                    </Button>
                    <div className="w-[1px] h-4 bg-white/10 mx-1" />
                    <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white hover:bg-white/10 rounded-full h-9 w-9">
                        <MoreVertical className="w-4 h-4" />
                    </Button>
                </div>
            </header>

            {/* Messages Area */}
            <main className="flex-1 relative overflow-hidden bg-mesh/10">
                <ScrollArea
                    className="h-full w-full px-4"
                    onScrollCapture={handleScroll}
                >
                    <div className="py-6 space-y-1">
                        {messages === undefined ? (
                            <div className="flex flex-col items-center justify-center p-20 gap-3">
                                <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                                <p className="text-xs text-zinc-500 font-medium">Syncing history...</p>
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-20 text-center space-y-2">
                                <div className="p-3 bg-white/5 rounded-full border border-white/5">
                                    <Smile className="w-6 h-6 text-zinc-700" />
                                </div>
                                <p className="text-sm text-zinc-500 italic">Start the conversation with a friendly wave!</p>
                            </div>
                        ) : (
                            messages.map((m, index) => {
                                const isMe = m.senderId === currentUser?._id;
                                const prevMessage = messages[index - 1];
                                const isFirstInGroup = !prevMessage || prevMessage.senderId !== m.senderId || (m._creationTime - prevMessage._creationTime > 300000);

                                return (
                                    <div
                                        key={m._id}
                                        className={`flex flex-col ${isMe ? "items-end" : "items-start"} ${isFirstInGroup ? "mt-4" : "mt-0.5"}`}
                                    >
                                        {activeConv?.isGroup && !isMe && isFirstInGroup && !m.isDeleted && (
                                            <span className="text-[10px] font-bold text-indigo-400/80 ml-12 mb-1 uppercase tracking-widest">
                                                {m.senderName}
                                            </span>
                                        )}

                                        <div className={`flex items-end gap-2 group/msg max-w-[80%] md:max-w-[70%] ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                                            {!isMe && (
                                                <div className="w-8 flex-shrink-0">
                                                    {isFirstInGroup ? (
                                                        <Avatar className="w-8 h-8 border border-white/10">
                                                            <AvatarFallback className="bg-zinc-800 text-[10px]">
                                                                {m.senderName?.charAt(0)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                    ) : (
                                                        <div className="w-8" />
                                                    )}
                                                </div>
                                            )}

                                            <div className="flex flex-col gap-1 relative">
                                                <div
                                                    className={`px-4 py-2.5 rounded-2xl relative transition-all ${isMe
                                                        ? "bg-indigo-600 text-white rounded-tr-none shadow-lg shadow-indigo-500/20"
                                                        : "bg-zinc-900/60 backdrop-blur-sm text-zinc-200 border border-white/5 rounded-tl-none"
                                                        } ${m.isDeleted ? "opacity-40 italic py-1.5" : ""} animate-in fade-in slide-in-from-bottom-1 duration-300`}
                                                >
                                                    {m.isDeleted ? (
                                                        <p className="text-xs">Message removed</p>
                                                    ) : (
                                                        <>
                                                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</p>
                                                            {isMe && (
                                                                <button
                                                                    onClick={() => deleteMessage({ messageId: m._id })}
                                                                    className="absolute -left-10 top-1/2 -translate-y-1/2 opacity-0 group-hover/msg:opacity-100 p-2 text-zinc-600 hover:text-red-400 transition-all rounded-full hover:bg-white/5"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            )}
                                                        </>
                                                    )}
                                                </div>

                                                {!m.isDeleted && <EmojiReactions messageId={m._id} userId={currentUser?._id} isMe={isMe} />}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        {otherTypingUsers && otherTypingUsers.length > 0 && (
                            <div className="flex items-center gap-2 mt-4 ml-12 animate-in fade-in slide-in-from-left-2 transition-all">
                                <div className="flex gap-1 p-2 bg-white/5 rounded-2xl border border-white/5">
                                    <div className="w-1 h-1 bg-zinc-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                    <div className="w-1 h-1 bg-zinc-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                    <div className="w-1 h-1 bg-zinc-500 rounded-full animate-bounce" />
                                </div>
                                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                                    {otherTypingUsers.length === 1 ? "Typing..." : "People typing..."}
                                </span>
                            </div>
                        )}
                        <div ref={scrollRef} className="h-0" />
                    </div>
                </ScrollArea>

                {showScrollButton && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
                        <Button
                            onClick={scrollToBottom}
                            className="bg-zinc-800/90 backdrop-blur-xl border border-white/10 hover:bg-zinc-700 text-white shadow-2xl rounded-full h-9 px-4 text-xs font-bold gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300"
                        >
                            <span className="w-2 h-2 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                            Resume Latest
                        </Button>
                    </div>
                )}
            </main>

            {/* Input Overlay */}
            <footer className="p-4 border-t border-white/5 bg-zinc-950/40 backdrop-blur-2xl">
                {lastError && (
                    <button
                        onClick={handleSend}
                        className="flex items-center gap-1.5 text-[10px] text-red-400 bg-red-500/10 px-3 py-1.5 rounded-t-xl mx-auto border-x border-t border-red-500/20 mb-[-1px] hover:bg-red-500/20 transition-all font-bold uppercase tracking-wider"
                    >
                        <AlertCircle className="w-3 h-3" />
                        {lastError}
                    </button>
                )}
                <div className="flex items-center gap-2 max-w-5xl mx-auto pl-2 bg-white/5 rounded-2xl border border-white/10 focus-within:border-indigo-500/50 focus-within:bg-white/10 transition-all group/input">
                    <Button variant="ghost" size="icon" className="text-zinc-500 hover:text-white rounded-full transition-colors h-9 w-9">
                        <Smile className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="hidden sm:flex text-zinc-500 hover:text-white rounded-full transition-colors h-9 w-9">
                        <Paperclip className="w-4 h-4" />
                    </Button>
                    <input
                        placeholder="Say something nice..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSend()}
                        disabled={isPending}
                        className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-zinc-100 placeholder:text-zinc-600 py-3 h-11"
                    />
                    <div className="p-1">
                        <Button
                            onClick={handleSend}
                            disabled={!content.trim() || !activeConvId || isPending}
                            className={`h-9 w-9 rounded-xl transition-all ${content.trim()
                                ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 scale-100"
                                : "bg-zinc-800 text-zinc-600 scale-90"}`}
                        >
                            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </Button>
                    </div>
                </div>
            </footer>
        </div>
    );
};

const EmojiReactions = ({ messageId, userId, isMe }: { messageId: Id<"messages">, userId?: Id<"users"> | null, isMe: boolean }) => {
    const reactions = useQuery(api.reactions.listByMessage, { messageId });
    const toggleReaction = useMutation(api.reactions.toggle);

    if (!reactions) return null;

    const emojis = ["👍", "❤️", "😂", "😮", "😢", "🔥", "🚀"];

    return (
        <div className={`flex flex-wrap gap-1 mt-1 empty:hidden relative ${isMe ? "justify-end" : "justify-start"}`}>
            {Object.entries(reactions).map(([emoji, data]: [string, any]) => {
                const hasReacted = data.users.includes(userId);
                return (
                    <button
                        key={emoji}
                        onClick={() => toggleReaction({ messageId, emoji })}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all ${hasReacted
                            ? "bg-indigo-500/20 border-indigo-500 text-indigo-300 shadow-lg shadow-indigo-500/10"
                            : "bg-zinc-900 border-white/5 text-zinc-500 hover:border-white/20"
                            }`}
                    >
                        <span>{emoji}</span>
                        <span>{data.count}</span>
                    </button>
                );
            })}

            <div className="group relative">
                <button className="opacity-0 group-hover:opacity-100 p-1 text-zinc-600 hover:text-zinc-300 transition-all rounded-full hover:bg-white/5">
                    <Smile className="w-3 h-3" />
                </button>
                <div className={`absolute bottom-full mb-2 hidden group-hover:flex gap-1.5 bg-zinc-900/90 backdrop-blur-xl border border-white/10 p-1.5 rounded-2xl shadow-2xl z-30 transition-all animate-in fade-in zoom-in duration-200 ${isMe ? "right-0" : "left-0"}`}>
                    {emojis.map(emoji => (
                        <button
                            key={emoji}
                            onClick={() => toggleReaction({ messageId, emoji })}
                            className="hover:bg-white/10 p-1.5 rounded-xl transition-all transform hover:scale-125 group/emoji"
                        >
                            <span className="text-base group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">{emoji}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
