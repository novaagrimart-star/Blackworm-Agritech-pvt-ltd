import express from 'express';
import { createServer as createViteServer } from 'vite';
import multer from 'multer';
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

const upload = multer({ storage: multer.memoryStorage() });

async function createServer() {
  const app = express();
  const port = 3000;

  app.use(express.json({ limit: '10mb' }));

  // API Route for parsing price list
  app.post('/api/parse-pricelist', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const fileData = req.file.buffer.toString('base64');
      const mimeType = req.file.mimetype;

      const systemInstruction = `You are a specialist in extracting product data from agricultural price lists (PDF, Excel, Images).
      Your goal is to extract every product listed in the file with 100% accuracy.
      
      CRITICAL RULES:
      1. DO NOT ESTIMATE, INVENT, OR CALCULATE ANY DATA. Only extract what is explicitly written in the file.
      2. PRESERVE CATEGORIES: Identify the Group/Category (e.g., "Water Soluble Fertilizers", "Micronutrients", "Plant Growth Regulators") for each product based on headers or sections in the file.
      3. EXACT DATA: Extraction of Name, HSN, Packing Size, Rate, GST, and MRP must match the source file exactly.
      4. MULTIPLE PACKINGS: If a product (e.g. "Airawat 19:19:19") has multiple rows for different packing sizes (e.g. 1kg, 25kg) in the source file, extract each row as a separate object in the array.
      5. NO DUPLICATES: If the same product and packing size appears multiple times, only extract it once.
      6. CLEAN NAMES: Remove any unnecessary symbols but keep the product brand and numeric values (e.g., "19:19:19") intact.
      
      JSON SCHEMA FIELDS:
      - groupName: string (Exact category name from the file)
      - code: string (Sr.No, Item Code, or Index if available)
      - name: string (Full Product Name exactly as written)
      - hsn: string (HSN code if available)
      - packingSize: string (e.g., "25 Kg", "1 Ltr", "500 Gm")
      - rate: number (The price/rate column value)
      - gstRate: number (GST percentage as a number, e.g., 5, 12, 18)
      - mrp: number (The MRP column value)`;

      const prompt = "Parse this price list and return the structured JSON array. Only return the JSON array, no other text.";

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: [
          { inlineData: { data: fileData, mimeType } },
          { text: prompt }
        ],
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                groupName: { type: Type.STRING },
                code: { type: Type.STRING },
                name: { type: Type.STRING },
                hsn: { type: Type.STRING },
                packingSize: { type: Type.STRING },
                rate: { type: Type.NUMBER },
                gstRate: { type: Type.NUMBER },
                mrp: { type: Type.NUMBER }
              },
              required: ["name", "packingSize", "rate"]
            }
          }
        }
      });

      const text = response.text;
      if (!text) {
        throw new Error('Empty response from Gemini');
      }
      
      const parsedData = JSON.parse(text);
      res.json(parsedData);
    } catch (error: any) {
      console.error('Parsing error:', error);
      res.status(500).json({ error: error.message || 'Failed to parse file' });
    }
  });

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(process.cwd(), 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}

createServer();
