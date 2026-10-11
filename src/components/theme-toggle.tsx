'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon, Laptop, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface ThemeToggleProps {
  variant?: 'dropdown' | 'segmented' | 'cycle';
  className?: string;
}

export function ThemeToggle({ variant = 'dropdown', className }: ThemeToggleProps) {
  const [mounted, setMounted] = React.useState(false);
  const { theme, setTheme } = useTheme();
  
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Prevenção de hidratação: renderizar placeholders neutros
  if (!mounted) {
    if (variant === 'segmented') {
      return (
        <div className={cn("flex items-center p-1 bg-muted/50 rounded-lg border border-border w-full opacity-50", className)}>
          {['Claro', 'Escuro', 'Sistema'].map((t) => (
            <div key={t} className="flex-1 h-8 rounded-md" />
          ))}
        </div>
      );
    }
    return (
      <Button variant="ghost" size="icon" disabled className={cn("opacity-50", className)}>
        <Sun className="h-[1.2rem] w-[1.2rem]" />
      </Button>
    );
  }

  const toggleCycle = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  const getIcon = (t?: string) => {
    if (t === 'dark') return <Moon className="h-[1.2rem] w-[1.2rem]" />;
    if (t === 'system') return <Laptop className="h-[1.2rem] w-[1.2rem]" />;
    return <Sun className="h-[1.2rem] w-[1.2rem]" />;
  };

  const getLabel = (t?: string) => {
    if (t === 'dark') return 'Escuro';
    if (t === 'system') return 'Sistema';
    return 'Claro';
  };

  if (variant === 'cycle') {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleCycle}
        title={`Tema: ${getLabel(theme)} (clique para alternar)`}
        aria-label="Alternar tema"
        className={className}
      >
        {getIcon(theme)}
      </Button>
    );
  }

  if (variant === 'segmented') {
    const options = [
      { value: 'light', label: 'Claro', icon: Sun },
      { value: 'dark', label: 'Escuro', icon: Moon },
      { value: 'system', label: 'Sistema', icon: Laptop },
    ];

    return (
      <div 
        className={cn("flex items-center p-1 bg-muted/50 rounded-lg border border-border w-full", className)}
        role="radiogroup" 
        aria-label="Selecionar tema"
      >
        {options.map((opt) => {
          const Icon = opt.icon;
          const isActive = theme === opt.value;
          return (
            <button
              key={opt.value}
              role="radio"
              aria-checked={isActive}
              onClick={() => setTheme(opt.value)}
              className={cn(
                "flex-1 flex items-center justify-center py-1.5 px-2 rounded-md text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isActive 
                  ? "bg-background text-foreground shadow-sm border border-border/50" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              title={opt.label}
            >
              <Icon className="h-3.5 w-3.5 mr-1.5 shrink-0" />
              <span className="truncate">{opt.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // variant === 'dropdown'
  return (
    <div className={cn("relative inline-block text-left", className)} ref={dropdownRef}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Alternar tema"
        title="Alternar tema"
      >
        {getIcon(theme)}
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 rounded-md bg-popover border border-border shadow-lg ring-1 ring-black/5 focus:outline-none z-50 animate-in fade-in slide-in-from-top-2">
          <div className="p-1 space-y-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
            {[
              { value: 'light', label: 'Claro', icon: Sun },
              { value: 'dark', label: 'Escuro', icon: Moon },
              { value: 'system', label: 'Sistema', icon: Laptop },
            ].map((opt) => {
              const Icon = opt.icon;
              const isActive = theme === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => {
                    setTheme(opt.value);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "flex items-center w-full text-left px-2 py-1.5 text-sm rounded-sm transition-colors",
                    isActive ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                  role="menuitem"
                >
                  <Icon className="h-4 w-4 mr-2" />
                  <span className="flex-1">{opt.label}</span>
                  {isActive && <Check className="h-4 w-4 ml-2" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
