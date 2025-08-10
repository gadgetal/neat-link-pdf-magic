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
      toast("Creating PDF from website...", { duration: 5000 });
      
      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Use a simple and reliable screenshot service
      const screenshotUrl = `https://api.microlink.io/screenshot?url=${encodeURIComponent(url)}&viewport.width=1200&viewport.height=800&fullPage=true`;
      
      console.log('Using screenshot URL:', screenshotUrl);
      
      // Try to fetch the screenshot
      const response = await fetch(screenshotUrl);
      if (!response.ok) {
        throw new Error(`Screenshot API failed: ${response.status}`);
      }
      
      const blob = await response.blob();
      const imageUrl = URL.createObjectURL(blob);
      
      // Load the image
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = () => {
          console.log('Image loaded successfully:', img.width, 'x', img.height);
          resolve(undefined);
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = imageUrl;
      });
      
      // Add title
      pdf.setFontSize(16);
      pdf.setTextColor(138, 43, 226);
      pdf.text('Website PDF', 20, 20);
      
      // Add URL
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      const urlLines = pdf.splitTextToSize(url, 170);
      pdf.text(urlLines, 20, 30);
      
      // Calculate image dimensions
      const pageWidth = 170;
      const maxHeight = 240;
      const imgAspectRatio = img.width / img.height;
      let imgWidth = pageWidth;
      let imgHeight = pageWidth / imgAspectRatio;
      
      if (imgHeight > maxHeight) {
        imgHeight = maxHeight;
        imgWidth = maxHeight * imgAspectRatio;
      }
      
      // Add image to PDF
      pdf.addImage(img, 'JPEG', 20, 45, imgWidth, imgHeight);
      
      // Clean up
      URL.revokeObjectURL(imageUrl);
      
      // Add footer
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text(`Generated on ${new Date().toLocaleDateString()}`, 20, 285);
      
      // Save PDF
      const fileName = filename.trim() ? `${filename.trim()}.pdf` : `website-${Date.now()}.pdf`;
      pdf.save(fileName);
      
      setPdfGenerated(true);
      toast.success("Website PDF created successfully! 🎉");
      
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Unable to create PDF. Please check the URL and try again! 🔄");
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