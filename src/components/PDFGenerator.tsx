import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Sparkles, Heart, Download, FileText, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface PDFResponse {
  success: boolean;
  pdf: string;
  filename: string;
  mbOut: number;
  cost: number;
}

export const PDFGenerator = () => {
  const [url, setUrl] = useState("");
  const [filename, setFilename] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pdfResult, setPdfResult] = useState<PDFResponse | null>(null);

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
    setPdfResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('generate-pdf', {
        body: {
          url: url,
          filename: filename.trim() || undefined
        }
      });

      if (error) {
        throw error;
      }

      if (data.success) {
        setPdfResult(data);
        toast.success("Your lovely PDF is ready! 💖");
      } else {
        toast.error(`Error: ${data.error || "Failed to generate PDF"}`);
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Oops! Something went wrong. Please try again! 🥺");
    } finally {
      setIsLoading(false);
    }
  };

  const downloadPDF = () => {
    if (pdfResult?.pdf) {
      const link = document.createElement("a");
      link.href = pdfResult.pdf;
      link.download = pdfResult.filename;
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

        {/* Filename Input */}
        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <label htmlFor="filename" className="text-sm font-medium text-foreground flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                PDF Filename (Optional)
              </label>
              <Input
                id="filename"
                type="text"
                placeholder="my-document.pdf"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                className="border-primary/20 focus:border-primary focus:ring-primary/20"
              />
              <p className="text-xs text-muted-foreground">
                Leave empty for auto-generated filename
              </p>
            </div>
          </CardContent>
        </Card>

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
                <p>Size: {pdfResult.mbOut.toFixed(2)} MB</p>
                <p>Cost: ${pdfResult.cost.toFixed(4)}</p>
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