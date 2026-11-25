import { useMemo, useState } from "react";
import { ArrowUpRight, Bookmark, Check, AlertCircle, X } from "lucide-react";
import { EDITORIAL_NEWS } from "../data/initialData";
import { recreateNewsTrend } from "../services/apiClient";
import {
  AvatarProfile,
  NewsArticle,
  NewsCategory,
  SavedOutfit,
  TrendRecreationResult,
  WardrobeItem,
} from "../types";
import { AvatarVisualizer } from "./AvatarVisualizer";
import { EditorialImage } from "./EditorialImage";

interface NewsFeedProps {
  wardrobe: WardrobeItem[];
  avatar: AvatarProfile;
  onSaveOutfit: (outfit: SavedOutfit) => void;
}

const NEWS_CATEGORIES: Array<"Tutte" | NewsCategory> = [
  "Tutte",
  "Tendenze Stagionali",
  "Sfilate",
  "Street Style",
  "Sostenibilità",
];

export function NewsFeed({ wardrobe, avatar, onSaveOutfit }: NewsFeedProps) {
  const [selectedCategory, setSelectedCategory] = useState<"Tutte" | NewsCategory>("Tutte");
  const [activeArticle, setActiveArticle] = useState<NewsArticle | null>(null);

  const [recreationResult, setRecreationResult] = useState<TrendRecreationResult | null>(null);
  const [isRecreating, setIsRecreating] = useState(false);
  const [recreateError, setRecreateError] = useState<string | null>(null);
  const [savedTrendLook, setSavedTrendLook] = useState(false);

  const filteredArticles = useMemo(() => {
    if (selectedCategory === "Tutte") return EDITORIAL_NEWS;
    return EDITORIAL_NEWS.filter((a) => a.category === selectedCategory);
  }, [selectedCategory]);

  const leadArticle = filteredArticles[0];
  const secondaryArticles = filteredArticles.slice(1);

  const itemMap = new Map(wardrobe.map((i) => [i.id, i]));

  const openArticle = (article: NewsArticle) => {
    setActiveArticle(article);
    setRecreationResult(null);
    setRecreateError(null);
    setSavedTrendLook(false);
  };

  const handleRecreateTrend = async (article: NewsArticle) => {
    setActiveArticle(article);
    setRecreationResult(null);
    setRecreateError(null);
    setSavedTrendLook(false);
    setIsRecreating(true);

    try {
      const result = await recreateNewsTrend({ article, wardrobe, avatar });
      setRecreationResult(result);
    } catch (err) {
      setRecreateError(
        err instanceof Error
          ? err.message
          : "Impossibile incrociare la tendenza con il guardaroba."
      );
    } finally {
      setIsRecreating(false);
    }
  };

  const handleSaveRecreatedLook = () => {
    if (!recreationResult || !activeArticle) return;
    onSaveOutfit({
      id: `trend_${Date.now()}`,
      title: recreationResult.lookTitle,
      subtitle: `Ispirato a ${activeArticle.publication}`,
      itemIds: recreationResult.itemIds,
      city: "Milano",
      occasion: `Trend: ${activeArticle.category}`,
      weatherSummary: "Ispirazione Editoriale",
      stylistRationale: recreationResult.editorialInterpretation,
      tailoringTip: recreationResult.stylingDetail,
      createdAt: new Date().toISOString(),
      isFavorite: true,
    });
    setSavedTrendLook(true);
  };

  return (
    <section className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E6E1D6] pb-6">
        <div>
          <p className="text-xs uppercase tracking-widest text-[#6B6661]">
            Rassegna Stampa &amp; Tendenze · Edizione Autunno/Inverno
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl text-[#1A1A1A] mt-1 tracking-tight">
            Fashion News
          </h1>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {NEWS_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 text-xs font-medium rounded border transition-colors whitespace-nowrap shrink-0 ${
                selectedCategory === cat
                  ? "bg-[#1A1A1A] text-[#FAF9F6] border-[#1A1A1A]"
                  : "bg-white text-[#6B6661] border-[#E6E1D6] hover:text-[#1A1A1A]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Lead Editorial Feature */}
      {leadArticle && (
        <article className="bg-white border border-[#E6E1D6] rounded-lg overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch">
          <div
            onClick={() => openArticle(leadArticle)}
            className="lg:col-span-7 aspect-[4/3] lg:aspect-auto lg:min-h-[380px] bg-[#F3F0EA] cursor-pointer overflow-hidden"
          >
            <EditorialImage
              src={leadArticle.imageUrl}
              alt={leadArticle.title}
              fallbackLabel={leadArticle.fallbackLabel}
              className="w-full h-full object-cover hover:scale-[1.01] transition-transform duration-500"
            />
          </div>

          <div className="lg:col-span-5 p-6 lg:p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-widest text-[#6B6661]">
                <span className="text-[#9A7B4F] font-medium">{leadArticle.publication}</span>
                <span aria-hidden="true">·</span>
                <span>{leadArticle.category}</span>
                <span aria-hidden="true">·</span>
                <span>{leadArticle.readingTime}</span>
              </div>

              <h2
                onClick={() => openArticle(leadArticle)}
                className="font-serif text-3xl lg:text-4xl text-[#1A1A1A] leading-tight cursor-pointer hover:text-[#9A7B4F] transition-colors"
              >
                {leadArticle.title}
              </h2>

              <p className="text-sm text-[#6B6661] leading-relaxed">{leadArticle.summary}</p>
            </div>

            <div className="space-y-3 pt-4 border-t border-[#E6E1D6]">
              <button
                type="button"
                onClick={() => handleRecreateTrend(leadArticle)}
                className="w-full px-4 py-2.5 text-xs font-medium bg-[#1A1A1A] text-[#FAF9F6] rounded hover:bg-[#333333] transition-colors text-center"
              >
                Chiedi allo Stylist come ricreare questo trend con il mio armadio
              </button>
              <button
                type="button"
                onClick={() => openArticle(leadArticle)}
                className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium text-[#1A1A1A] border border-[#E6E1D6] rounded hover:bg-[#F3F0EA] transition-colors"
              >
                Leggi l'articolo completo
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </article>
      )}

      {/* Secondary Editorial Grid */}
      {secondaryArticles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {secondaryArticles.map((article) => (
            <article
              key={article.id}
              className="bg-white border border-[#E6E1D6] rounded-lg overflow-hidden flex flex-col justify-between"
            >
              <div>
                <div
                  onClick={() => openArticle(article)}
                  className="aspect-[4/3] bg-[#F3F0EA] overflow-hidden cursor-pointer"
                >
                  <EditorialImage
                    src={article.imageUrl}
                    alt={article.title}
                    fallbackLabel={article.fallbackLabel}
                    className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-300"
                  />
                </div>

                <div className="p-5 space-y-2.5">
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] uppercase tracking-widest text-[#6B6661]">
                    <span className="text-[#9A7B4F] font-medium">{article.publication}</span>
                    <span aria-hidden="true">·</span>
                    <span>{article.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{article.readingTime}</span>
                  </div>

                  <h3
                    onClick={() => openArticle(article)}
                    className="font-serif text-2xl text-[#1A1A1A] leading-snug cursor-pointer hover:text-[#9A7B4F] transition-colors"
                  >
                    {article.title}
                  </h3>

                  <p className="text-sm text-[#6B6661] leading-relaxed line-clamp-3">
                    {article.summary}
                  </p>
                </div>
              </div>

              <div className="px-5 pb-5 pt-3 border-t border-[#E6E1D6]/70 space-y-2">
                <button
                  type="button"
                  onClick={() => handleRecreateTrend(article)}
                  className="w-full px-3.5 py-2 text-xs font-medium bg-[#F3F0EA] text-[#1A1A1A] border border-[#E6E1D6] rounded hover:border-[#9A7B4F] hover:bg-[#EFE9DF] transition-colors text-left"
                >
                  Chiedi allo Stylist come ricreare questo trend con il mio armadio
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Article Reader + AI Trend Recreation Modal */}
      {activeArticle && (
        <div
          className="fixed inset-0 z-50 bg-[#1A1A1A]/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-[#FAF9F6] border border-[#E6E1D6] rounded-lg w-full max-w-4xl max-h-[92vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 z-10 bg-[#FAF9F6] border-b border-[#E6E1D6] px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#6B6661]">
                <span className="text-[#9A7B4F] font-medium">{activeArticle.publication}</span>
                <span aria-hidden="true">·</span>
                <span>{activeArticle.publishedDate}</span>
                <span aria-hidden="true">·</span>
                <span>{activeArticle.readingTime}</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveArticle(null)}
                aria-label="Chiudi articolo"
                className="w-9 h-9 flex items-center justify-center rounded border border-[#E6E1D6] hover:bg-[#F3F0EA]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 lg:p-8 space-y-8">
              <div className="max-w-2xl space-y-4">
                <h2 className="font-serif text-3xl sm:text-4xl text-[#1A1A1A] leading-tight">
                  {activeArticle.title}
                </h2>
                <p className="text-base text-[#6B6661] leading-relaxed italic font-serif">
                  {activeArticle.summary}
                </p>
              </div>

              <div className="aspect-[16/9] max-h-[340px] w-full rounded-lg overflow-hidden bg-[#F3F0EA] border border-[#E6E1D6]">
                <EditorialImage
                  src={activeArticle.imageUrl}
                  alt={activeArticle.title}
                  fallbackLabel={activeArticle.fallbackLabel}
                />
              </div>

              <div className="max-w-2xl space-y-4 text-[15px] text-[#1A1A1A] leading-relaxed">
                {activeArticle.content.map((paragraph, idx) => (
                  <p
                    key={idx}
                    className={
                      idx === 0
                        ? "first-letter:text-5xl first-letter:font-serif first-letter:float-left first-letter:mr-3 first-letter:leading-none first-letter:text-[#9A7B4F]"
                        : ""
                    }
                  >
                    {paragraph}
                  </p>
                ))}
              </div>

              {/* Trend Recreation Section */}
              <div className="border-t border-[#E6E1D6] pt-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-[#9A7B4F]">
                      Dal Giornale al Tuo Armadio
                    </p>
                    <h3 className="font-serif text-2xl text-[#1A1A1A]">
                      Interpreta il Trend con i Tuoi Capi
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRecreateTrend(activeArticle)}
                    disabled={isRecreating}
                    className="px-5 py-2.5 text-xs font-medium bg-[#1A1A1A] text-[#FAF9F6] rounded hover:bg-[#333333] disabled:opacity-50 transition-colors whitespace-nowrap shrink-0"
                  >
                    {isRecreating
                      ? "Analisi guardaroba in corso..."
                      : "Chiedi allo Stylist come ricreare questo trend"}
                  </button>
                </div>

                {isRecreating && (
                  <div className="p-6 bg-white border border-[#E6E1D6] rounded-lg space-y-3 animate-pulse">
                    <div className="h-5 w-1/3 bg-[#E6E1D6] rounded" />
                    <div className="h-4 w-full bg-[#F3F0EA] rounded" />
                    <div className="h-4 w-2/3 bg-[#F3F0EA] rounded" />
                  </div>
                )}

                {recreateError && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 text-xs text-red-900">
                    <AlertCircle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
                    <span>{recreateError}</span>
                  </div>
                )}

                {recreationResult && !isRecreating && (
                  <div className="bg-white border border-[#E6E1D6] rounded-lg p-6 space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E6E1D6] pb-4">
                      <h4 className="font-serif text-2xl text-[#1A1A1A]">
                        {recreationResult.lookTitle}
                      </h4>
                      <button
                        type="button"
                        onClick={handleSaveRecreatedLook}
                        disabled={savedTrendLook}
                        className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-medium rounded border transition-colors whitespace-nowrap shrink-0 ${
                          savedTrendLook
                            ? "bg-[#EFE9DF] border-[#9A7B4F] text-[#1A1A1A]"
                            : "bg-[#1A1A1A] border-[#1A1A1A] text-[#FAF9F6] hover:bg-[#333333]"
                        }`}
                      >
                        {savedTrendLook ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-[#9A7B4F]" />
                            Salvato
                          </>
                        ) : (
                          <>
                            <Bookmark className="w-3.5 h-3.5" />
                            Salva Look
                          </>
                        )}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                      <div className="md:col-span-4">
                        <AvatarVisualizer
                          profile={avatar}
                          outfitItems={recreationResult.itemIds
                            .map((id) => itemMap.get(id))
                            .filter((x): x is WardrobeItem => Boolean(x))}
                          compact
                        />
                      </div>

                      <div className="md:col-span-8 space-y-4">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {recreationResult.itemIds
                            .map((id) => itemMap.get(id))
                            .filter((x): x is WardrobeItem => Boolean(x))
                            .map((item) => (
                              <div
                                key={item.id}
                                className="border border-[#E6E1D6] rounded overflow-hidden bg-[#FAF9F6]"
                              >
                                <div className="aspect-[3/4] bg-[#F3F0EA]">
                                  <EditorialImage src={item.imageUrl} alt={item.name} />
                                </div>
                                <div className="p-2">
                                  <p className="text-[10px] uppercase tracking-wider text-[#6B6661]">
                                    {item.category}
                                  </p>
                                  <p className="text-xs font-medium text-[#1A1A1A] line-clamp-1">
                                    {item.name}
                                  </p>
                                </div>
                              </div>
                            ))}
                        </div>

                        <div className="space-y-3 text-sm text-[#1A1A1A] leading-relaxed">
                          <p>
                            <strong className="font-medium">Interpretazione: </strong>
                            {recreationResult.editorialInterpretation}
                          </p>
                          <p>
                            <strong className="font-medium">Dettaglio di stile: </strong>
                            {recreationResult.stylingDetail}
                          </p>
                          <p className="text-xs text-[#6B6661] border-t border-[#E6E1D6] pt-2">
                            <strong className="text-[#1A1A1A]">Eventuale integrazione futura: </strong>
                            {recreationResult.optionalMissingPiece}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
