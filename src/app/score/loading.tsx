import { Crown, Loader2 } from "lucide-react";

export default function Loading() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-zinc-50 dark:bg-black">
            <div className="relative mb-6">
                <div className="absolute inset-0 bg-purple-500/20 blur-xl rounded-full animate-pulse"></div>
                <div className="relative bg-white dark:bg-zinc-900 p-4 rounded-2xl shadow-xl border border-gray-100 dark:border-zinc-800">
                    <Crown className="w-10 h-10 text-purple-500 animate-bounce" />
                </div>
            </div>

            <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                Calculating Run Score
            </h2>
            <div className="flex items-center gap-2 text-sm text-gray-500 animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Analyzing your activities...</span>
            </div>
        </div>
    );
}
