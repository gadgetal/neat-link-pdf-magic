import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Sparkles, Heart, Download, FileText, Loader2 } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export const PDFGenerator = () => {
  const [url, setUrl] = useState("");
  const [filename, setFilename] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pdfGenerated, setPdfGenerated] = useState(false);

  const isValidUrl = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const generatePDF = async () => {
    if (!url.trim()) {
      toast.error("Please enter a URL to convert! 🌐");
      return;
    }

    if (!isValidUrl(url)) {
      toast.error("Please enter a valid URL! ✨");
      return;
    }

    setIsLoading(true);
    setPdfGenerated(false);

    try {
      // Create an iframe to load the website
      const iframe = document.createElement('iframe');
      iframe.style.width = '1200px';
      iframe.style.height = '800px';
      iframe.style.position = 'absolute';
      iframe.style.top = '-9999px';
      iframe.style.left = '-9999px';
      iframe.style.border = 'none';
      
      document.body.appendChild(iframe);
      
      // Load the website
      iframe.src = url;
      
      // Wait for the iframe to load
      await new Promise((resolve, reject) => {
        iframe.onload = resolve;
        iframe.onerror = reject;
        // Timeout after 10 seconds
        setTimeout(reject, 10000);
      });
      
      // Wait a bit more for content to render
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Capture the iframe content
      const canvas = await html2canvas(iframe.contentDocument?.body || iframe.contentWindow?.document.body, {
        allowTaint: true,
        useCORS: true,
        scale: 0.75,
        width: 1200,
        height: 800
      });
      
      // Remove the iframe
      document.body.removeChild(iframe);
      
      // Create PDF with the captured content
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');
      
      // Add header
      pdf.setFontSize(16);
      pdf.setTextColor(138, 43, 226);
      pdf.text('PDF Magic ✨', 20, 15);
      
      // Add URL
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      const urlLines = pdf.splitTextToSize(`Website: ${url}`, 170);
      pdf.text(urlLines, 20, 25);
      
      // Add the website screenshot
      const imgWidth = 170; // A4 width minus margins
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Check if image fits on one page
      if (imgHeight <= 250) {
        pdf.addImage(imgData, 'PNG', 20, 35, imgWidth, imgHeight);
      } else {
        // Split across multiple pages if needed
        const pageHeight = 250;
        let remainingHeight = imgHeight;
        let yPosition = 35;
        let pageCount = 0;
        
        while (remainingHeight > 0) {
          if (pageCount > 0) {
            pdf.addPage();
            yPosition = 20;
          }
          
          const currentHeight = Math.min(pageHeight, remainingHeight);
          const sourceY = pageCount * (canvas.height * pageHeight) / imgHeight;
          const sourceHeight = (canvas.height * currentHeight) / imgHeight;
          
          // Create a temporary canvas for this section
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = canvas.width;
          tempCanvas.height = sourceHeight;
          const tempCtx = tempCanvas.getContext('2d');
          
          if (tempCtx) {
            tempCtx.drawImage(canvas, 0, sourceY, canvas.width, sourceHeight, 0, 0, canvas.width, sourceHeight);
            const tempImgData = tempCanvas.toDataURL('image/png');
            pdf.addImage(tempImgData, 'PNG', 20, yPosition, imgWidth, currentHeight);
          }
          
          remainingHeight -= pageHeight;
          pageCount++;
        }
      }
      
      // Add footer
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text(`Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 20, 285);
      
      // Save the PDF
      const fileName = filename.trim() ? `${filename.trim()}.pdf` : `website-${Date.now()}.pdf`;
      pdf.save(fileName);
      
      setPdfGenerated(true);
      toast.success("Website captured and PDF downloaded successfully! 💖");
      
    } catch (error) {
      console.error("Error capturing website:", error);
      
      // Fallback: Try to fetch website content as text and create a basic PDF
      try {
        const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
        const data = await response.json();
        
        const pdf = new jsPDF('p', 'mm', 'a4');
        
        // Add header
        pdf.setFontSize(20);
        pdf.setTextColor(138, 43, 226);
        pdf.text('Website Content ✨', 20, 30);
        
        // Add URL
        pdf.setFontSize(12);
        pdf.setTextColor(0, 0, 0);
        const urlLines = pdf.splitTextToSize(`URL: ${url}`, 170);
        pdf.text(urlLines, 20, 45);
        
        // Add content preview
        pdf.setFontSize(10);
        pdf.text('Content Preview:', 20, 65);
        
        // Extract and clean text content
        const parser = new DOMParser();
        const doc = parser.parseFromString(data.contents, 'text/html');
        const textContent = doc.body?.textContent || doc.textContent || 'Unable to extract content';
        const cleanText = textContent.replace(/\s+/g, ' ').trim().substring(0, 2000);
        
        const contentLines = pdf.splitTextToSize(cleanText, 170);
        pdf.text(contentLines, 20, 80);
        
        const fileName = filename.trim() ? `${filename.trim()}.pdf` : `website-content-${Date.now()}.pdf`;
        pdf.save(fileName);
        
        setPdfGenerated(true);
        toast.success("Website content extracted and PDF created! 📄");
        
      } catch (fallbackError) {
        console.error("Fallback failed:", fallbackError);
        toast.error("Unable to capture website. Please try a different URL! 🔄");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const generateAnother = () => {
    setPdfGenerated(false);
    setUrl("");
    setFilename("");
  };

  return (
    <div className="min-h-screen bg-gradient-soft flex items-center justify-center p-4">
      <div className="w-full max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="bg-gradient-primary p-4 rounded-full shadow-soft animate-float">
              <FileText className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground">
            PDF Magic ✨
          </h1>
          <p className="text-xl text-muted-foreground">
            Turn any website into a beautiful PDF - No API key needed! ✨
          </p>
        </div>


        {/* URL Input */}
        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <label htmlFor="url" className="text-sm font-medium text-foreground flex items-center gap-2">
                <Heart className="h-4 w-4 text-primary animate-pulse-soft" />
                Website URL
              </label>
              <Input
                id="url"
                type="url"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="border-primary/20 focus:border-primary focus:ring-primary/20"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isLoading) {
                    generatePDF();
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="filename" className="text-sm font-medium text-foreground flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary animate-pulse-soft" />
                PDF File Name (Optional)
              </label>
              <Input
                id="filename"
                type="text"
                placeholder="my-website-pdf"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                className="border-primary/20 focus:border-primary focus:ring-primary/20"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isLoading) {
                    generatePDF();
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty for automatic naming
              </p>
            </div>
            <Button
              onClick={generatePDF}
              disabled={isLoading}
              className="w-full bg-gradient-primary hover:scale-105 transition-all duration-200 shadow-soft text-lg py-6 border-0"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creating your magical PDF...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5 animate-bounce-gentle" />
                  Generate PDF ✨
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Success Result */}
        {pdfGenerated && (
          <Card className="bg-gradient-card border-0 shadow-soft animate-[fadeIn_0.5s_ease-out]">
            <CardContent className="p-6 text-center space-y-4">
              <div className="flex justify-center">
                <div className="bg-primary/10 p-3 rounded-full">
                  <Heart className="h-6 w-6 text-primary animate-pulse-soft" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-foreground">
                PDF Downloaded Successfully! 💖
              </h3>
              <p className="text-muted-foreground">
                Your PDF has been automatically downloaded. Check your downloads folder!
              </p>
              <Button
                onClick={generateAnother}
                className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-gentle hover:scale-105 transition-all duration-200"
                size="lg"
              >
                <Sparkles className="mr-2 h-5 w-5" />
                Generate Another PDF
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Made with ❤️ for your moments
          </p>
        </div>
      </div>
    </div>
  );
};