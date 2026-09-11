import React, { useState } from 'react';
import { X, Check, ShieldCheck, Sparkles, Coins, ShoppingBag, Eye, HeartHandshake, AlertCircle, Crosshair, Zap, Bot, Trophy, Package } from 'lucide-react';
import { ShopCategory, ShopItem } from '../types/economy';
import { SHOP_ITEMS, WELCOME_PACK } from '../data/gameData';
import { sound } from '../services/sound';
import { analytics } from '../services/analytics';
import { Item3DViewer } from './Item3DViewer';

interface ShopModalProps {
  userScrap: number;
  ownedItemIds: string[];
  equippedSkin?: string;
  equippedWeapon?: string;
  equippedFx?: string;
  equippedPet?: string;
  welcomePackClaimed: boolean;
  onClose: () => void;
  onBuyItem: (item: ShopItem, method: 'scrap' | 'eur') => void;
  onEquipSkin: (itemId: string) => void;
}

const CATEGORIES: { id: ShopCategory; label: string }[] = [
  { id: 'characters', label: 'Personnages' },
  { id: 'weapons', label: 'Armes' },
  { id: 'projectiles', label: 'Projectiles' },
  { id: 'emotes', label: 'Animations' },
  { id: 'pets', label: 'Familiers' },
  { id: 'packs', label: 'Packs de Soutien' },
];

export const ShopModal: React.FC<ShopModalProps> = ({
  userScrap,
  ownedItemIds,
  equippedSkin = 'skin_default',
  equippedWeapon = 'weapon_plasma',
  equippedFx = 'fx_cyan',
  equippedPet = 'none',
  welcomePackClaimed,
  onClose,
  onBuyItem,
  onEquipSkin,
}) => {
  const [selectedCat, setSelectedCat] = useState<ShopCategory>('characters');
  const [previewItem, setPreviewItem] = useState<ShopItem | null>(SHOP_ITEMS[0]);
  const [confirmItem, setConfirmItem] = useState<{ item: ShopItem; method: 'scrap' | 'eur' } | null>(null);
  const [mobileTab, setMobileTab] = useState<'catalog' | 'preview'>('catalog');

  const filteredItems = SHOP_ITEMS.filter((item) => item.category === selectedCat);

  const handleInspect = (item: ShopItem) => {
    sound.playUiClick();
    setPreviewItem(item);
    setMobileTab('preview');
    analytics.logEvent('product_preview', { itemId: item.id, category: item.category });
  };

  const handleAttemptBuy = (item: ShopItem, method: 'scrap' | 'eur') => {
    sound.playUiClick();
    analytics.logEvent('purchase_start', { itemId: item.id, priceEur: item.priceEur, method });
    setConfirmItem({ item, method });
  };

  const handleConfirmBuy = () => {
    if (!confirmItem) return;
    sound.playUiClick();
    onBuyItem(confirmItem.item, confirmItem.method);
    analytics.logEvent('purchase_success', { itemId: confirmItem.item.id, method: confirmItem.method });
    setConfirmItem(null);
  };

  const isEquippedCurrent = (itemId: string, category: ShopCategory) => {
    if (category === 'characters') {
      return equippedSkin === itemId || (equippedSkin === 'skin_default' && itemId === 'skin_soldier') || (equippedSkin === 'skin_soldier' && itemId === 'skin_default');
    }
    if (category === 'weapons') {
      return equippedWeapon === itemId || (equippedWeapon === 'weapon_plasma' && itemId === 'weapon_plasma_rifle') || (equippedWeapon === 'weapon_plasma_rifle' && itemId === 'weapon_plasma');
    }
    if (category === 'projectiles') {
      return equippedFx === itemId || (equippedFx === 'fx_cyan' && itemId === 'fx_cyan_tracer') || (equippedFx === 'fx_cyan_tracer' && itemId === 'fx_cyan');
    }
    if (category === 'pets') return equippedPet === itemId;
    return false;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md select-none overflow-hidden">
      <div className="w-full max-w-5xl h-[94dvh] max-h-[820px] bg-neutral-900 border border-neutral-700/80 rounded-2xl flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-3.5 sm:px-5 py-3 sm:py-4 border-b border-neutral-800 bg-neutral-950/70 gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="p-1.5 sm:p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex-shrink-0">
              <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="truncate">
              <h2 className="text-base sm:text-xl font-extrabold text-white font-display truncate">
                BOUTIQUE & COSMÉTIQUES
              </h2>
              <p className="text-[10px] sm:text-xs text-neutral-400 truncate">
                100% Cosmétique • Sans Pay-to-Win
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            {/* Scrap balance */}
            <div className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-neutral-900 border border-neutral-700 font-mono text-[11px] sm:text-xs font-bold text-amber-300">
              <Coins className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
              <span>{userScrap.toLocaleString()} <span className="hidden xs:inline">Ferraille</span></span>
            </div>

            <button
              id="shop-close-btn"
              onClick={() => {
                sound.playUiClick();
                onClose();
              }}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center transition-colors min-h-[44px] min-w-[44px]"
              title="Fermer la boutique"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile View Toggle Tabs (Only visible on small screens < md) */}
        <div className="flex md:hidden border-b border-neutral-800 bg-neutral-950/80 p-1.5 gap-1.5">
          <button
            onClick={() => setMobileTab('catalog')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              mobileTab === 'catalog'
                ? 'bg-cyan-500 text-neutral-950 shadow-sm'
                : 'text-neutral-400 hover:text-white bg-neutral-900/60'
            }`}
          >
            Articles ({filteredItems.length})
          </button>
          <button
            onClick={() => setMobileTab('preview')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 ${
              mobileTab === 'preview'
                ? 'bg-cyan-500 text-neutral-950 shadow-sm'
                : 'text-neutral-400 hover:text-white bg-neutral-900/60'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Aperçu 3D {previewItem ? `(${previewItem.name})` : ''}</span>
          </button>
        </div>

        {/* Content Area: Left categories & grid, Right 3D preview inspector */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Main List Column */}
          <div
            className={`flex-1 flex-col overflow-hidden p-3 sm:p-5 ${
              mobileTab === 'catalog' ? 'flex' : 'hidden md:flex'
            }`}
          >
            {/* Welcome Pack Special Banner (if not claimed) */}
            {!welcomePackClaimed && (
              <div className="mb-3 sm:mb-4 p-3 sm:p-4 rounded-xl bg-gradient-to-r from-cyan-950/70 via-blue-950/60 to-purple-950/70 border border-cyan-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 sm:gap-3 shadow-lg flex-shrink-0">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <div className="p-2 sm:p-2.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex-shrink-0">
                    <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded bg-cyan-500 text-neutral-950 uppercase font-display">
                        PACK UNIQUE
                      </span>
                      <span className="text-xs text-neutral-300 font-mono">{WELCOME_PACK.priceEur.toFixed(2)} €</span>
                    </div>
                    <div className="text-xs sm:text-sm font-bold text-white mt-0.5">{WELCOME_PACK.name}</div>
                    <div className="text-[11px] sm:text-xs text-neutral-300">{WELCOME_PACK.description}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                  <button
                    id="welcome-pack-preview-btn"
                    onClick={() => handleInspect(WELCOME_PACK)}
                    className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-300 transition-colors min-h-[36px]"
                  >
                    Aperçu
                  </button>
                  <button
                    id="welcome-pack-buy-btn"
                    onClick={() => handleAttemptBuy(WELCOME_PACK, 'eur')}
                    className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-neutral-950 font-extrabold text-xs shadow-md shadow-cyan-500/20 active:scale-95 transition-transform min-h-[36px]"
                  >
                    Acheter {WELCOME_PACK.priceEur.toFixed(2)} €
                  </button>
                </div>
              </div>
            )}

            {/* Categories scrollable pill bar */}
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-2 mb-3 sm:mb-4 scrollbar-none flex-shrink-0">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    sound.playUiClick();
                    setSelectedCat(cat.id);
                  }}
                  className={`px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 min-h-[36px] ${
                    selectedCat === cat.id
                      ? 'bg-cyan-500 text-neutral-950 shadow-md shadow-cyan-500/20'
                      : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Items Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3 overflow-y-auto pr-1 flex-1">
              {filteredItems.map((item) => {
                const isOwned = ownedItemIds.includes(item.id);
                const isEquipped = isEquippedCurrent(item.id, item.category);

                return (
                  <div
                    key={item.id}
                    className={`p-3 rounded-xl border transition-all flex flex-col justify-between ${
                      previewItem?.id === item.id
                        ? 'border-cyan-400 bg-neutral-850 shadow-md shadow-cyan-500/10'
                        : 'border-neutral-800 bg-neutral-950/70 hover:border-neutral-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                          {item.rarity}
                        </span>
                        {isOwned && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                            Possédé ✓
                          </span>
                        )}
                      </div>

                      <h4 className="text-xs sm:text-sm font-bold text-white font-display leading-tight">{item.name}</h4>
                      <p className="text-[11px] text-neutral-400 mt-1 line-clamp-2">{item.description}</p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-neutral-800 flex items-center justify-between gap-1.5">
                      <button
                        onClick={() => handleInspect(item)}
                        className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors"
                        title="Aperçu 3D"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <div className="flex items-center gap-1">
                        {isOwned ? (
                          <button
                            onClick={() => {
                              sound.playUiClick();
                              onEquipSkin(item.id);
                            }}
                            disabled={isEquipped}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all min-h-[36px] ${
                              isEquipped
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-default'
                                : 'bg-neutral-800 hover:bg-neutral-700 text-white'
                            }`}
                          >
                            {isEquipped ? 'Équipé ✓' : 'Équiper'}
                          </button>
                        ) : (
                          <div className="flex items-center gap-1">
                            <button
                              id={`buy-scrap-${item.id}`}
                              onClick={() => handleAttemptBuy(item, 'scrap')}
                              disabled={userScrap < item.testCurrencyPrice}
                              className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 text-amber-400 text-xs font-bold transition-colors min-h-[36px]"
                              title="Acheter avec la Ferraille"
                            >
                              {item.testCurrencyPrice} F.
                            </button>
                            <button
                              id={`buy-eur-${item.id}`}
                              onClick={() => handleAttemptBuy(item, 'eur')}
                              className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-neutral-950 text-xs font-bold transition-colors shadow-sm active:scale-95 min-h-[36px]"
                            >
                              {item.priceEur.toFixed(2)} €
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Inspector Column: Live Preview & Ethical protections */}
          <div
            className={`w-full md:w-80 bg-neutral-950 border-t md:border-t-0 md:border-l border-neutral-800 p-3.5 sm:p-5 flex-col justify-between overflow-y-auto ${
              mobileTab === 'preview' ? 'flex' : 'hidden md:flex'
            }`}
          >
            {previewItem ? (
              <div className="flex flex-col gap-3 sm:gap-4">
                <div className="flex items-center justify-between text-xs font-bold text-cyan-400 uppercase tracking-wider">
                  <div className="flex items-center gap-1.5">
                    <Eye className="w-4 h-4" />
                    <span>Salle d’Observation</span>
                  </div>
                  <span className="text-[10px] text-neutral-500">Pivotement 3D</span>
                </div>

                {/* Stylized Preview Window with Real 3D Model */}
                <div className="w-full h-48 sm:h-56 rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                  <Item3DViewer item={previewItem} />
                </div>

                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white font-display">{previewItem.name}</h3>
                  <p className="text-xs text-neutral-400 mt-0.5 leading-relaxed">{previewItem.description}</p>
                </div>

                <div className="p-2.5 sm:p-3 rounded-lg bg-neutral-900 border border-neutral-800 text-xs space-y-1">
                  <div className="flex justify-between text-neutral-300">
                    <span>Prix Direct :</span>
                    <span className="font-bold font-mono text-white">{previewItem.priceEur.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between text-neutral-300">
                    <span>Monnaie de test :</span>
                    <span className="font-bold font-mono text-amber-400">{previewItem.testCurrencyPrice} Ferraille</span>
                  </div>
                  <div className="flex justify-between text-neutral-300">
                    <span>Garantie :</span>
                    <span className="text-emerald-400 font-semibold">100% Cosmétique</span>
                  </div>
                </div>

                {/* Mobile action button to return to catalog */}
                <button
                  onClick={() => setMobileTab('catalog')}
                  className="md:hidden w-full py-2 rounded-lg bg-neutral-800 text-neutral-300 text-xs font-semibold"
                >
                  ← Retour au Catalogue
                </button>
              </div>
            ) : (
              <div className="text-center text-neutral-500 text-xs my-auto">
                Sélectionnez un article pour inspecter ses détails
              </div>
            )}

            {/* Protection & Legal Transparency */}
            <div className="mt-4 pt-3 border-t border-neutral-800/80 text-[11px] text-neutral-400 flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 text-neutral-300 font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Protection des Achats</span>
              </div>
              <p className="leading-snug text-neutral-400 text-[10px] sm:text-[11px]">
                Prototype à monnaie simulée. Aucune transaction bancaire réelle n'est effectuée sur cette version de démonstration.
              </p>
              <div className="flex items-center gap-1 text-[10px] text-neutral-500">
                <HeartHandshake className="w-3.5 h-3.5" />
                <span>Éthique • Politique transparente</span>
              </div>
            </div>
          </div>
        </div>

        {/* Confirmation Modal */}
        {confirmItem && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-sm bg-neutral-900 border border-neutral-700 rounded-xl p-4 sm:p-5 shadow-2xl flex flex-col gap-3 sm:gap-4">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                <AlertCircle className="w-5 h-5" />
                <span>Confirmation d’Acquisition</span>
              </div>

              <p className="text-xs text-neutral-300 leading-relaxed">
                Voulez-vous acquérir l’article <strong className="text-white">{confirmItem.item.name}</strong> pour{' '}
                {confirmItem.method === 'eur' ? (
                  <span className="font-bold text-cyan-300">{confirmItem.item.priceEur.toFixed(2)} € (Simulé)</span>
                ) : (
                  <span className="font-bold text-amber-300">{confirmItem.item.testCurrencyPrice} Ferraille</span>
                )}
                {' '}?
              </p>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  id="confirm-buy-cancel-btn"
                  onClick={() => setConfirmItem(null)}
                  className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-300 min-h-[36px]"
                >
                  Annuler
                </button>
                <button
                  id="confirm-buy-accept-btn"
                  onClick={handleConfirmBuy}
                  className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-neutral-950 text-xs font-bold shadow active:scale-95 min-h-[36px]"
                >
                  Confirmer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
