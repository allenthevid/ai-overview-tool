// app/page.tsx or pages/index.tsx (depending on your Next.js version)

'use client';

import { useState } from 'react';

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setOutput('');

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword }),
      });

      const data = await res.json();
      setOutput(data.result);
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

      <button
        onClick={handleGenerate}
        className="bg-blue-600 text-white px-4 py-2 rounded"
        disabled={loading}
      >
        {loading ? 'Generating...' : 'Generate'}
      </button>

      {output && (
        <div className="mt-6 whitespace-pre-wrap bg-gray-100 p-4 rounded text-black">
          {output}
        </div>
      )}
    </main>
  );
}
