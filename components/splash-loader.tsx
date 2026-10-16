import { AWNING, CART, CLOUD, SHOP, WORD_BRAND, WORD_DARK } from './splash-logo-paths';
import { SplashDismiss } from './splash-dismiss';

const SPLASH_ID = 'app-splash';
const LOGO_BLUE = '#1977D7';

// Full-screen brand loader shown on a hard load. It is server-rendered so it
// paints with the first HTML, and SplashDismiss fades it out once the app has
// hydrated (a CSS failsafe hides it anyway if JS never runs).
export function SplashLoader() {
  return (
    <div id={SPLASH_ID} className="splash-loader" role="status" aria-label="Loading DukanCloude">
      <svg className="splash-logo" viewBox="0 0 148 110" aria-hidden="true">
        <g fill={LOGO_BLUE} fillRule="evenodd">
          <g className="splash-cloud">
            {CLOUD.map((d, i) => (
              <path key={i} d={d} />
            ))}
          </g>
          <g className="splash-awning">
            {AWNING.map((d, i) => (
              <path key={i} d={d} />
            ))}
          </g>
          {SHOP.map((d, i) => (
            <path key={i} d={d} />
          ))}
          <g className="splash-cart">
            {CART.map((d, i) => (
              <path key={i} d={d} />
            ))}
          </g>
        </g>
        <g className="splash-word">
          <g fill="currentColor">
            {WORD_DARK.map((d, i) => (
              <path key={i} d={d} />
            ))}
          </g>
          <g fill={LOGO_BLUE}>
            {WORD_BRAND.map((d, i) => (
              <path key={i} d={d} />
            ))}
          </g>
        </g>
      </svg>
      <div className="splash-bar">
        <div className="splash-bar-fill" />
      </div>
      <SplashDismiss id={SPLASH_ID} />
    </div>
  );
}
