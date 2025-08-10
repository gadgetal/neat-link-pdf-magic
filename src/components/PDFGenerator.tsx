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
      toast("Opening website to capture...", { duration: 3000 });
      
      // Open the website in a new window for capture
      const newWindow = window.open(url, '_blank', 'width=1200,height=800,scrollbars=yes');
      
      if (!newWindow) {
        throw new Error('Popup blocked');
      }

      // Wait for the page to load
      await new Promise((resolve, reject) => {
        const checkLoaded = () => {
          try {
            if (newWindow.document.readyState === 'complete') {
              resolve(true);
            } else {
              setTimeout(checkLoaded, 500);
            }
          } catch (error) {
            // Cross-origin error, assume loaded
            setTimeout(() => resolve(true), 3000);
          }
        };
        
        newWindow.onload = () => {
          setTimeout(() => resolve(true), 2000); // Extra wait for content
        };
        
        setTimeout(() => reject(new Error('Timeout')), 15000);
        checkLoaded();
      });

      toast("Capturing website content...", { duration: 3000 });

      // Capture the window content
      const canvas = await html2canvas(newWindow.document.body, {
        allowTaint: true,
        useCORS: true,
        scale: 0.7,
        width: 1200,
        height: 800,
        scrollX: 0,
        scrollY: 0
      });

      // Close the popup window
      newWindow.close();

      // Create PDF with the captured content
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/jpeg', 0.8);
      
      // Add title
      pdf.setFontSize(14);
      pdf.setTextColor(138, 43, 226);
      pdf.text('Website Screenshot ✨', 20, 15);
      
      // Add URL
      pdf.setFontSize(8);
      pdf.setTextColor(100, 100, 100);
      const urlLines = pdf.splitTextToSize(`${url}`, 170);
      pdf.text(urlLines, 20, 25);
      
      // Calculate image dimensions to fit page
      const pageWidth = 170; // A4 width minus margins
      const pageHeight = 240; // Available height on page
      
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      if (imgHeight <= pageHeight) {
        // Fits on one page
        pdf.addImage(imgData, 'JPEG', 20, 35, imgWidth, imgHeight);
      } else {
        // Split across multiple pages
        let yOffset = 0;
        let remainingHeight = imgHeight;
        let pageCount = 0;
        
        while (remainingHeight > 0) {
          if (pageCount > 0) {
            pdf.addPage();
          }
          
          const currentPageHeight = Math.min(pageHeight, remainingHeight);
          const sourceY = yOffset * canvas.height / imgHeight;
          const sourceHeight = currentPageHeight * canvas.height / imgHeight;
          
          // Create temporary canvas for this section
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = canvas.width;
          tempCanvas.height = sourceHeight;
          const tempCtx = tempCanvas.getContext('2d');
          
          if (tempCtx) {
            tempCtx.drawImage(canvas, 0, sourceY, canvas.width, sourceHeight, 0, 0, canvas.width, sourceHeight);
            const tempImgData = tempCanvas.toDataURL('image/jpeg', 0.8);
            pdf.addImage(tempImgData, 'JPEG', 20, pageCount === 0 ? 35 : 20, imgWidth, currentPageHeight);
          }
          
          yOffset += currentPageHeight;
          remainingHeight -= currentPageHeight;
          pageCount++;
        }
      }
      
      // Add footer on last page
      const pageCount = pdf.getNumberOfPages();
      pdf.setPage(pageCount);
      pdf.setFontSize(6);
      pdf.setTextColor(150, 150, 150);
      pdf.text(`Generated on ${new Date().toLocaleDateString()}`, 20, 285);
      
      // Save the PDF
      const fileName = filename.trim() ? `${filename.trim()}.pdf` : `website-screenshot-${Date.now()}.pdf`;
      pdf.save(fileName);
      
      setPdfGenerated(true);
      toast.success("Website captured and PDF downloaded! 🎉");
      
    } catch (error) {
      console.error("Error capturing website:", error);
      
      // Fallback: Create a simple PDF with website info
      try {
        const pdf = new jsPDF('p', 'mm', 'a4');
        
        // Add header
        pdf.setFontSize(24);
        pdf.setTextColor(138, 43, 226);
        pdf.text('Website PDF ✨', 20, 30);
        
        // Add URL
        pdf.setFontSize(14);
        pdf.setTextColor(0, 0, 0);
        pdf.text('Website URL:', 20, 55);
        
        pdf.setFontSize(12);
        pdf.setTextColor(25, 118, 210);
        const urlLines = pdf.splitTextToSize(url, 170);
        pdf.text(urlLines, 20, 70);
        
        // Add note
        pdf.setFontSize(11);
        pdf.setTextColor(0, 0, 0);
        pdf.text('Note: Unable to capture website screenshot.', 20, 100);
        pdf.text('This might be due to browser security restrictions.', 20, 115);
        pdf.text('The website is accessible at the URL above.', 20, 130);
        
        // Add instructions
        pdf.setFontSize(12);
        pdf.setTextColor(255, 87, 34);
        pdf.text('How to view this website:', 20, 160);
        
        pdf.setFontSize(10);
        pdf.setTextColor(0, 0, 0);
        pdf.text('1. Copy the URL above', 25, 175);
        pdf.text('2. Open your web browser', 25, 190);
        pdf.text('3. Paste the URL and press Enter', 25, 205);
        
        const fileName = filename.trim() ? `${filename.trim()}.pdf` : `website-info-${Date.now()}.pdf`;
        pdf.save(fileName);
        
        setPdfGenerated(true);
        toast.success("PDF created with website information! 📄");
        
      } catch (fallbackError) {
        console.error("Fallback failed:", fallbackError);
        toast.error("Unable to create PDF. Please try again! 🔄");
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