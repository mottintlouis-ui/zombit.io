import React, { useRef, useState, useEffect, useCallback } from 'react';

interface VirtualJoystickProps {
  onMove: (x: number, y: number) => void;
}

export const VirtualJoystick: React.FC<VirtualJoystickProps> = ({ onMove }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const activePointerIdRef = useRef<number | null>(null);
  const centerRef = useRef({ x: 0, y: 0 });

  const radius = 46;

  const updateVector = useCallback(
    (clientX: number, clientY: number) => {
      const dx = clientX - centerRef.current.x;
      const dy = clientY - centerRef.current.y;
      const dist = Math.hypot(dx, dy);

      let clampedX = dx;
      let clampedY = dy;
      if (dist > radius) {
        clampedX = (dx / dist) * radius;
        clampedY = (dy / dist) * radius;
      }

      setPos({ x: clampedX, y: clampedY });
      onMove(clampedX / radius, clampedY / radius);
    },
    [onMove, radius]
  );

  const handlePointerDown = (e: React.PointerEvent) => {
    if (activePointerIdRef.current !== null) return;
    activePointerIdRef.current = e.pointerId;

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      centerRef.current = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
    }
    setActive(true);
    updateVector(e.clientX, e.clientY);
  };

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (activePointerIdRef.current === null || e.pointerId !== activePointerIdRef.current) return;
      updateVector(e.clientX, e.clientY);
    },
    [updateVector]
  );

  const handlePointerUp = useCallback(
    (e: PointerEvent) => {
      if (activePointerIdRef.current !== null && e.pointerId === activePointerIdRef.current) {
        activePointerIdRef.current = null;
        setActive(false);
        setPos({ x: 0, y: 0 });
        onMove(0, 0);
      }
    },
    [onMove]
  );

  useEffect(() => {
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerup', handlePointerUp, { passive: true });
    window.addEventListener('pointercancel', handlePointerUp, { passive: true });

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  return (
    <div
      id="virtual-joystick-zone"
      ref={containerRef}
      onPointerDown={handlePointerDown}
      className="relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full border-2 border-cyan-500/40 bg-neutral-900/70 backdrop-blur-md flex items-center justify-center pointer-events-auto touch-none select-none shadow-lg shadow-cyan-950/40"
    >
      <div
        className="w-11 h-11 sm:w-13 sm:h-13 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 border border-cyan-200/80 shadow-md shadow-cyan-500/50 flex items-center justify-center transition-transform duration-75 cursor-grab active:cursor-grabbing"
        style={{
          transform: `translate(${pos.x}px, ${pos.y}px)`,
        }}
      >
        <div className="w-3.5 h-3.5 rounded-full bg-white/80 shadow-sm" />
      </div>
      {!active && (
        <span className="absolute text-[9px] sm:text-[10px] font-bold text-cyan-400/80 tracking-wider uppercase pointer-events-none">
          Contrôle
        </span>
      )}
    </div>
  );
};
