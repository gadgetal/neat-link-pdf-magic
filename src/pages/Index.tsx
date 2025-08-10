const Index = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-4">
        <h1 className="text-2xl font-bold text-foreground">PDF Generator</h1>
        <div className="bg-card border rounded-lg p-6 space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-yellow-800 mb-2">Supabase Connection Required</h2>
            <p className="text-yellow-700 text-sm">
              To use the PDF generator, you need to connect your project to Supabase.
            </p>
          </div>
          <div className="text-left space-y-2">
            <p className="text-sm text-muted-foreground">Steps to connect:</p>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Click the green "Supabase" button (top right)</li>
              <li>Complete the connection process</li>
              <li>Your PDF generator will be activated</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
