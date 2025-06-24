// app/page.tsx or pages/index.tsx (depending on your Next.js version)

'use client';

import { useState } from 'react';

export default function Home() {
  
  const [keyword, setKeyword] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [tone, setTone] = useState('Friendly');
  const [industry, setIndustry] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = () => {
    const blob = new Blob([output], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${keyword || 'ai-content'}.txt`;
    link.click();
  };

  const handleGenerate = async () => {
    setLoading(true);
    setOutput('');

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword, tone, industry }),
      });

      const data = await res.json();
      setOutput(data.result);
      setError('');
    } catch (err) {
      console.error('Error generating content:', err);
      setOutput('Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">AI Overview Content Generator</h1>

      <input
        type="text"
        placeholder="Enter a keyword or topic..."
        className="w-full p-2 border rounded mb-2"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
      />

      {/* 🔘 Advanced Settings Toggle */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="text-sm text-blue-600 underline mb-2"
      >
        {showAdvanced ? 'Hide' : 'Show'} Advanced Settings
      </button>

      {/* 🏭 Industry Selector */}
      {showAdvanced && (
        <>
          {/* 🎙️ Tone Selector */}
          <label className="block mb-2 font-semibold">Select Tone:</label>
          <select
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            className="w-full p-2 border rounded mb-4 bg-black"
          >
            <option value="Friendly">Friendly</option>
            <option value="Formal">Formal</option>
            <option value="Professional">Professional</option>
            <option value="Technical">Technical</option>
            <option value="Persuasive">Persuasive</option>
            <option value="Conversational">Conversational</option>
          </select>

          {/* 🏭 Industry Selector */}
          <label className="block mb-2 font-semibold">Select Industry:</label>
          <select
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            className="w-full p-2 border rounded mb-4 bg-black"
          >
            <option value="">General</option>
            <option value="Real Estate">Real Estate</option>
            <option value="Finance">Finance</option>
            <option value="Healthcare">Healthcare</option>
            <option value="E-commerce">E-commerce</option>
            <option value="Technology">Technology</option>
            <option value="Education">Education</option>
          </select>
        </>
      )}

      <button
        onClick={handleGenerate}
        className="bg-blue-600 text-white px-4 py-2 rounded w-full"
        disabled={loading}
  >
        {loading ? (
          <span className="flex items-center justify-center">
            <svg
              className="animate-spin mr-2 h-4 w-4 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              ></path>
            </svg>
            Generating...
          </span>
        ) : (
          'Generate'
        )}
      </button>

      {error && (
        <div className="mt-4 text-red-500 bg-red-100 p-2 rounded">
          {error}
        </div>
      )}
      {output && (
        <>
          <div className="mt-6 whitespace-pre-wrap bg-gray-100 p-4 rounded text-black">
            <div dangerouslySetInnerHTML={{ __html: output }} />
          </div>

          <div className="flex gap-2 mt-4">
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded"
              onClick={handleCopy}
            >
              {copied ? 'Copied!' : 'Copy to Clipboard'}
            </button>

            <button
              className="bg-green-600 text-white px-4 py-2 rounded"
              onClick={handleExport}
            >
              Export to .txt
            </button>
          </div>
        </>
      )}
    </main>
  );
}
