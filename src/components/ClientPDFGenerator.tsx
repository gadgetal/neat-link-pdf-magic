import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Download, FileText, Globe } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const ClientPDFGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [textContent, setTextContent] = useState('');
  const [filename, setFilename] = useState('document');
  const [url, setUrl] = useState('');

  const generateTextPDF = async () => {
    if (!textContent.trim()) {
      toast.error('Please enter some text content');
      return;
    }

    setIsGenerating(true);
    try {
      const pdf = new jsPDF();
      
      // Set font
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(12);
      
      // Split text into lines to fit page width
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 20;
      const maxLineWidth = pageWidth - (margin * 2);
      
      const lines = pdf.splitTextToSize(textContent, maxLineWidth);
      
      // Add text to PDF
      let yPosition = 30;
      const lineHeight = 7;
      
      lines.forEach((line: string) => {
        // Check if we need a new page
        if (yPosition > pdf.internal.pageSize.getHeight() - 20) {
          pdf.addPage();
          yPosition = 30;
        }
        
        pdf.text(line, margin, yPosition);
        yPosition += lineHeight;
      });
      
      // Save the PDF
      pdf.save(`${filename || 'document'}.pdf`);
      toast.success('PDF generated successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateWebpagePDF = async () => {
    if (!url.trim()) {
      toast.error('Please enter a URL');
      return;
    }

    // Simple URL validation
    try {
      new URL(url);
    } catch {
      toast.error('Please enter a valid URL');
      return;
    }

    setIsGenerating(true);
    try {
      // Create an iframe to load the webpage
      const iframe = document.createElement('iframe');
      iframe.src = url;
      iframe.style.position = 'absolute';
      iframe.style.left = '-9999px';
      iframe.style.width = '1024px';
      iframe.style.height = '768px';
      
      document.body.appendChild(iframe);
      
      // Wait for iframe to load
      await new Promise((resolve, reject) => {
        iframe.onload = resolve;
        iframe.onerror = reject;
        setTimeout(reject, 10000); // 10 second timeout
      });

      // Capture the iframe content
      const canvas = await html2canvas(iframe.contentDocument?.body || iframe, {
        useCORS: true,
        allowTaint: true,
        scale: 1
      });
      
      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');
      
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      
      let position = 0;
      
      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      // Clean up
      document.body.removeChild(iframe);
      
      // Save PDF
      pdf.save(`${filename || 'webpage'}.pdf`);
      toast.success('PDF generated successfully!');
    } catch (error) {
      console.error('Error generating webpage PDF:', error);
      toast.error('Failed to generate PDF from webpage. Please check if the URL is accessible.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">PDF Generator</h1>
          <p className="text-muted-foreground">Generate PDFs from text or web pages - no API key required!</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Create PDF
            </CardTitle>
            <CardDescription>
              Choose how you want to create your PDF document
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="filename">Filename (optional)</Label>
                <Input
                  id="filename"
                  placeholder="Enter filename (without .pdf extension)"
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                />
              </div>

              <Tabs defaultValue="text" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="text" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Text to PDF
                  </TabsTrigger>
                  <TabsTrigger value="webpage" className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Webpage to PDF
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="text" className="space-y-4">
                  <div>
                    <Label htmlFor="text-content">Text Content</Label>
                    <Textarea
                      id="text-content"
                      placeholder="Enter the text content you want to convert to PDF..."
                      value={textContent}
                      onChange={(e) => setTextContent(e.target.value)}
                      rows={10}
                      className="resize-none"
                    />
                  </div>
                  <Button 
                    onClick={generateTextPDF}
                    disabled={isGenerating || !textContent.trim()}
                    className="w-full"
                  >
                    {isGenerating ? (
                      <>Generating PDF...</>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        Generate Text PDF
                      </>
                    )}
                  </Button>
                </TabsContent>

                <TabsContent value="webpage" className="space-y-4">
                  <div>
                    <Label htmlFor="webpage-url">Website URL</Label>
                    <Input
                      id="webpage-url"
                      placeholder="https://example.com"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      type="url"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Note: Some websites may not load due to CORS restrictions
                    </p>
                  </div>
                  <Button 
                    onClick={generateWebpagePDF}
                    disabled={isGenerating || !url.trim()}
                    className="w-full"
                  >
                    {isGenerating ? (
                      <>Generating PDF...</>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        Generate Webpage PDF
                      </>
                    )}
                  </Button>
                </TabsContent>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-muted/30">
          <CardHeader>
            <CardTitle className="text-lg">Features</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Generate PDFs from text content</li>
              <li>• Convert web pages to PDF (CORS permitting)</li>
              <li>• No API key or external service required</li>
              <li>• Works completely in your browser</li>
              <li>• Custom filename support</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClientPDFGenerator;