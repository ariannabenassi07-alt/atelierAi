import { useState } from "react";
import { Heart, Trash2, LogOut, RotateCcw, Calendar, MapPin, CloudSun, User } from "lucide-react";
import { AvatarProfile, SavedOutfit, UserAccount, WardrobeItem } from "../types";
import { AvatarVisualizer } from "./AvatarVisualizer";
import { EditorialImage } from "./EditorialImage";

interface UserProfileProps {
  user: UserAccount | null;
  avatar: AvatarProfile;
  wardrobe: WardrobeItem[];
  savedOutfits: SavedOutfit[];
  onUpdateAvatar: (profile: AvatarProfile) => void;
  onToggleFavoriteOutfit: (id: string) => void;
  onDeleteSavedOutfit: (id: string) => void;
  onLogin: (user: UserAccount) => void;
  onLogout: () => void;
  onResetDemoData: () => void;
}

export function UserProfile({
  user,
  avatar,
  wardrobe,
  savedOutfits,
  onUpdateAvatar,
  onToggleFavoriteOutfit,
  onDeleteSavedOutfit,
  onLogin,
  onLogout,
  onResetDemoData,
}: UserProfileProps) {
  const [subTab, setSubTab] = useState<"avatar" | "archive" | "account">("avatar");
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  // Auth form state
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);

  const itemMap = new Map(wardrobe.map((item) => [item.id, item]));

  const displayedOutfits = onlyFavorites
    ? savedOutfits.filter((o) => o.isFavorite)
    : savedOutfits;

  const handleEmailAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!email.trim() || !password.trim()) {
      setAuthError("Inserisci indirizzo email e password.");
      return;
    }

    if (authMode === "register" && !fullName.trim()) {
      setAuthError("Inserisci il tuo nome completo per completare la registrazione.");
      return;
    }

    const derivedName =
      authMode === "register"
        ? fullName.trim()
        : email.split("@")[0].replace(/[._-]/g, " ");

    onLogin({
      id: `usr_${Date.now()}`,
      name: derivedName.charAt(0).toUpperCase() + derivedName.slice(1),
      email: email.trim().toLowerCase(),
      authProvider: "email",
      createdAt: new Date().toISOString(),
    });

    setPassword("");
  };

  const handleGoogleSignIn = () => {
    onLogin({
      id: `usr_google_${Date.now()}`,
      name: "Ospite Atelier",
      email: "profilo.atelier@gmail.com",
      authProvider: "google",
      createdAt: new Date().toISOString(),
    });
  };

  return (
    <section className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E6E1D6] pb-6">
        <div>
          <p className="text-xs uppercase tracking-widest text-[#6B6661]">
            {user ? `${user.name} · ${user.email}` : "Sessione Locale · Pronta per Sync Cloud"}
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl text-[#1A1A1A] mt-1 tracking-tight">
            Avatar &amp; Profilo
          </h1>
        </div>

        {/* Sub-navigation tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            type="button"
            onClick={() => setSubTab("avatar")}
            className={`px-4 py-2 text-xs font-medium rounded border transition-colors whitespace-nowrap shrink-0 ${
              subTab === "avatar"
                ? "bg-[#1A1A1A] text-[#FAF9F6] border-[#1A1A1A]"
                : "bg-white text-[#6B6661] border-[#E6E1D6] hover:text-[#1A1A1A]"
            }`}
          >
            Il Tuo Avatar
          </button>
          <button
            type="button"
            onClick={() => setSubTab("archive")}
            className={`px-4 py-2 text-xs font-medium rounded border transition-colors whitespace-nowrap shrink-0 ${
              subTab === "archive"
                ? "bg-[#1A1A1A] text-[#FAF9F6] border-[#1A1A1A]"
                : "bg-white text-[#6B6661] border-[#E6E1D6] hover:text-[#1A1A1A]"
            }`}
          >
            Archivio Look ({savedOutfits.length})
          </button>
          <button
            type="button"
            onClick={() => setSubTab("account")}
            className={`px-4 py-2 text-xs font-medium rounded border transition-colors whitespace-nowrap shrink-0 ${
              subTab === "account"
                ? "bg-[#1A1A1A] text-[#FAF9F6] border-[#1A1A1A]"
                : "bg-white text-[#6B6661] border-[#E6E1D6] hover:text-[#1A1A1A]"
            }`}
          >
            {user ? "Account" : "Accedi / Registrati"}
          </button>
        </div>
      </div>

      {/* Tab 1: Avatar Configurator */}
      {subTab === "avatar" && (
        <div className="bg-white border border-[#E6E1D6] rounded-lg p-6 lg:p-8">
          <AvatarVisualizer
            profile={avatar}
            onChange={onUpdateAvatar}
            editable
          />
        </div>
      )}

      {/* Tab 2: Saved Outfits Archive */}
      {subTab === "archive" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[#6B6661]">
              Collezione personale dei look generati e personalizzati con lo Stylist AI.
            </p>
            <button
              type="button"
              onClick={() => setOnlyFavorites((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded border transition-colors whitespace-nowrap shrink-0 ${
                onlyFavorites
                  ? "bg-[#EFE9DF] border-[#9A7B4F] text-[#1A1A1A]"
                  : "bg-white border-[#E6E1D6] text-[#6B6661] hover:text-[#1A1A1A]"
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${onlyFavorites ? "fill-[#9A7B4F] text-[#9A7B4F]" : ""}`} />
              Solo Preferiti
            </button>
          </div>

          {displayedOutfits.length === 0 ? (
            <div className="bg-white border border-[#E6E1D6] rounded-lg p-10 text-center">
              <p className="font-serif text-2xl text-[#1A1A1A]">
                Nessun look salvato in questa vista
              </p>
              <p className="text-sm text-[#6B6661] mt-1">
                Genera nuove proposte nella sezione Stylist AI e clicca "Salva Look" per archiviarle qui.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {displayedOutfits.map((look) => {
                const items = look.itemIds
                  .map((id) => itemMap.get(id))
                  .filter((x): x is WardrobeItem => Boolean(x));

                const formattedDate = new Date(look.createdAt).toLocaleDateString("it-IT", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                });

                return (
                  <article
                    key={look.id}
                    className="bg-white border border-[#E6E1D6] rounded-lg p-6 space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-[#E6E1D6] pb-4">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-3 text-xs text-[#6B6661]">
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-[#9A7B4F]" />
                            {formattedDate}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-[#9A7B4F]" />
                            {look.city}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="inline-flex items-center gap-1">
                            <CloudSun className="w-3.5 h-3.5 text-[#9A7B4F]" />
                            {look.weatherSummary}
                          </span>
                        </div>
                        <h3 className="font-serif text-2xl text-[#1A1A1A]">{look.title}</h3>
                        <p className="text-xs text-[#6B6661]">Occasione: {look.occasion}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => onToggleFavoriteOutfit(look.id)}
                          aria-label={look.isFavorite ? "Rimuovi dai preferiti" : "Aggiungi ai preferiti"}
                          className="w-9 h-9 flex items-center justify-center rounded border border-[#E6E1D6] hover:border-[#9A7B4F] transition-colors"
                        >
                          <Heart
                            className={`w-4 h-4 ${
                              look.isFavorite ? "fill-[#9A7B4F] text-[#9A7B4F]" : "text-[#6B6661]"
                            }`}
                          />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteSavedOutfit(look.id)}
                          aria-label="Elimina look salvato"
                          className="w-9 h-9 flex items-center justify-center rounded border border-[#E6E1D6] text-[#6B6661] hover:text-red-700 hover:border-red-200 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className="border border-[#E6E1D6] rounded overflow-hidden bg-[#FAF9F6]"
                        >
                          <div className="aspect-[3/4] bg-[#F3F0EA]">
                            <EditorialImage src={item.imageUrl} alt={item.name} />
                          </div>
                          <div className="p-2">
                            <p className="text-[10px] uppercase tracking-wider text-[#6B6661] truncate">
                              {item.category}
                            </p>
                            <p className="text-xs text-[#1A1A1A] truncate">{item.name}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <p className="text-sm text-[#6B6661] leading-relaxed">
                      {look.stylistRationale}
                    </p>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Authentication & Persistence Controls */}
      {subTab === "account" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 bg-white border border-[#E6E1D6] rounded-lg p-6 lg:p-8">
            {user ? (
              <div className="space-y-6">
                <div className="flex items-center gap-4 border-b border-[#E6E1D6] pb-5">
                  <div className="w-14 h-14 rounded-full bg-[#EFE9DF] border border-[#9A7B4F]/40 flex items-center justify-center font-serif text-2xl text-[#1A1A1A]">
                    {user.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-serif text-2xl text-[#1A1A1A]">{user.name}</h3>
                    <p className="text-sm text-[#6B6661]">{user.email}</p>
                    <p className="text-xs text-[#9A7B4F] mt-0.5">
                      Accesso tramite {user.authProvider === "google" ? "Google" : "Email"} · Archivio sincronizzato localmente
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={onLogout}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium border border-[#E6E1D6] text-[#1A1A1A] rounded hover:bg-[#F3F0EA] transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Disconnetti Account
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-[#E6E1D6] pb-4">
                  <div>
                    <h3 className="font-serif text-2xl text-[#1A1A1A]">
                      {authMode === "login" ? "Accedi ad AtelierAI" : "Crea il Tuo Profilo"}
                    </h3>
                    <p className="text-xs text-[#6B6661] mt-0.5">
                      Salva il tuo guardaroba digitale, le misure dell'avatar e i look preferiti.
                    </p>
                  </div>
                  <div className="flex bg-[#F3F0EA] p-1 rounded border border-[#E6E1D6]">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode("login");
                        setAuthError(null);
                      }}
                      className={`px-3 py-1 text-xs rounded transition-colors ${
                        authMode === "login"
                          ? "bg-white text-[#1A1A1A] shadow-xs"
                          : "text-[#6B6661]"
                      }`}
                    >
                      Accedi
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode("register");
                        setAuthError(null);
                      }}
                      className={`px-3 py-1 text-xs rounded transition-colors ${
                        authMode === "register"
                          ? "bg-white text-[#1A1A1A] shadow-xs"
                          : "text-[#6B6661]"
                      }`}
                    >
                      Registrati
                    </button>
                  </div>
                </div>

                <form onSubmit={handleEmailAuth} className="space-y-4">
                  {authMode === "register" && (
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-[#6B6661] mb-1">
                        Nome Completo
                      </label>
                      <input
                        type="text"
                        placeholder="Es. Sofia Conti"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm bg-[#FAF9F6] border border-[#E6E1D6] rounded focus:outline-none focus:border-[#9A7B4F]"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#6B6661] mb-1">
                      Indirizzo Email
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="nome@esempio.it"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm bg-[#FAF9F6] border border-[#E6E1D6] rounded focus:outline-none focus:border-[#9A7B4F]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#6B6661] mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm bg-[#FAF9F6] border border-[#E6E1D6] rounded focus:outline-none focus:border-[#9A7B4F]"
                    />
                  </div>

                  {authError && <p className="text-xs text-red-700">{authError}</p>}

                  <button
                    type="submit"
                    className="w-full py-2.5 text-xs font-medium bg-[#1A1A1A] text-[#FAF9F6] rounded hover:bg-[#333333] transition-colors"
                  >
                    {authMode === "login" ? "Accedi con Email" : "Completa Registrazione"}
                  </button>
                </form>

                <div className="relative flex items-center py-1">
                  <div className="flex-grow border-t border-[#E6E1D6]" />
                  <span className="shrink mx-3 text-[11px] uppercase tracking-widest text-[#6B6661]">
                    oppure
                  </span>
                  <div className="flex-grow border-t border-[#E6E1D6]" />
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="w-full py-2.5 px-4 text-xs font-medium bg-white border border-[#E6E1D6] text-[#1A1A1A] rounded hover:bg-[#F3F0EA] transition-colors inline-flex items-center justify-center gap-2.5"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
                    />
                  </svg>
                  Continua con Google
                </button>
              </div>
            )}
          </div>

          {/* Data & Archive Management */}
          <div className="lg:col-span-5 bg-[#F3F0EA] border border-[#E6E1D6] rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#6B6661]">
              <User className="w-3.5 h-3.5 text-[#9A7B4F]" />
              <span>Gestione Dati Atelier</span>
            </div>
            <h4 className="font-serif text-xl text-[#1A1A1A]">
              Archivio Locale &amp; Ripristino
            </h4>
            <p className="text-xs text-[#6B6661] leading-relaxed">
              I tuoi capi, le categorie personalizzate, le misure corporee e i look salvati vengono memorizzati localmente nel browser tramite un repository predisposto per l'integrazione con Firebase Auth e Firestore.
            </p>
            <button
              type="button"
              onClick={onResetDemoData}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium bg-white border border-[#E6E1D6] text-[#1A1A1A] rounded hover:border-[#9A7B4F] transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Ripristina Guardaroba Iniziale
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
