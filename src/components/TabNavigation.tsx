import { Upload, MessageSquare, Database } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TabNavigationProps {
  activeTab: "upload" | "chat" | "data";
  onTabChange: (tab: "upload" | "chat" | "data") => void;
}

export const TabNavigation = ({ activeTab, onTabChange }: TabNavigationProps) => {
  return (
    <div className="border-b border-border bg-card px-6">
      <div className="flex gap-1">
        <Button
          variant="ghost"
          className={`flex items-center gap-2 rounded-none border-b-2 px-4 py-3 transition-colors ${
            activeTab === "upload"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => onTabChange("upload")}
        >
          <Upload className="h-4 w-4" />
          <span className="text-sm font-medium">Upload Files</span>
        </Button>
        <Button
          variant="ghost"
          className={`flex items-center gap-2 rounded-none border-b-2 px-4 py-3 transition-colors ${
            activeTab === "chat"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => onTabChange("chat")}
        >
          <MessageSquare className="h-4 w-4" />
          <span className="text-sm font-medium">Chat</span>
        </Button>
        <Button
          variant="ghost"
          className={`flex items-center gap-2 rounded-none border-b-2 px-4 py-3 transition-colors ${
            activeTab === "data"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => onTabChange("data")}
        >
          <Database className="h-4 w-4" />
          <span className="text-sm font-medium">Data Control</span>
        </Button>
      </div>
    </div>
  );
};
