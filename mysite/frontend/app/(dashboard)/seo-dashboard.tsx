"use client";

import { useEffect, useState } from "react";

export function SeoDashboard() {
  const [data, setData] = useState<any>(null);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [websiteId, setWebsiteId] = useState(1);

  const fetchData = async () => {
    try {
      const res = await fetch(
        `http://127.0.0.1:8000/data/scraped-pages/?website_id=${websiteId}`
      );
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [websiteId]);

  const handleCrawl = async () => {
    if (!url.trim()) {
      alert("Entre une URL");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("http://127.0.0.1:8000/data/crawl-website/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          website_id: websiteId,
          start_url: url,
          max_pages: 10,
        }),
      });

      if (!res.ok) {
        throw new Error("Erreur backend");
      }

      setMessage("Analyse terminée !");
      await fetchData();
    } catch (err) {
      setMessage("Erreur lors du crawl");
    } finally {
      setLoading(false);
    }
  };

  const siteScore = data?.site_score ?? 0;
  const totalPages = data?.total_pages ?? 0;

  return (
    <div className="space-y-8">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-purple-600 via-violet-500 to-indigo-500 p-8 text-white shadow-2xl">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/20 blur-3xl" />
        <div className="absolute bottom-0 right-20 h-32 w-32 rounded-full bg-purple-300/30 blur-2xl" />

        <div className="relative grid gap-8 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="mb-3 text-sm font-medium text-white/80">
              SEO Intelligence Dashboard
            </p>

            <h1 className="text-4xl font-bold tracking-tight">
              Analyse SEO intelligente
            </h1>

            <p className="mt-4 max-w-xl text-white/80">
              Lance une analyse, détecte les problèmes SEO et consulte les
              recommandations générées pour chaque page.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-white/15 p-5 backdrop-blur-md">
                <p className="text-sm text-white/70">Score global</p>
                <p className="mt-2 text-4xl font-bold">{siteScore}</p>
              </div>

              <div className="rounded-2xl bg-white/15 p-5 backdrop-blur-md">
                <p className="text-sm text-white/70">Pages analysées</p>
                <p className="mt-2 text-4xl font-bold">{totalPages}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] bg-black/20 p-6 backdrop-blur-md">
            <h2 className="text-xl font-semibold">Nouvelle analyse</h2>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full rounded-2xl border border-white/20 bg-white/15 px-4 py-3 text-white outline-none placeholder:text-white/60 focus:border-white/60"
              />

              <button
                onClick={handleCrawl}
                disabled={loading}
                className="rounded-2xl bg-white px-6 py-3 font-semibold text-purple-700 transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Analyse..." : "Analyser"}
              </button>
            </div>

            {message && (
              <p className="mt-4 text-sm font-medium text-white">{message}</p>
            )}
          </div>
        </div>
      </section>

      {/* PAGES */}
      {data && (
        <section>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Pages analysées</h2>
              <p className="text-sm text-gray-400">
                Résultat détaillé du crawl SEO
              </p>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {data.pages?.map((page: any, index: number) => (
              <article
                key={index}
                className="rounded-3xl border border-white/10 bg-[#111111] p-6 shadow-xl transition hover:-translate-y-1 hover:border-purple-500/50"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="line-clamp-1 text-lg font-bold text-white">
                      {page.title || "Page sans titre"}
                    </h3>
                    <p className="mt-1 line-clamp-1 text-sm text-gray-400">
                      {page.url}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-purple-500/15 px-4 py-2 text-purple-300">
                    <span className="text-xl font-bold">{page.seo_score}</span>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl bg-black/30 p-4">
                    <h4 className="font-semibold text-red-300">Issues</h4>
                    <ul className="mt-2 space-y-1 text-sm text-gray-300">
                      {page.issues?.length ? (
                        page.issues.map((i: string, idx: number) => (
                          <li key={idx}>• {i}</li>
                        ))
                      ) : (
                        <li>Aucun problème détecté</li>
                      )}
                    </ul>
                  </div>

                  <div className="rounded-2xl bg-black/30 p-4">
                    <h4 className="font-semibold text-green-300">
                      Recommandations
                    </h4>
                    <ul className="mt-2 space-y-1 text-sm text-gray-300">
                      {page.recommendations?.length ? (
                        page.recommendations.map((r: string, idx: number) => (
                          <li key={idx}>• {r}</li>
                        ))
                      ) : (
                        <li>Aucune recommandation</li>
                      )}
                    </ul>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}