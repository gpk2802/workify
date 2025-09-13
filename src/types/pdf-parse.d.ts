declare module 'pdf-parse' {
  interface PDFParseOptions {
    pagerender?: (pageData: any) => string;
    max?: number;
    version?: string;
  }

  interface PDFParseResult {
    text: string;
    numpages: number;
    numrender: number;
    info: any;
    metadata: any;
    version: string;
  }

  function PDFParse(dataBuffer: Buffer, options?: PDFParseOptions): Promise<PDFParseResult>;
  
  export default PDFParse;
}