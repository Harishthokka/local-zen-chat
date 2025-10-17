import { useState } from "react";
import { ChatHeader } from "@/components/ChatHeader";
import { TabNavigation } from "@/components/TabNavigation";
import { UploadFiles } from "@/components/UploadFiles";
import { ChatInterface } from "@/components/ChatInterface";
import { DataControl } from "@/components/DataControl";
import { aiEngine } from "@/lib/aiEngine";

const Index = () => {
  const [activeTab, setActiveTab] = useState<"upload" | "chat" | "data">("upload");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFilesUploaded = (files: File[]) => {
    setUploadedFiles((prev) => [...prev, ...files]);
    // Automatically switch to chat after upload
    setTimeout(() => setActiveTab("chat"), 500);
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearAll = () => {
    setUploadedFiles([]);
    aiEngine.clearDocuments();
  };

  return (
    <div className="min-h-screen bg-background">
      <ChatHeader />
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      
      {activeTab === "upload" && (
        <UploadFiles 
          onFilesUploaded={handleFilesUploaded}
          isProcessing={isProcessing}
          setIsProcessing={setIsProcessing}
        />
      )}
      
      {activeTab === "chat" && <ChatInterface />}
      
      {activeTab === "data" && (
        <DataControl
          files={uploadedFiles}
          onRemoveFile={handleRemoveFile}
          onClearAll={handleClearAll}
        />
      )}
    </div>
  );
};

export default Index;
