'use client';

import { useState } from 'react';

type AuditCheck = {
  label: string;
  passed: boolean;
  detail: string;
};

type ContentAudit = {
  score: number;
  verdict: string;
  checks: AuditCheck[];
  notes: string[];
};

export default function Home() {
  const [keyword, setKeyword] = useState('');
  const [output, setOutput] = useState('');
  const [audit, setAudit] = useState<ContentAudit | null>(null);
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
    setAudit(null);
    setError('');

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword, tone, industry }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.result || 'Something went wrong.');
        return;
      }

      setOutput(data.result);
      setAudit(data.audit || null);
    } catch (err) {
      console.error('Error generating content:', err);
      setError('Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">AI Overview Content Generator</h1>

      <input
        type="text"
        placeholder="Enter a keyword or topic..."
        className="w-full p-2 border rounded mb-2"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
      />

      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="text-sm text-blue-600 underline mb-2"
      >
        {showAdvanced ? 'Hide' : 'Show'} Advanced Settings
      </button>

      {showAdvanced && (
        <>
          <label className="block mb-2 font-semibold">Select Tone:</label>
          <select
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            className="w-full p-2 border rounded mb-4 bg-black"
          >
            <option value="Friendly">Friendly</option>
            <option value="Expert">Expert</option>
            <option value="Formal">Formal</option>
            <option value="Technical">Technical</option>
            <option value="Persuasive">Persuasive</option>
            <option value="Conversational">Conversational</option>
          </select>

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
        className="bg-blue-600 text-white px-4 py-2 rounded w-full disabled:opacity-60"
        disabled={loading || !keyword.trim()}
      >
        {loading ? 'Generating...' : 'Generate and Verify'}
      </button>

      {error && (
        <div className="mt-4 text-red-700 bg-red-100 p-3 rounded">
          {error}
        </div>
      )}

      {audit && (
        <section className="mt-6 border rounded p-4 bg-white text-black">
          <div className="flex items-center justify-between gap-4 mb-3">
            <div>
              <h2 className="text-lg font-semibold">AI Overview Readiness</h2>
              <p className="text-sm text-gray-700">{audit.verdict}</p>
            </div>
            <div className="text-2xl font-bold">{audit.score}%</div>
          </div>

          <div className="space-y-2">
            {audit.checks.map((check) => (
              <div key={check.label} className="border rounded p-3">
                <div className="font-medium">
                  {check.passed ? 'Pass' : 'Needs work'}: {check.label}
                </div>
                <p className="text-sm text-gray-700">{check.detail}</p>
              </div>
            ))}
          </div>

          <div className="mt-3 space-y-1">
            {audit.notes.map((note) => (
              <p key={note} className="text-xs text-gray-600">
                {note}
              </p>
            ))}
          </div>
        </section>
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
