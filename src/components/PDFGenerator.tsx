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
      // Create a new window to load the website
      const newWindow = window.open(url, '_blank', 'width=1200,height=800,scrollbars=yes');
      
      if (!newWindow) {
        throw new Error('Popup blocked. Please allow popups for this site.');
      }

      // Wait for the new window to load
      await new Promise((resolve, reject) => {
        const checkLoaded = () => {
          try {
            if (newWindow.document.readyState === 'complete') {
              resolve(true);
            } else {
              setTimeout(checkLoaded, 500);
            }
          } catch (e) {
            // Cross-origin error - window is loaded but we can't access it
            // Wait a bit more and assume it's loaded
            setTimeout(() => resolve(true), 3000);
          }
        };
        
        // Start checking after a short delay
        setTimeout(checkLoaded, 1000);
        
        // Timeout after 15 seconds
        setTimeout(() => reject(new Error('Website took too long to load')), 15000);
      });

      // Wait for dynamic content to load
      await new Promise(resolve => setTimeout(resolve, 3000));

      let canvas;
      try {
        // Try to capture the new window content
        canvas = await html2canvas(newWindow.document.body, {
          useCORS: true,
          allowTaint: true,
          scale: 0.6,
          width: 1200,
          height: 800,
          scrollX: 0,
          scrollY: 0
        });
      } catch (crossOriginError) {
        // If cross-origin, create a PDF with URL info instead
        newWindow.close();
        
        // Create a simple PDF with URL information
        const pdf = new jsPDF('p', 'mm', 'a4');
        
        // Add title
        pdf.setFontSize(20);
        pdf.text('Website PDF', 20, 30);
        
        // Add URL
        pdf.setFontSize(12);
        pdf.text(`URL: ${url}`, 20, 50);
        pdf.text('Note: Direct capture not possible due to security restrictions.', 20, 70);
        pdf.text('Please try a different website or use a screenshot tool.', 20, 85);
        
        // Save the PDF
        const fileName = `webpage-info-${Date.now()}.pdf`;
        pdf.save(fileName);
        
        setPdfGenerated(true);
        toast.success("PDF with URL info downloaded! For full capture, try public websites. 💖");
        return;
      }

      // Close the popup window
      newWindow.close();

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
      const fileName = `webpage-${Date.now()}.pdf`;
      pdf.save(fileName);
      
      setPdfGenerated(true);
      toast.success("Your lovely PDF is ready and downloaded! 💖");
      
    } catch (error) {
      console.error("Error generating PDF:", error);
      let errorMessage = "Oops! Couldn't capture the website. ";
      
      if (error.message.includes('Popup blocked')) {
        errorMessage += "Please allow popups and try again! 🚪";
      } else if (error.message.includes('took too long')) {
        errorMessage += "Website is taking too long to load. Try a faster website! ⏰";
      } else {
        errorMessage += "Please try a different URL! 🥺";
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const generateAnother = () => {
    setPdfGenerated(false);
    setUrl("");
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