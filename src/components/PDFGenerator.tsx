import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Sparkles, Heart, Download, FileText, Loader2, Settings } from "lucide-react";

interface PDFResponse {
  success: boolean;
  url: string;
  filesize: number;
  pdf?: string;
}

export const PDFGenerator = () => {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pdfResult, setPdfResult] = useState<PDFResponse | null>(null);
  const [apiKey, setApiKey] = useState("aa1ea615-c5ef-4049-8eb2-928b6c881024");
  const [selectedService, setSelectedService] = useState("api2pdf");

  const isValidUrl = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const generatePDF = async () => {
    if (selectedService === "api2pdf" && !apiKey.trim()) {
      toast.error("Please enter your API2PDF API key first! 🔑");
      return;
    }

    if (!url.trim()) {
      toast.error("Please enter a URL to convert! 🌐");
      return;
    }

    if (!isValidUrl(url)) {
      toast.error("Please enter a valid URL! ✨");
      return;
    }

    setIsLoading(true);
    setPdfResult(null);

    try {
      if (selectedService === "api2pdf") {
        await generateWithAPI2PDF();
      } else if (selectedService === "htmlcsstoimage") {
        toast.error("HTML/CSS to Image service coming soon! 🚀");
        setIsLoading(false);
        return;
      } else if (selectedService === "puppeteer") {
        toast.error("Puppeteer service coming soon! 🚀");
        setIsLoading(false);
        return;
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Oops! Something went wrong. Please try again! 🥺");
    } finally {
      setIsLoading(false);
    }
  };

  const generateWithAPI2PDF = async () => {
    // Using API2PDF for better PDF generation
    const response = await fetch("https://v2.api2pdf.com/chrome/pdf/url", {
      method: "POST",
      headers: {
        "Authorization": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: url,
        inlinePdf: true,
        fileName: "complete-website.pdf",
        options: {
          displayHeaderFooter: false,
          printBackground: true,
          format: "A4",
          landscape: false,
          preferCSSPageSize: false,
          generateTaggedPDF: false,
          waitTime: 5000,
          emulateMedia: "screen",
          fullPage: true,
          viewport: {
            width: 1920,
            height: 1080,
            deviceScaleFactor: 1
          },
          margin: {
            top: "0.2in",
            bottom: "0.2in",
            left: "0.2in",
            right: "0.2in"
          },
          extraHTTPHeaders: {
            'Accept-Language': 'en-US,en;q=0.9'
          }
        }
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.FileUrl) {
        const result: PDFResponse = {
          success: true,
          url: data.FileUrl,
          filesize: data.MbOut * 1024 * 1024, // Convert MB to bytes
          pdf: data.FileUrl
        };
        setPdfResult(result);
        toast.success("Your lovely PDF is ready! 💖");
      } else {
        toast.error("Failed to generate PDF - no download link received");
      }
    } else {
      const errorData = await response.json();
      toast.error(`Error: ${errorData.error || "Failed to generate PDF"}`);
    }
  };

  const downloadPDF = () => {
    if (pdfResult?.url) {
      const link = document.createElement("a");
      link.href = pdfResult.url;
      link.download = `webpage-${Date.now()}.pdf`;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Download started! Enjoy your PDF! 🎉");
    }
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
            Let's turn this into a beautiful PDF for you ✨
          </p>
        </div>

        {/* API Key Input - Only show for services that need it */}
        {selectedService === "api2pdf" && (
          <Card className="bg-gradient-card border-0 shadow-soft">
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <label htmlFor="apiKey" className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Your API2PDF API Key
                </label>
                <Input
                  id="apiKey"
                  type="text"
                  placeholder="Enter your API2PDF API key..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="border-primary/20 focus:border-primary focus:ring-primary/20"
                />
                <p className="text-xs text-muted-foreground">
                  Get your API key from{" "}
                  <a
                    href="https://api2pdf.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    api2pdf.com
                  </a>
                  {" "}(Free trial available)
                </p>
              </div>
            </CardContent>
          </Card>
        )}


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
            
            {/* PDF Service Selection */}
            <div className="space-y-2">
              <label htmlFor="service" className="text-sm font-medium text-foreground flex items-center gap-2">
                <Settings className="h-4 w-4" />
                PDF Service
              </label>
              <Select value={selectedService} onValueChange={setSelectedService}>
                <SelectTrigger className="border-primary/20 focus:border-primary focus:ring-primary/20">
                  <SelectValue placeholder="Choose PDF service" />
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-lg z-50">
                  <SelectItem value="api2pdf" className="hover:bg-accent">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>API2PDF</span>
                      <span className="text-xs text-muted-foreground">(Premium Quality)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="htmlcsstoimage" className="hover:bg-accent">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>HTML/CSS to Image</span>
                      <span className="text-xs text-muted-foreground">(Alternative)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="puppeteer" className="hover:bg-accent">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span>Puppeteer</span>
                      <span className="text-xs text-muted-foreground">(Open Source)</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Choose your preferred PDF generation service
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
        {pdfResult && (
          <Card className="bg-gradient-card border-0 shadow-soft animate-[fadeIn_0.5s_ease-out]">
            <CardContent className="p-6 text-center space-y-4">
              <div className="flex justify-center">
                <div className="bg-primary/10 p-3 rounded-full">
                  <Heart className="h-6 w-6 text-primary animate-pulse-soft" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-foreground">
                Here's your lovely PDF 💖
              </h3>
              <p className="text-muted-foreground">
                Click below to download and keep it forever!
              </p>
              <Button
                onClick={downloadPDF}
                className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-gentle hover:scale-105 transition-all duration-200"
                size="lg"
              >
                <Download className="mr-2 h-5 w-5" />
                Download PDF
              </Button>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Size: {(pdfResult.filesize / 1024 / 1024).toFixed(2)} MB</p>
                <p>Generated with API2PDF</p>
              </div>
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