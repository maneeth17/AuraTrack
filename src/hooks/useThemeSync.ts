'use client';

import { useEffect } from 'react';

type ThemePeriod = 'dawn' | 'focus' | 'midnight';

export function useThemeSync() {
  useEffect(() => {
    const updateTheme = () => {
      const hour = new Date().getHours();
      let period: ThemePeriod = 'focus';
      if (hour >= 5 && hour < 10) period = 'dawn';
      if (hour >= 21 || hour < 5) period = 'midnight';

      document.documentElement.setAttribute('data-theme', period);
      
      // Force fix SVG colors for dawn theme
      if (period === 'dawn') {
        setTimeout(() => {
          document.querySelectorAll('svg').forEach(svg => {
            svg.style.color = '#1e293b';
            svg.querySelectorAll('*').forEach(el => {
              if (el instanceof SVGElement) {
                const stroke = el.getAttribute('stroke');
                if (stroke && stroke !== 'none' && !stroke.startsWith('var')) {
                  el.setAttribute('stroke', '#1e293b');
                }
                const fill = el.getAttribute('fill');
                if (fill && fill !== 'none' && !fill.startsWith('var')) {
                  el.setAttribute('fill', '#1e293b');
                }
              }
            });
          });
        }, 100);
      }
    };

    updateTheme();
    const interval = setInterval(updateTheme, 60000);
    return () => clearInterval(interval);
  }, []);
}
