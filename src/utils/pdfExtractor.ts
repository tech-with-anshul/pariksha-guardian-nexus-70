import * as pdfjsLib from 'pdfjs-dist';

// Set the worker source to use the CDN version
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs`;

export async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  let fullText = '';
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    fullText += pageText + '\n\n';
  }
  
  return fullText.trim();
}

export async function extractTextFromFile(file: File): Promise<string> {
  const fileType = file.type;
  
  if (fileType === 'application/pdf') {
    return extractTextFromPDF(file);
  }
  
  // For text files and other formats, use standard text reading
  if (fileType === 'text/plain') {
    return file.text();
  }
  
  // For DOC/DOCX files, we'll try to read as text (limited support)
  // A proper implementation would need a server-side parser
  if (fileType.includes('msword') || fileType.includes('wordprocessingml')) {
    console.warn('DOC/DOCX files have limited text extraction support in browser');
    return file.text();
  }
  
  return file.text();
}
