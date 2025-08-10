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
      toast("Loading website to capture...", { duration: 3000 });
      
      // Use screenshot service to capture the website
      const screenshotUrl = `https://api.screenshotone.com/take?access_key=demo&url=${encodeURIComponent(url)}&viewport_width=1200&viewport_height=800&device_scale_factor=2&format=png&full_page=true&delay=3`;
      
      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      try {
        // Try to load the screenshot
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = screenshotUrl;
          setTimeout(reject, 15000); // 15 second timeout
        });
        
        // Create canvas to process the image
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = img.width;
        canvas.height = img.height;
        
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          
          // Add title page
          pdf.setFontSize(18);
          pdf.setTextColor(138, 43, 226);
          pdf.text('Website Screenshot ✨', 20, 20);
          
          // Add URL
          pdf.setFontSize(10);
          pdf.setTextColor(0, 0, 0);
          const urlLines = pdf.splitTextToSize(url, 170);
          pdf.text(urlLines, 20, 30);
          
          // Calculate dimensions
          const pageWidth = 170; // A4 width minus margins
          const maxPageHeight = 250; // Available height
          
          const imgData = canvas.toDataURL('image/jpeg', 0.9);
          const imgWidth = pageWidth;
          const imgHeight = (img.height * imgWidth) / img.width;
          
          if (imgHeight <= maxPageHeight) {
            // Single page
            pdf.addImage(imgData, 'JPEG', 20, 40, imgWidth, imgHeight);
          } else {
            // Multiple pages
            const pages = Math.ceil(imgHeight / maxPageHeight);
            
            for (let i = 0; i < pages; i++) {
              if (i > 0) pdf.addPage();
              
              const yOffset = i * maxPageHeight;
              const currentHeight = Math.min(maxPageHeight, imgHeight - yOffset);
              
              // Create section canvas
              const sectionCanvas = document.createElement('canvas');
              const sectionCtx = sectionCanvas.getContext('2d');
              
              if (sectionCtx) {
                const sourceY = (yOffset * img.height) / imgHeight;
                const sourceHeight = (currentHeight * img.height) / imgHeight;
                
                sectionCanvas.width = img.width;
                sectionCanvas.height = sourceHeight;
                
                sectionCtx.drawImage(img, 0, sourceY, img.width, sourceHeight, 0, 0, img.width, sourceHeight);
                
                const sectionData = sectionCanvas.toDataURL('image/jpeg', 0.9);
                pdf.addImage(sectionData, 'JPEG', 20, i === 0 ? 40 : 20, imgWidth, currentHeight);
              }
            }
          }
        }
        
      } catch (screenshotError) {
        console.log("Screenshot service failed, trying iframe method...");
        
        // Fallback to iframe method
        const iframe = document.createElement('iframe');
        iframe.style.cssText = `
          position: fixed;
          top: -9999px;
          left: -9999px;
          width: 1200px;
          height: 800px;
          border: none;
          background: white;
        `;
        
        document.body.appendChild(iframe);
        
        // Configure iframe
        iframe.src = url;
        
        // Wait for load
        await new Promise((resolve, reject) => {
          iframe.onload = () => {
            setTimeout(resolve, 3000); // Wait for content
          };
          iframe.onerror = reject;
          setTimeout(reject, 12000);
        });
        
        // Capture iframe
        let canvas;
        try {
          canvas = await html2canvas(iframe.contentDocument?.body || document.createElement('div'), {
            allowTaint: true,
            useCORS: true,
            scale: 1,
            width: 1200,
            height: 800,
            backgroundColor: '#ffffff'
          });
        } catch (canvasError) {
          // If iframe content is blocked, capture the iframe element itself
          canvas = await html2canvas(iframe, {
            allowTaint: true,
            useCORS: true,
            scale: 1
          });
        }
        
        document.body.removeChild(iframe);
        
        if (canvas) {
          const imgData = canvas.toDataURL('image/jpeg', 0.8);
          const imgWidth = 170;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          
          pdf.addImage(imgData, 'JPEG', 20, 40, imgWidth, Math.min(imgHeight, 250));
        }
      }
      
      // Add footer
      const pageCount = pdf.getNumberOfPages();
      pdf.setPage(pageCount);
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text(`Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 20, 285);
      
      // Save PDF
      const fileName = filename.trim() ? `${filename.trim()}.pdf` : `website-screenshot-${Date.now()}.pdf`;
      pdf.save(fileName);
      
      setPdfGenerated(true);
      toast.success("Website PDF created successfully! 🎉");
      
    } catch (error) {
      console.error("Error generating PDF:", error);
      
      // Final fallback - create info PDF
      try {
        const pdf = new jsPDF('p', 'mm', 'a4');
        
        pdf.setFontSize(22);
        pdf.setTextColor(138, 43, 226);
        pdf.text('Website Information ✨', 20, 30);
        
        pdf.setFontSize(14);
        pdf.setTextColor(0, 0, 0);
        pdf.text('Website URL:', 20, 55);
        
        pdf.setFontSize(12);
        pdf.setTextColor(25, 118, 210);
        const urlLines = pdf.splitTextToSize(url, 170);
        pdf.text(urlLines, 20, 70);
        
        pdf.setFontSize(11);
        pdf.setTextColor(0, 0, 0);
        pdf.text('To view this website:', 20, 100);
        pdf.text('1. Copy the URL above', 25, 115);
        pdf.text('2. Open your web browser', 25, 130);
        pdf.text('3. Paste the URL and visit', 25, 145);
        
        pdf.setFontSize(10);
        pdf.setTextColor(100, 100, 100);
        pdf.text('Note: Visual capture was not available due to browser restrictions.', 20, 170);
        
        const fileName = filename.trim() ? `${filename.trim()}.pdf` : `website-info-${Date.now()}.pdf`;
        pdf.save(fileName);
        
        setPdfGenerated(true);
        toast.success("Website information PDF created! 📄");
        
      } catch (finalError) {
        console.error("Final fallback failed:", finalError);
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