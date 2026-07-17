import { useEffect, useState } from 'react';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

const MOBILE_MAX = 576;
const TABLET_MAX = 992;

function getDevice(width: number): DeviceType {
  if (width <= MOBILE_MAX) return 'mobile';
  if (width <= TABLET_MAX) return 'tablet';
  return 'desktop';
}

export function useResponsive() {
  const [width, setWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1200,
  );

  useEffect(() => {
    let raf = 0;
    const onResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setWidth(window.innerWidth));
    };
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(raf);
    };
  }, []);

  const device = getDevice(width);
  return {
    width,
    device,
    isMobile: device === 'mobile',
    isTablet: device === 'tablet',
    isDesktop: device === 'desktop',
    /** 手机或平板窄屏，菜单折叠为抽屉 */
    isNarrow: device !== 'desktop',
  };
}
