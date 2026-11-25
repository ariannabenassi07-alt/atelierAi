/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from "react";
import { Shirt, Sparkles, User, Calendar, Newspaper } from "lucide-react";
import { CalendarView } from "./components/CalendarView";
import { NewsFeed } from "./components/NewsFeed";
import { OutfitGenerator } from "./components/OutfitGenerator";
import { UserProfile } from "./components/UserProfile";
import { WardrobeManager } from "./components/WardrobeManager";
import { atelierRepository } from "./services/storageService";
import {
  AvatarProfile,
  MAX_OUTFITS_PER_DAY,
  NavigationTab,
  PlannedOutfitsByDate,
  SavedOutfit,
  UserAccount,
  WardrobeItem,
} from "./types";

const NAV_ITEMS: Array<{
  id: NavigationTab;
  label: string;
  icon: typeof Shirt;
}> = [
  { id: "wardrobe", label: "Guardaroba", icon: Shirt },
  { id: "stylist", label: "Stylist AI", icon: Sparkles },
  { id: "profile", label: "Avatar & Profilo", icon: User },
  { id: "calendar", label: "Calendario", icon: Calendar },
  { id: "news", label: "Fashion News", icon: Newspaper },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<NavigationTab>("wardrobe");

  const [user, setUser] = useState<UserAccount | null>(() => atelierRepository.getUser());
  const [categories, setCategories] = useState<string[]>(() =>
    atelierRepository.getCategories()
  );
  const [wardrobe, setWardrobe] = useState<WardrobeItem[]>(() =>
    atelierRepository.getWardrobe()
  );
  const [avatar, setAvatar] = useState<AvatarProfile>(() => atelierRepository.getAvatar());
  const [savedOutfits, setSavedOutfits] = useState<SavedOutfit[]>(() =>
    atelierRepository.getSavedOutfits()
  );
  const [plannedOutfits, setPlannedOutfits] = useState<PlannedOutfitsByDate>(() =>
    atelierRepository.getPlannedOutfits()
  );

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 3200);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const handleAddItem = (item: WardrobeItem) => {
    const updated = [item, ...wardrobe];
    setWardrobe(updated);
    atelierRepository.saveWardrobe(updated);
    showToast(`"${item.name}" aggiunto al guardaroba.`);
  };

  const handleUpdateItem = (updatedItem: WardrobeItem) => {
    const updated = wardrobe.map((i) => (i.id === updatedItem.id ? updatedItem : i));
    setWardrobe(updated);
    atelierRepository.saveWardrobe(updated);
    showToast("Scheda del capo aggiornata.");
  };

  const handleDeleteItem = (id: string) => {
    const updated = wardrobe.filter((i) => i.id !== id);
    setWardrobe(updated);
    atelierRepository.saveWardrobe(updated);
    showToast("Capo rimosso dal guardaroba.");
  };

  const handleAddCategory = (category: string) => {
    if (categories.some((c) => c.toLowerCase() === category.toLowerCase())) {
      showToast("Questa categoria è già presente.");
      return;
    }
    const updated = [...categories, category];
    setCategories(updated);
    atelierRepository.saveCategories(updated);
    showToast(`Categoria "${category}" creata.`);
  };

  const handleUpdateAvatar = (profile: AvatarProfile) => {
    setAvatar(profile);
    atelierRepository.saveAvatar(profile);
  };

  const handleSaveOutfit = (outfit: SavedOutfit) => {
    const updated = [outfit, ...savedOutfits];
    setSavedOutfits(updated);
    atelierRepository.saveSavedOutfits(updated);
    showToast(`Look "${outfit.title}" salvato nell'archivio del profilo.`);
  };

  const handleAssignOutfitToDate = (dateKey: string, outfit: SavedOutfit): boolean => {
    const existingForDay = plannedOutfits[dateKey] || [];
    if (existingForDay.length >= MAX_OUTFITS_PER_DAY) {
      showToast(
        `Limite massimo di ${MAX_OUTFITS_PER_DAY} look raggiunto per questa giornata.`
      );
      return false;
    }

    const plannedEntry: SavedOutfit = {
      ...outfit,
      id: `planned_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    };

    const updatedPlanned: PlannedOutfitsByDate = {
      ...plannedOutfits,
      [dateKey]: [...existingForDay, plannedEntry],
    };
    setPlannedOutfits(updatedPlanned);
    atelierRepository.savePlannedOutfits(updatedPlanned);

    // Ensure the outfit is also kept in saved memory if not already present
    const alreadyInMemory = savedOutfits.some((s) => s.id === outfit.id);
    if (!alreadyInMemory) {
      const updatedSaved = [outfit, ...savedOutfits];
      setSavedOutfits(updatedSaved);
      atelierRepository.saveSavedOutfits(updatedSaved);
    }

    const formatted = new Date(`${dateKey}T12:00:00`).toLocaleDateString("it-IT", {
      day: "numeric",
      month: "long",
    });
    showToast(`"${outfit.title}" pianificato per il ${formatted}.`);
    return true;
  };

  const handleRemovePlannedOutfit = (dateKey: string, plannedId: string) => {
    const existing = plannedOutfits[dateKey] || [];
    const remaining = existing.filter((o) => o.id !== plannedId);
    const updatedPlanned = { ...plannedOutfits };
    if (remaining.length === 0) {
      delete updatedPlanned[dateKey];
    } else {
      updatedPlanned[dateKey] = remaining;
    }
    setPlannedOutfits(updatedPlanned);
    atelierRepository.savePlannedOutfits(updatedPlanned);
    showToast("Outfit rimosso dalla giornata.");
  };

  const handleToggleFavoriteOutfit = (id: string) => {
    const updated = savedOutfits.map((o) =>
      o.id === id ? { ...o, isFavorite: !o.isFavorite } : o
    );
    setSavedOutfits(updated);
    atelierRepository.saveSavedOutfits(updated);
  };

  const handleDeleteSavedOutfit = (id: string) => {
    const updated = savedOutfits.filter((o) => o.id !== id);
    setSavedOutfits(updated);
    atelierRepository.saveSavedOutfits(updated);
    showToast("Look rimosso dall'archivio.");
  };

  const handleLogin = (account: UserAccount) => {
    setUser(account);
    atelierRepository.saveUser(account);
    showToast(`Benvenuta nell'atelier, ${account.name}.`);
  };

  const handleLogout = () => {
    setUser(null);
    atelierRepository.saveUser(null);
    showToast("Sessione disconnessa.");
  };

  const handleResetDemoData = () => {
    atelierRepository.resetDemoData();
    setCategories(atelierRepository.getCategories());
    setWardrobe(atelierRepository.getWardrobe());
    setAvatar(atelierRepository.getAvatar());
    setSavedOutfits(atelierRepository.getSavedOutfits());
    setPlannedOutfits(atelierRepository.getPlannedOutfits());
    showToast("Guardaroba e misure iniziali ripristinati.");
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#1A1A1A] flex flex-col md:flex-row">
      {/* Desktop Sleek Sidebar */}
      <aside className="hidden md:flex md:w-64 lg:w-72 md:flex-col md:fixed md:inset-y-0 border-r border-[#E6E1D6] bg-[#FAF9F6] z-30">
        <div className="px-7 py-8 border-b border-[#E6E1D6]">
          <button
            type="button"
            onClick={() => setActiveTab("wardrobe")}
            className="text-left focus:outline-none"
          >
            <span className="font-serif text-3xl tracking-tight text-[#1A1A1A] block">
              AtelierAI
            </span>
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1.5" aria-label="Navigazione principale">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3.5 px-4 py-3 text-sm rounded transition-colors whitespace-nowrap shrink-0 ${
                  isActive
                    ? "bg-[#1A1A1A] text-[#FAF9F6] font-medium"
                    : "text-[#6B6661] hover:text-[#1A1A1A] hover:bg-[#F3F0EA]"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-6 border-t border-[#E6E1D6] text-xs text-[#6B6661] space-y-1">
          <p className="font-medium text-[#1A1A1A] truncate">
            {user ? user.name : "Ospite Atelier"}
          </p>
          <p className="tabular-nums">
            {wardrobe.length} capi · {savedOutfits.length} look salvati
          </p>
        </div>
      </aside>

      {/* Mobile Compact Header */}
      <header className="md:hidden sticky top-0 z-30 bg-[#FAF9F6]/95 backdrop-blur-xs border-b border-[#E6E1D6] px-4 py-3 flex items-center justify-between">
        <span className="font-serif text-2xl tracking-tight text-[#1A1A1A] whitespace-nowrap shrink-0">
          AtelierAI
        </span>
        <button
          type="button"
          onClick={() => setActiveTab("profile")}
          className="text-xs font-medium text-[#6B6661] hover:text-[#1A1A1A] whitespace-nowrap shrink-0"
        >
          {user ? user.name : "Profilo"}
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 md:pl-64 lg:pl-72 pb-24 md:pb-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 lg:px-10 py-6 sm:py-10">
          {activeTab === "wardrobe" && (
            <WardrobeManager
              items={wardrobe}
              categories={categories}
              onAddItem={handleAddItem}
              onUpdateItem={handleUpdateItem}
              onDeleteItem={handleDeleteItem}
              onAddCategory={handleAddCategory}
            />
          )}

          {activeTab === "stylist" && (
            <OutfitGenerator
              wardrobe={wardrobe}
              avatar={avatar}
              savedOutfits={savedOutfits}
              plannedOutfits={plannedOutfits}
              onSaveOutfit={handleSaveOutfit}
              onAssignOutfitToDate={handleAssignOutfitToDate}
              onRemovePlannedOutfit={handleRemovePlannedOutfit}
            />
          )}

          {activeTab === "profile" && (
            <UserProfile
              user={user}
              avatar={avatar}
              wardrobe={wardrobe}
              savedOutfits={savedOutfits}
              onUpdateAvatar={handleUpdateAvatar}
              onToggleFavoriteOutfit={handleToggleFavoriteOutfit}
              onDeleteSavedOutfit={handleDeleteSavedOutfit}
              onLogin={handleLogin}
              onLogout={handleLogout}
              onResetDemoData={handleResetDemoData}
            />
          )}

          {activeTab === "calendar" && (
            <CalendarView
              wardrobe={wardrobe}
              avatar={avatar}
              savedOutfits={savedOutfits}
              plannedOutfits={plannedOutfits}
              onAssignOutfitToDate={handleAssignOutfitToDate}
              onRemovePlannedOutfit={handleRemovePlannedOutfit}
            />
          )}

          {activeTab === "news" && (
            <NewsFeed
              wardrobe={wardrobe}
              avatar={avatar}
              onSaveOutfit={handleSaveOutfit}
            />
          )}
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav
        aria-label="Navigazione mobile"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#FAF9F6]/95 backdrop-blur-xs border-t border-[#E6E1D6] grid grid-cols-5 h-16"
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center gap-1 text-[10px] transition-colors ${
                isActive ? "text-[#1A1A1A] font-medium" : "text-[#6B6661]"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-[#9A7B4F]" : ""}`} />
              <span className="truncate max-w-[66px]">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Subtle Editorial Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 bg-[#1A1A1A] text-[#FAF9F6] text-xs px-4 py-3 rounded shadow-lg border border-[#9A7B4F]/40 max-w-sm"
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
}
