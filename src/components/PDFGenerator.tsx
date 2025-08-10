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
      // Method 1: Try to fetch and render HTML content
      let htmlContent = '';
      let canCapture = false;

      try {
        const response = await fetch(url, {
          mode: 'cors',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        
        if (response.ok) {
          htmlContent = await response.text();
          canCapture = true;
        }
      } catch (fetchError) {
        console.log("CORS fetch failed, trying alternative method");
      }

      if (canCapture && htmlContent) {
        // Create a temporary div to render the HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;
        tempDiv.style.width = '1200px';
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        tempDiv.style.top = '0';
        document.body.appendChild(tempDiv);

        // Wait for images to load
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Capture the rendered content
        const canvas = await html2canvas(tempDiv, {
          useCORS: true,
          allowTaint: true,
          scale: 0.7,
          width: 1200,
          backgroundColor: '#ffffff'
        });

        // Clean up
        document.body.removeChild(tempDiv);

        // Create PDF from canvas
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgData = canvas.toDataURL('image/png');
        
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        
        const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
        const scaledWidth = imgWidth * ratio;
        const scaledHeight = imgHeight * ratio;
        
        const x = (pdfWidth - scaledWidth) / 2;
        const y = (pdfHeight - scaledHeight) / 2;

        pdf.addImage(imgData, 'PNG', x, y, scaledWidth, scaledHeight);
        
        // Save the PDF
        const fileName = filename.trim() ? `${filename.trim()}.pdf` : `webpage-${Date.now()}.pdf`;
        pdf.save(fileName);
        
        setPdfGenerated(true);
        toast.success("Your website PDF is ready and downloaded! 💖");
        
      } else {
        // Method 2: Create PDF with website information and instructions
        const pdf = new jsPDF('p', 'mm', 'a4');
        
        // Add header
        pdf.setFontSize(24);
        pdf.setTextColor(75, 0, 130);
        pdf.text('Website PDF Report', 20, 30);
        
        // Add URL
        pdf.setFontSize(14);
        pdf.setTextColor(0, 0, 0);
        pdf.text('Website URL:', 20, 50);
        pdf.setFontSize(12);
        pdf.setTextColor(0, 0, 255);
        pdf.text(url, 20, 60);
        
        // Add note
        pdf.setFontSize(10);
        pdf.setTextColor(100, 100, 100);
        pdf.text('Generated on: ' + new Date().toLocaleString(), 20, 80);
        
        // Add instructions
        pdf.setFontSize(12);
        pdf.setTextColor(0, 0, 0);
        pdf.text('Note: Direct website capture may be restricted by browser security.', 20, 100);
        pdf.text('For full website capture, try:', 20, 115);
        pdf.text('• Public websites without authentication', 25, 130);
        pdf.text('• Websites that allow cross-origin requests', 25, 145);
        pdf.text('• Or use browser extensions for screenshots', 25, 160);
        
        // Add QR code text (simulated)
        pdf.setFontSize(10);
        pdf.text('You can visit this URL directly:', 20, 180);
        pdf.setTextColor(0, 0, 255);
        pdf.text(url, 20, 190);
        
        // Save the PDF
        const fileName = filename.trim() ? `${filename.trim()}.pdf` : `website-info-${Date.now()}.pdf`;
        pdf.save(fileName);
        
        setPdfGenerated(true);
        toast.success("PDF with website info downloaded! 📄");
      }
      
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Couldn't generate PDF. Please try a different website! 🥺");
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