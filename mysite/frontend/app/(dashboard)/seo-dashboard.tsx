"use client";

import { useEffect, useState } from "react";

export function SeoDashboard() {
  const [data, setData] = useState<any>(null);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const WEBSITE_ID = 1;

  const fetchData = async () => {
    try {
      const res = await fetch(
        `http://127.0.0.1:8000/data/scraped-pages/?website_id=${WEBSITE_ID}`
      );
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCrawl = async () => {
    if (!url) {
      alert("Entre une URL");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(
        "http://127.0.0.1:8000/data/crawl-website/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            website_id: WEBSITE_ID,
            start_url: url,
            max_pages: 10,
          }),
        }
      );

      await res.json();

      setMessage("Analyse terminée !");
      fetchData();
    } catch (err) {
      setMessage("Erreur lors du crawl");
    }

    setLoading(false);
  };

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold mb-4">SEO Analysis</h2>

      {/* INPUT */}
      <div className="flex gap-3 mb-6">
        <input
          type="text"
          placeholder="https://example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="border p-2 w-full rounded"
        />

        <button
          onClick={handleCrawl}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          {loading ? "Analyse..." : "Analyser"}
        </button>
      </div>

      {message && <p className="text-green-600 mb-4">{message}</p>}

      {/* DATA */}
      {data && (
        <>
          <div className="mb-6">
            <p><strong>Score global :</strong> {data.site_score}</p>
            <p><strong>Pages :</strong> {data.total_pages}</p>
          </div>

          <div className="grid gap-4">
            {data.pages.map((page: any, index: number) => (
              <div key={index} className="border p-4 rounded shadow">
                <h3 className="font-bold">{page.title}</h3>
                <p className="text-sm text-gray-500">{page.url}</p>

                <p className="mt-2">
                  <strong>Score :</strong> {page.seo_score}
                </p>

                <div className="mt-2">
                  <strong>Issues :</strong>
                  <ul>
                    {page.issues.map((i: string, idx: number) => (
                      <li key={idx}>• {i}</li>
                    ))}
                  </ul>
                </div>

                <div className="mt-2 text-green-600">
                  <strong>Reco :</strong>
                  <ul>
                    {page.recommendations.map((r: string, idx: number) => (
                      <li key={idx}>• {r}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}