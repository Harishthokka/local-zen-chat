export interface ParsedDocument {
  fileName: string;
  content: string;
  fileType: string;
}

export const parseFile = async (file: File): Promise<ParsedDocument> => {
  const fileType = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
  
  try {
    let content = "";
    
    // Handle text-based files
    if ([".txt", ".md", ".json", ".csv", ".log"].includes(fileType)) {
      content = await file.text();
    } 
    // Handle PDF files
    else if (fileType === ".pdf") {
      content = await parsePDF(file);
    }
    // Handle Office documents (basic text extraction)
    else if ([".docx", ".pptx"].includes(fileType)) {
      content = await file.text();
    }
    
    return {
      fileName: file.name,
      content,
      fileType,
    };
  } catch (error) {
    console.error(`Error parsing ${file.name}:`, error);
    return {
      fileName: file.name,
      content: "",
      fileType,
    };
  }
};

const parsePDF = async (file: File): Promise<string> => {
  // For PDF files, we'll extract text using the File API
  // In a production app, you might want to use a library like pdf.js
  const arrayBuffer = await file.arrayBuffer();
  const text = new TextDecoder().decode(arrayBuffer);
  
  // Basic text extraction - remove binary data
  return text.replace(/[^\x20-\x7E\n\r\t]/g, " ");
};

export const chunkText = (text: string, chunkSize: number = 500): string[] => {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const chunks: string[] = [];
  let currentChunk = "";
  
  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > chunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += sentence;
    }
  }
  
  if (currentChunk.length > 0) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
};
