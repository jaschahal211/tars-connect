import { format, isToday, isYesterday, isThisYear } from "date-fns";

export const formatChatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);

    if (isToday(date)) {
        return format(date, "h:mm a");
    }

    if (isYesterday(date)) {
        return "Yesterday " + format(date, "h:mm a");
    }

    if (isThisYear(date)) {
        return format(date, "MMM d, h:mm a");
    }

    return format(date, "MMM d, yyyy, h:mm a");
};
