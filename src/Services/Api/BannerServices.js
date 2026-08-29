/**
 * Banner tracking — impression + click. Fire-and-forget, mirroring
 * recordProductView / recordProductLead: never awaited, never throws into the UI.
 *
 * The server dedups impressions by banner + placement + session + day, so it is
 * safe to fire on every slide view; clicks are never deduped. ALWAYS pass the
 * placement code (e.g. HOME_HERO) — the same creative in two slots must count as
 * two impressions. See docs/banner-tracking-backend-ask.md.
 */
import {comnPost} from './CommonServices';

export const recordBannerImpression = (id, placement, platform = 'app') =>
  comnPost('v2/recordBannerImpression', {id, placement, platform}).catch(() => {});

export const recordBannerClick = (id, placement, platform = 'app') =>
  comnPost('v2/recordBannerClick', {id, placement, platform}).catch(() => {});
