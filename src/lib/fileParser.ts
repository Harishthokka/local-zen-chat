export interface ParsedDocument {
  fileName: string;
  content: string;
  fileType: string;
}

// Lazy-load pdf.js only when needed
let pdfjsLibPromise: Promise<any> | null = null;
const getPdfJs = async () => {
  if (!pdfjsLibPromise) {
    pdfjsLibPromise = import("pdfjs-dist").then((m: any) => {
      const pdfjsLib = m;
      // Use worker from CDN to avoid bundling issues
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@4.8.69/build/pdf.worker.min.js`;
      return pdfjsLib;
    });
  }
  return pdfjsLibPromise;
};

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
    // Handle Office documents (basic text extraction fallback)
    else if ([".docx", ".pptx"].includes(fileType)) {
      // NOTE: Proper Office parsing requires additional libs. Fallback to raw text.
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
  try {
    const pdfjsLib: any = await getPdfJs();
    const data = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data }).promise;

    let text = "";
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item: any) => ("str" in item ? (item as any).str : ""))
        .join(" ");
      text += pageText + "\n";
    }

    return text.trim();
  } catch (e) {
    console.warn("PDF parsing failed, falling back to binary decode.", e);
    const arrayBuffer = await file.arrayBuffer();
    const fallback = new TextDecoder().decode(arrayBuffer);
    return fallback.replace(/[^\x20-\x7E\n\r\t]/g, " ");
  }
};

export const chunkText = (text: string, chunkSize: number = 800): string[] => {
  const sentences = text.match(/[^.!?\n]+[.!?\n]+/g) || [text];
  const chunks: string[] = [];
  let current = "";

  for (const sentence of sentences) {
    if ((current + sentence).length > chunkSize && current.length > 0) {
      chunks.push(current.trim());
      current = sentence;
    } else {
      current += sentence;
    }
  }

  if (current.trim().length > 0) chunks.push(current.trim());
  return chunks;
};
