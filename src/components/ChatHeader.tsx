import { Shield } from "lucide-react";

export const ChatHeader = () => {
  return (
    <header className="border-b border-border bg-card px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Private AI Chatbot</h1>
            <p className="text-xs text-muted-foreground">100% Local Processing</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse"></div>
          <span className="text-sm text-muted-foreground">Online</span>
        </div>
      </div>
    </header>
  );
};
