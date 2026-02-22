import { SignIn } from "@clerk/nextjs";

export default function Page() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-zinc-950">
            <div className="p-8 rounded-3xl bg-zinc-900/50 border border-zinc-800 backdrop-blur-xl shadow-2xl shadow-indigo-500/10">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Tars Connect</h1>
                    <p className="text-zinc-500 text-sm">Welcome back! Please sign in to continue.</p>
                </div>
                <SignIn
                    appearance={{
                        elements: {
                            formButtonPrimary: 'bg-indigo-600 hover:bg-indigo-500 text-sm normal-case',
                            card: 'bg-transparent shadow-none border-none p-0',
                            headerTitle: 'hidden',
                            headerSubtitle: 'hidden',
                            footer: 'hidden'
                        }
                    }}
                />
            </div>
        </div>
    );
}
