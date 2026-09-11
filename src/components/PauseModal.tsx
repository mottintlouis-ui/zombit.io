import React from 'react';
import { Play, RotateCcw, Volume2, VolumeX, Home, Keyboard, Smartphone, Gamepad2, Check } from 'lucide-react';
import { sound } from '../services/sound';
import { JoystickPreference } from '../services/deviceDetector';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onQuitToMenu: () => void;
  isSfxOn: boolean;
  isMusicOn: boolean;
  onToggleSfx: () => void;
  onToggleMusic: () => void;
  isMobileOrTouch?: boolean;
  joystickPreference?: JoystickPreference;
  onSetJoystickPreference?: (pref: JoystickPreference) => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onQuitToMenu,
  isSfxOn,
  isMusicOn,
  onToggleSfx,
  onToggleMusic,
  isMobileOrTouch = false,
  joystickPreference = 'auto',
  onSetJoystickPreference,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md select-none overflow-y-auto">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-700/80 rounded-2xl p-4 sm:p-6 shadow-2xl flex flex-col gap-3.5 sm:gap-5 my-auto max-h-[95dvh] overflow-y-auto">
        <div className="text-center">
          <h3 className="text-xl sm:text-2xl font-extrabold text-white font-display tracking-wider">
            PARTIE EN PAUSE
          </h3>
          <p className="text-xs text-neutral-400 mt-0.5">Zombie Core Arena</p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-2.5">
          <button
            id="pause-resume-btn"
            onClick={() => {
              sound.playUiClick();
              onResume();
            }}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-95 font-display"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>REPRENDRE LA PARTIE</span>
          </button>

          <button
            id="pause-restart-btn"
            onClick={() => {
              sound.playUiClick();
              onRestart();
            }}
            className="w-full py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold text-xs flex items-center justify-center gap-2 border border-neutral-700 transition-colors"
          >
            <RotateCcw className="w-4 h-4 text-cyan-400" />
            <span>Recommencer l’arène</span>
          </button>

          <button
            id="pause-quit-btn"
            onClick={() => {
              sound.playUiClick();
              onQuitToMenu();
            }}
            className="w-full py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold text-xs flex items-center justify-center gap-2 border border-neutral-700 transition-colors"
          >
            <Home className="w-4 h-4 text-amber-400" />
            <span>Retour au Menu Principal</span>
          </button>
        </div>

        {/* Audio Toggles */}
        <div className="p-3 rounded-xl bg-neutral-950/70 border border-neutral-800 flex items-center justify-around">
          <button
            onClick={() => {
              sound.playUiClick();
              onToggleSfx();
            }}
            className="flex items-center gap-2 text-xs font-semibold text-neutral-300 hover:text-white transition-colors"
          >
            {isSfxOn ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-neutral-500" />}
            <span>Effets Sonores</span>
          </button>

          <div className="h-4 w-px bg-neutral-800" />

          <button
            onClick={() => {
              sound.playUiClick();
              onToggleMusic();
            }}
            className="flex items-center gap-2 text-xs font-semibold text-neutral-300 hover:text-white transition-colors"
          >
            {isMusicOn ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-neutral-500" />}
            <span>Musique Synth</span>
          </button>
        </div>

        {/* Controls recap & Joystick detector */}
        <div className="p-3 sm:p-3.5 rounded-xl bg-neutral-950/70 border border-neutral-800/80 text-[11px] text-neutral-400 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 font-bold text-neutral-200">
              <Gamepad2 className="w-4 h-4 text-cyan-400" />
              <span>Contrôle & Joystick :</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-800/60">
              {isMobileOrTouch ? (
                <>
                  <Smartphone className="w-3 h-3 text-cyan-400" />
                  <span>Détecté : Mobile / Tactile</span>
                </>
              ) : (
                <>
                  <Keyboard className="w-3 h-3 text-cyan-400" />
                  <span>Détecté : Ordinateur (Clavier)</span>
                </>
              )}
            </div>
          </div>

          {/* Preference switcher */}
          {onSetJoystickPreference && (
            <div className="grid grid-cols-3 gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  sound.playUiClick();
                  onSetJoystickPreference('auto');
                }}
                className={`py-1.5 px-1 rounded-lg text-[10px] font-bold transition-all border flex items-center justify-center gap-1 ${
                  joystickPreference === 'auto'
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm'
                    : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-400 border-neutral-800'
                }`}
              >
                {joystickPreference === 'auto' && <Check className="w-3 h-3" />}
                <span>Auto</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  sound.playUiClick();
                  onSetJoystickPreference('always_on');
                }}
                className={`py-1.5 px-1 rounded-lg text-[10px] font-bold transition-all border flex items-center justify-center gap-1 ${
                  joystickPreference === 'always_on'
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm'
                    : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-400 border-neutral-800'
                }`}
              >
                {joystickPreference === 'always_on' && <Check className="w-3 h-3" />}
                <span>Actif</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  sound.playUiClick();
                  onSetJoystickPreference('always_off');
                }}
                className={`py-1.5 px-1 rounded-lg text-[10px] font-bold transition-all border flex items-center justify-center gap-1 ${
                  joystickPreference === 'always_off'
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm'
                    : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-400 border-neutral-800'
                }`}
              >
                {joystickPreference === 'always_off' && <Check className="w-3 h-3" />}
                <span>Masqué</span>
              </button>
            </div>
          )}

          <div className="text-[10px] text-neutral-400 leading-snug border-t border-neutral-800/60 pt-2 space-y-1">
            <p>
              • <strong className="text-neutral-200">Sur PC :</strong> Déplacez-vous avec ZQSD / WASD / Flèches.
            </p>
            <p>
              • <strong className="text-neutral-200">Sur Mobile :</strong> Utilisez le joystick virtuel pour manœuvrer.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
