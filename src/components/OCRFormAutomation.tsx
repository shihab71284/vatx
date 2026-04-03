import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  FileUp, 
  Loader2, 
  Plus, 
  Trash2, 
  FileText, 
  Layers, 
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  FileDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { translations, Language } from '../translations';

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

interface FormField {
  id: string;
  label: string;
  value: string;
}

interface OCRResult {
  documentType: string;
  fields: FormField[];
}

interface OCRFormAutomationProps {
  language?: Language;
  onInvoiceExtracted?: (data: any) => void;
}

export default function OCRFormAutomation({ language = 'en', onInvoiceExtracted }: OCRFormAutomationProps) {
  const t = translations[language];
  const [mode, setMode] = useState<'single' | 'template'>('single');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTypeConfirmed, setIsTypeConfirmed] = useState(false);
  
  // Single mode state
  const [singleFile, setSingleFile] = useState<File | null>(null);
  const [singlePreview, setSinglePreview] = useState<string | null>(null);
  
  // Template mode state
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [templatePreview, setTemplatePreview] = useState<string | null>(null);
  const [dataFile, setDataFile] = useState<File | null>(null);
  const [dataPreview, setDataPreview] = useState<string | null>(null);
  
  // Form state
  const [documentType, setDocumentType] = useState('');
  const [fields, setFields] = useState<FormField[]>([]);

  const onDropSingle = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setSingleFile(file);
      setSinglePreview(URL.createObjectURL(file));
      setError(null);
    }
  }, []);

  const onDropTemplate = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setTemplateFile(file);
      setTemplatePreview(URL.createObjectURL(file));
      setError(null);
    }
  }, []);

  const onDropData = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setDataFile(file);
      setDataPreview(URL.createObjectURL(file));
      setError(null);
    }
  }, []);

  const { getRootProps: getSingleProps, getInputProps: getSingleInputProps, isDragActive: isSingleActive } = useDropzone({
    onDrop: onDropSingle,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png'] },
    multiple: false
  });

  const { getRootProps: getTemplateProps, getInputProps: getTemplateInputProps, isDragActive: isTemplateActive } = useDropzone({
    onDrop: onDropTemplate,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png'] },
    multiple: false
  });

  const { getRootProps: getDataProps, getInputProps: getDataInputProps, isDragActive: isDataActive } = useDropzone({
    onDrop: onDropData,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png'] },
    multiple: false
  });

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = (error) => reject(error);
    });
  };

  const runOCR = async () => {
    if (mode === 'single' && !singleFile) return;
    if (mode === 'template' && (!templateFile || !dataFile)) return;

    setIsProcessing(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      
      let prompt = "";
      let contents: any[] = [];

      if (mode === 'single' && singleFile) {
        const base64 = await fileToBase64(singleFile);
        contents.push({
          inlineData: { mimeType: singleFile.type, data: base64 }
        });
        prompt = `Analyze this document image. Identify the document type and extract all relevant fields and their values. 
        Return a JSON object with:
        {
          "documentType": "string",
          "fields": [
            { "id": "unique_id", "label": "Field Name", "value": "Extracted Value" }
          ]
        }`;
      } else if (mode === 'template' && templateFile && dataFile) {
        const templateBase64 = await fileToBase64(templateFile);
        const dataBase64 = await fileToBase64(dataFile);
        
        contents.push({
          inlineData: { mimeType: templateFile.type, data: templateBase64 }
        });
        contents.push({
          inlineData: { mimeType: dataFile.type, data: dataBase64 }
        });
        
        prompt = `I have provided two images. 
        The first image is a BLANK FORM TEMPLATE. 
        The second image is a SOURCE DOCUMENT containing data.
        
        Your task:
        1. Identify the structure and fields required by the BLANK FORM TEMPLATE.
        2. Extract the relevant data from the SOURCE DOCUMENT.
        3. Map the data from the source document into the fields identified in the template.
        
        Return a JSON object with:
        {
          "documentType": "string (the type of the template form)",
          "fields": [
            { "id": "unique_id", "label": "Template Field Name", "value": "Mapped Value from Source" }
          ]
        }`;
      }

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [...contents, { text: prompt }],
        config: {
          responseMimeType: "application/json"
        }
      });

      const result = JSON.parse(response.text || "{}");
      setDocumentType(result.documentType || 'Extracted Document');
      setFields(result.fields || []);
      setIsTypeConfirmed(false);
    } catch (err) {
      console.error("OCR Error:", err);
      setError("Failed to process document. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const addField = () => {
    const newId = `field_${Date.now()}`;
    setFields([...fields, { id: newId, label: 'New Field', value: '' }]);
  };

  const updateField = (id: string, key: 'label' | 'value', val: string) => {
    setFields(fields.map(f => f.id === id ? { ...f, [key]: val } : f));
  };

  const removeField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
  };

  const handleConfirmType = () => {
    setIsTypeConfirmed(true);
    if (documentType.toLowerCase().includes('invoice') && onInvoiceExtracted) {
      // Map fields to invoice structure
      const invoiceData: any = {
        number: fields.find(f => f.label.toLowerCase().includes('number'))?.value || `INV-${Date.now().toString().slice(-6)}`,
        date: fields.find(f => f.label.toLowerCase().includes('date'))?.value || new Date().toISOString().split('T')[0],
        seller: {
          name: fields.find(f => f.label.toLowerCase().includes('seller') || f.label.toLowerCase().includes('from'))?.value || '',
          address: '',
          bin: fields.find(f => f.label.toLowerCase().includes('bin'))?.value || ''
        },
        buyer: {
          name: fields.find(f => f.label.toLowerCase().includes('buyer') || f.label.toLowerCase().includes('to') || f.label.toLowerCase().includes('customer'))?.value || '',
          address: '',
          bin: ''
        },
        items: fields.filter(f => f.label.toLowerCase().includes('item') || f.label.toLowerCase().includes('description')).map((f, i) => ({
          id: i + 1,
          desc: f.value,
          category: 'Standard Goods/Services',
          qty: 1,
          price: 0,
          vatRate: 15
        }))
      };
      
      // If no items found, add a default one
      if (invoiceData.items.length === 0) {
        invoiceData.items = [{ id: 1, desc: 'Extracted Service/Product', category: 'Standard Goods/Services', qty: 1, price: 0, vatRate: 15 }];
      }
      
      onInvoiceExtracted(invoiceData);
    }
  };

  const handleExportWord = async () => {
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            text: documentType || "Extracted Document",
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "Generated by VATX.BD AI OCR Automation",
                bold: true,
                size: 20,
                color: "666666",
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 600 },
          }),
          ...fields.flatMap(field => [
            new Paragraph({
              children: [
                new TextRun({
                  text: field.label.toUpperCase(),
                  bold: true,
                  size: 18,
                  color: "999999",
                }),
              ],
              spacing: { before: 200 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: field.value || "Not Found",
                  size: 24,
                }),
              ],
              border: {
                bottom: { color: "EEEEEE", space: 5, style: "single", size: 6 },
              },
              spacing: { after: 200 },
            }),
          ]),
          new Paragraph({
            children: [
              new TextRun({
                text: `\n\nVerification ID: ${Math.random().toString(36).substring(7).toUpperCase()}`,
                size: 16,
                color: "999999",
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 1000 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "This document was automatically generated and verified by VATX.BD AI OCR Automation.",
                size: 14,
                color: "CCCCCC",
              }),
            ],
            alignment: AlignmentType.CENTER,
          }),
        ],
      }],
    });

    const blob = await Packer.toBlob(doc);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${documentType || 'document'}.docx`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4 mb-12">
        <h2 className="text-4xl font-black text-zinc-900 tracking-tighter font-display">{t.aiFormAutomation}</h2>
        <p className="text-zinc-500 max-w-xl mx-auto text-lg">
          {t.aiFormAutomationDesc}
        </p>
      </div>

      {/* Mode Selector */}
      <div className="flex bg-zinc-100 p-1.5 rounded-2xl w-fit mx-auto">
        <button
          onClick={() => setMode('single')}
          className={cn(
            "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2",
            mode === 'single' ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-400 hover:text-zinc-600"
          )}
        >
          <FileText size={16} />
          {t.singleScan}
        </button>
        <button
          onClick={() => setMode('template')}
          className={cn(
            "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2",
            mode === 'template' ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-400 hover:text-zinc-600"
          )}
        >
          <Layers size={16} />
          {t.templateMapping}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        <div className="p-6 bg-zinc-50 rounded-3xl border border-zinc-100 space-y-3">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-blue-500 font-black">1</div>
          <h4 className="font-black text-xs uppercase tracking-widest text-zinc-900">{t.upload}</h4>
          <p className="text-[10px] text-zinc-500 font-medium leading-relaxed">
            {mode === 'single' 
              ? t.uploadDescSingle 
              : t.uploadDescTemplate}
          </p>
        </div>
        <div className="p-6 bg-zinc-50 rounded-3xl border border-zinc-100 space-y-3">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-blue-500 font-black">2</div>
          <h4 className="font-black text-xs uppercase tracking-widest text-zinc-900">{t.aiOcr}</h4>
          <p className="text-[10px] text-zinc-500 font-medium leading-relaxed">
            {t.aiOcrDesc}
          </p>
        </div>
        <div className="p-6 bg-zinc-50 rounded-3xl border border-zinc-100 space-y-3">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-blue-500 font-black">3</div>
          <h4 className="font-black text-xs uppercase tracking-widest text-zinc-900">{t.export}</h4>
          <p className="text-[10px] text-zinc-500 font-medium leading-relaxed">
            {t.exportDesc}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Section */}
        <div className="space-y-6">
          {mode === 'single' ? (
            <div 
              {...getSingleProps()} 
              className={cn(
                "border-4 border-dashed rounded-[2.5rem] p-12 text-center transition-all cursor-pointer group",
                isSingleActive ? "border-blue-500 bg-blue-50" : "border-zinc-100 hover:border-zinc-200 bg-zinc-50"
              )}
            >
              <input {...getSingleInputProps()} />
              {singlePreview ? (
                <div className="space-y-4">
                  <img src={singlePreview} alt="Preview" className="max-h-64 mx-auto rounded-2xl shadow-lg" />
                  <p className="text-sm font-bold text-zinc-500">{t.replaceImage}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                    <FileUp size={32} className="text-blue-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-zinc-900">{t.uploadDocument}</h3>
                    <p className="text-zinc-500 text-sm mt-1">{t.dragDropScan}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Template Upload */}
                <div 
                  {...getTemplateProps()} 
                  className={cn(
                    "border-2 border-dashed rounded-3xl p-6 text-center transition-all cursor-pointer",
                    isTemplateActive ? "border-blue-500 bg-blue-50" : "border-zinc-100 hover:border-zinc-200 bg-zinc-50"
                  )}
                >
                  <input {...getTemplateInputProps()} />
                  {templatePreview ? (
                    <div className="space-y-2">
                      <img src={templatePreview} alt="Template" className="max-h-32 mx-auto rounded-xl shadow-sm" />
                      <p className="text-[10px] font-bold text-zinc-400 uppercase">{t.blankTemplate}</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Layers size={24} className="mx-auto text-zinc-300" />
                      <p className="text-xs font-bold text-zinc-500">{t.uploadBlankTemplate}</p>
                    </div>
                  )}
                </div>

                {/* Data Upload */}
                <div 
                  {...getDataProps()} 
                  className={cn(
                    "border-2 border-dashed rounded-3xl p-6 text-center transition-all cursor-pointer",
                    isDataActive ? "border-blue-500 bg-blue-50" : "border-zinc-100 hover:border-zinc-200 bg-zinc-50"
                  )}
                >
                  <input {...getDataInputProps()} />
                  {dataPreview ? (
                    <div className="space-y-2">
                      <img src={dataPreview} alt="Data" className="max-h-32 mx-auto rounded-xl shadow-sm" />
                      <p className="text-[10px] font-bold text-zinc-400 uppercase">{t.sourceDocument}</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <FileText size={24} className="mx-auto text-zinc-300" />
                      <p className="text-xs font-bold text-zinc-500">{t.uploadSourceData}</p>
                    </div>
                  )}
                </div>
              </div>
              
              {templateFile && dataFile && (
                <div className="flex items-center justify-center gap-4 text-zinc-400">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-500" />
                    <span className="text-xs font-bold">{t.templateReady}</span>
                  </div>
                  <ArrowRight size={16} />
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-500" />
                    <span className="text-xs font-bold">{t.dataReady}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          <button
            onClick={runOCR}
            disabled={isProcessing || (mode === 'single' ? !singleFile : (!templateFile || !dataFile))}
            className={cn(
              "w-full py-5 rounded-[2rem] font-black text-lg transition-all flex items-center justify-center gap-3 shadow-xl",
              isProcessing ? "bg-zinc-100 text-zinc-400" : "bg-zinc-900 text-white hover:bg-zinc-800 shadow-zinc-200"
            )}
          >
            {isProcessing ? (
              <>
                <Loader2 size={24} className="animate-spin" />
                {t.aiReading}
              </>
            ) : (
              <>
                <CheckCircle2 size={24} />
                {t.startAiOcr}
              </>
            )}
          </button>

          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-bold">
              <AlertCircle size={18} />
              {error}
            </div>
          )}
        </div>

        {/* Form Section */}
        <div className="bg-white border border-zinc-100 rounded-[2.5rem] p-8 shadow-sm print:shadow-none print:border-none print:p-0">
          <div className="flex items-center justify-between mb-8 print:hidden">
            <h3 className="text-2xl font-black text-zinc-900 tracking-tight">{t.reviewExport}</h3>
            <div className="flex gap-2">
              <button 
                onClick={addField}
                className="p-3 bg-zinc-100 text-zinc-600 rounded-2xl hover:bg-zinc-200 transition-all"
                title="Add Field"
              >
                <Plus size={20} />
              </button>
              <button 
                onClick={handleExportWord}
                disabled={fields.length === 0}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 disabled:opacity-50"
              >
                <FileDown size={20} />
                {t.exportWord}
              </button>
            </div>
          </div>

          <div id="printable-form" className="space-y-6">
            <div className="border-b-4 border-zinc-900 pb-4 mb-8">
              <div className="flex flex-col gap-4">
                <div className="relative">
                  <input 
                    type="text" 
                    value={documentType || ""}
                    onChange={(e) => setDocumentType(e.target.value)}
                    placeholder={t.documentTitle}
                    className={cn(
                      "text-3xl font-black text-zinc-900 w-full outline-none bg-transparent placeholder:text-zinc-200 transition-all",
                      !isTypeConfirmed && fields.length > 0 ? "ring-4 ring-blue-500/20 bg-blue-50/30 p-2 rounded-xl" : ""
                    )}
                  />
                  {!isTypeConfirmed && fields.length > 0 && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-2xl border border-blue-100 flex flex-col gap-3 animate-in fade-in slide-in-from-top-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-black text-blue-600 uppercase tracking-widest">{t.confirmType}</p>
                        <button 
                          onClick={handleConfirmType}
                          className="px-4 py-1.5 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-blue-700 transition-all"
                        >
                          {t.confirm}
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className="text-[10px] text-zinc-400 font-bold uppercase py-1">{t.typeSuggestions}</span>
                        {[t.salaryCertificate, t.tdsCertificate, t.bankStatement, t.invoice, t.mushak63, t.taxCertificate].map((suggestion) => (
                          <button
                            key={suggestion}
                            onClick={() => setDocumentType(suggestion)}
                            className="px-3 py-1 bg-white border border-zinc-200 rounded-full text-[10px] font-bold text-zinc-600 hover:border-blue-500 hover:text-blue-600 transition-all"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                      {documentType.toLowerCase().includes('invoice') && (
                        <p className="text-[10px] text-blue-500 font-bold italic">
                          ✨ {t.prefillInvoice}
                        </p>
                      )}
                    </div>
                  )}
                </div>
                <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest">{t.autoGenerated}</p>
              </div>
            </div>

            {fields.length === 0 && !isProcessing && (
              <div className="py-20 text-center space-y-4">
                <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mx-auto">
                  <FileText size={32} className="text-zinc-200" />
                </div>
                <p className="text-zinc-400 font-bold">{t.noFieldsExtracted}</p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-6">
              {fields.map((field) => (
                <div key={field.id} className="group relative">
                  <div className="flex flex-col gap-1">
                    <input 
                      type="text"
                      value={field.label || ""}
                      onChange={(e) => updateField(field.id, 'label', e.target.value)}
                      className="text-[10px] font-black text-zinc-400 uppercase tracking-widest outline-none bg-transparent w-full"
                    />
                    <input 
                      type="text"
                      value={field.value || ""}
                      onChange={(e) => updateField(field.id, 'value', e.target.value)}
                      className="text-lg font-bold text-zinc-900 w-full border-b-2 border-zinc-100 focus:border-blue-500 outline-none pb-2 transition-all"
                    />
                  </div>
                  <button 
                    onClick={() => removeField(field.id)}
                    className="absolute -right-2 top-0 p-2 text-zinc-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all print:hidden"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-12 pt-8 border-t border-zinc-100 text-center hidden print:block">
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{t.verificationId}: {Math.random().toString(36).substring(7).toUpperCase()}</p>
              <p className="text-[8px] text-zinc-300 mt-1">{t.autoGenerated}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
