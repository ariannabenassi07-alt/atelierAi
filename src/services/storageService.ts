import {
  DEFAULT_CATEGORIES,
  INITIAL_AVATAR_PROFILE,
  INITIAL_PLANNED_OUTFITS,
  INITIAL_SAVED_OUTFITS,
  INITIAL_WARDROBE_ITEMS,
} from "../data/initialData";
import {
  AvatarProfile,
  PlannedOutfitsByDate,
  SavedOutfit,
  UserAccount,
  WardrobeItem,
} from "../types";

const KEYS = {
  USER: "atelier_ai_user_v1",
  WARDROBE: "atelier_ai_wardrobe_v1",
  CATEGORIES: "atelier_ai_categories_v1",
  AVATAR: "atelier_ai_avatar_v1",
  SAVED_OUTFITS: "atelier_ai_saved_outfits_v1",
  PLANNED_OUTFITS: "atelier_ai_planned_outfits_v1",
};

/**
 * Interfaccia Repository astratta per facilitare il futuro collegamento
 * con Firebase Auth e Cloud Firestore mantenendo la persistenza immediata su localStorage.
 */
export interface AtelierRepository {
  getUser(): UserAccount | null;
  saveUser(user: UserAccount | null): void;
  getCategories(): string[];
  saveCategories(categories: string[]): void;
  getWardrobe(): WardrobeItem[];
  saveWardrobe(items: WardrobeItem[]): void;
  getAvatar(): AvatarProfile;
  saveAvatar(profile: AvatarProfile): void;
  getSavedOutfits(): SavedOutfit[];
  saveSavedOutfits(outfits: SavedOutfit[]): void;
  getPlannedOutfits(): PlannedOutfitsByDate;
  savePlannedOutfits(planned: PlannedOutfitsByDate): void;
  resetDemoData(): void;
}

class LocalAtelierRepository implements AtelierRepository {
  private readJson<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }

  private writeJson<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignora errori di quota storage
    }
  }

  getUser(): UserAccount | null {
    return this.readJson<UserAccount | null>(KEYS.USER, null);
  }

  saveUser(user: UserAccount | null): void {
    if (!user) {
      localStorage.removeItem(KEYS.USER);
      return;
    }
    this.writeJson(KEYS.USER, user);
  }

  getCategories(): string[] {
    const stored = this.readJson<string[] | null>(KEYS.CATEGORIES, null);
    if (!stored || stored.length === 0) {
      this.writeJson(KEYS.CATEGORIES, DEFAULT_CATEGORIES);
      return DEFAULT_CATEGORIES;
    }
    return stored;
  }

  saveCategories(categories: string[]): void {
    this.writeJson(KEYS.CATEGORIES, categories);
  }

  getWardrobe(): WardrobeItem[] {
    const stored = this.readJson<WardrobeItem[] | null>(KEYS.WARDROBE, null);
    if (!stored) {
      this.writeJson(KEYS.WARDROBE, INITIAL_WARDROBE_ITEMS);
      return INITIAL_WARDROBE_ITEMS;
    }
    return stored;
  }

  saveWardrobe(items: WardrobeItem[]): void {
    this.writeJson(KEYS.WARDROBE, items);
  }

  getAvatar(): AvatarProfile {
    const stored = this.readJson<AvatarProfile | null>(KEYS.AVATAR, null);
    if (!stored) {
      this.writeJson(KEYS.AVATAR, INITIAL_AVATAR_PROFILE);
      return INITIAL_AVATAR_PROFILE;
    }
    return stored;
  }

  saveAvatar(profile: AvatarProfile): void {
    this.writeJson(KEYS.AVATAR, profile);
  }

  getSavedOutfits(): SavedOutfit[] {
    const stored = this.readJson<SavedOutfit[] | null>(KEYS.SAVED_OUTFITS, null);
    if (!stored) {
      this.writeJson(KEYS.SAVED_OUTFITS, INITIAL_SAVED_OUTFITS);
      return INITIAL_SAVED_OUTFITS;
    }
    return stored;
  }

  saveSavedOutfits(outfits: SavedOutfit[]): void {
    this.writeJson(KEYS.SAVED_OUTFITS, outfits);
  }

  getPlannedOutfits(): PlannedOutfitsByDate {
    const stored = this.readJson<PlannedOutfitsByDate | null>(KEYS.PLANNED_OUTFITS, null);
    if (!stored) {
      this.writeJson(KEYS.PLANNED_OUTFITS, INITIAL_PLANNED_OUTFITS);
      return INITIAL_PLANNED_OUTFITS;
    }
    return stored;
  }

  savePlannedOutfits(planned: PlannedOutfitsByDate): void {
    this.writeJson(KEYS.PLANNED_OUTFITS, planned);
  }

  resetDemoData(): void {
    this.writeJson(KEYS.CATEGORIES, DEFAULT_CATEGORIES);
    this.writeJson(KEYS.WARDROBE, INITIAL_WARDROBE_ITEMS);
    this.writeJson(KEYS.AVATAR, INITIAL_AVATAR_PROFILE);
    this.writeJson(KEYS.SAVED_OUTFITS, INITIAL_SAVED_OUTFITS);
    this.writeJson(KEYS.PLANNED_OUTFITS, INITIAL_PLANNED_OUTFITS);
  }
}

export const atelierRepository: AtelierRepository = new LocalAtelierRepository();
