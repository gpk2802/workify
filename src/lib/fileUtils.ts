import { supabase } from './supabase';
// Only import pdf-parse on the client side
let pdfParse: any = null;
if (typeof window !== 'undefined') {
  // Dynamic import for client-side only
  import('pdf-parse').then((module) => {
    pdfParse = module.default;
  });
}

/**
 * Upload a file to Supabase storage
 * @param file The file to upload
 * @param userId The user ID to associate with the file
 * @returns The path to the uploaded file
 */
export async function uploadFile(file: File, userId: string): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}-${Date.now()}.${fileExt}`;
  const filePath = `resumes/${fileName}`;

  const { error } = await supabase.storage
    .from('user-files')
    .upload(filePath, file);

  if (error) {
    throw new Error(`Error uploading file: ${error.message}`);
  }

  return filePath;
}

/**
 * Extract text from a PDF file
 * @param file The PDF file to extract text from
 * @returns The extracted text
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    // Check if we're on the client side and pdfParse is available
    if (typeof window === 'undefined' || !pdfParse) {
      throw new Error('PDF parsing is only available in the browser');
    }
    
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const data = await pdfParse(buffer);
    return data.text;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

/**
 * Extract text from a file (PDF or text)
 * @param file The file to extract text from
 * @returns The extracted text
 */
export async function extractTextFromFile(file: File): Promise<string> {
  // Check if we're on the client side
  if (typeof window === 'undefined') {
    throw new Error('File processing is only available in the browser');
  }
  
  const fileType = file.type;
  
  if (fileType === 'application/pdf') {
    return extractTextFromPDF(file);
  } else if (fileType === 'text/plain') {
    return await file.text();
  } else {
    throw new Error('Unsupported file type. Please upload a PDF or text file.');
  }
}

/**
 * Get the public URL for a file in Supabase storage
 * @param filePath The path to the file in storage
 * @returns The public URL for the file
 */
export function getFileUrl(filePath: string): string {
  const { data } = supabase.storage.from('user-files').getPublicUrl(filePath);
  return data.publicUrl;
}