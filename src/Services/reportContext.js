/**
 * Route context for "report a correction".
 *
 * A correction is only actionable if the admin can tell WHICH route it is
 * about. The user should not have to type that, and asking them to would lose
 * most reports — so the app carries the route along with the message.
 *
 * Two representations, built from one source so they cannot drift apart:
 *   contextRows()           — label/value pairs, shown read-only above the
 *                             message box so the user can see what is attached
 *   appendContextToMessage() — a plain-text block appended to the message that
 *                             is actually submitted, so the details survive
 *                             into whatever the admin reads without needing any
 *                             backend change
 */

/** Pull a display name off the varied shapes the route APIs return. */
const placeName = p =>
  (typeof p === 'string' ? p : p?.name || p?.mr_name || '') || '';

const km = d =>
  d == null || d === '' ? '' : `${parseFloat(d).toFixed(1)} km`;

/**
 * Build a context object from a route record (the v2/getRoutes item shape used
 * by the route cards) plus anything extra the screen already knows. Every field
 * is optional — a partial context is far more useful than none.
 */
export const buildRouteContext = (routeItem, extra = {}) => {
  if (!routeItem && !Object.keys(extra).length) return null;
  const r = routeItem || {};
  const ctx = {
    routeId: r.id ?? extra.routeId ?? null,
    routeName: r.name || extra.routeName || '',
    from: placeName(r.source_place || r.sourcePlace) || extra.from || '',
    to: placeName(r.destination_place || r.destinationPlace) || extra.to || '',
    busType: r.bus_type?.type || r.busType?.type || extra.busType || '',
    startTime: r.start_time || extra.startTime || '',
    endTime: r.end_time || extra.endTime || '',
    totalTime: r.total_time || extra.totalTime || '',
    distance: km(r.distance ?? extra.distance),
    stops: r.route_stops_count ?? r.route_stops?.length ?? extra.stops ?? null,
  };
  // Nothing identifying at all → treat as no context rather than an empty card.
  return ctx.routeId || ctx.routeName || (ctx.from && ctx.to) ? ctx : null;
};

/** Label/value rows for the read-only card. Blank values are dropped. */
export const contextRows = (ctx, t) => {
  if (!ctx) return [];
  const timing =
    ctx.startTime && ctx.endTime
      ? `${ctx.startTime} – ${ctx.endTime}`
      : ctx.startTime || '';
  const rows = [
    [t('REPORT_CONTEXT.ROUTE'), ctx.routeName],
    [t('REPORT_CONTEXT.FROM_TO'), ctx.from && ctx.to ? `${ctx.from} → ${ctx.to}` : ''],
    [t('REPORT_CONTEXT.BUS_TYPE'), ctx.busType],
    [t('REPORT_CONTEXT.TIMING'), timing],
    [t('REPORT_CONTEXT.DURATION'), ctx.totalTime],
    [t('REPORT_CONTEXT.DISTANCE'), ctx.distance],
    [t('REPORT_CONTEXT.STOPS'), ctx.stops != null ? String(ctx.stops) : ''],
    [t('REPORT_CONTEXT.ROUTE_ID'), ctx.routeId != null ? String(ctx.routeId) : ''],
  ];
  return rows.filter(([, v]) => v !== '' && v != null);
};

/**
 * Append the context to the user's message.
 *
 * Deliberately plain text with an ASCII separator: it has to stay readable
 * wherever the admin ends up seeing it — dashboard, email, raw DB row — and the
 * backend stores `message` verbatim. Labels stay English regardless of the app
 * language, because the people reading these reports work in one language; the
 * user's own words above the separator are of course untouched.
 */
export const appendContextToMessage = (message, ctx) => {
  const body = (message || '').trim();
  if (!ctx) return body;
  const line = (k, v) => (v === '' || v == null ? null : `${k}: ${v}`);
  const details = [
    line('Route', ctx.routeName),
    line('From', ctx.from),
    line('To', ctx.to),
    line('Bus type', ctx.busType),
    line('Start', ctx.startTime),
    line('End', ctx.endTime),
    line('Duration', ctx.totalTime),
    line('Distance', ctx.distance),
    line('Stops', ctx.stops),
    line('Route ID', ctx.routeId),
  ].filter(Boolean);

  if (!details.length) return body;
  return (
    `${body}\n\n` +
    '----- ROUTE DETAILS (added automatically) -----\n' +
    details.join('\n')
  );
};

export default buildRouteContext;
