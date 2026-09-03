/**
 * Cross-platform elevation.
 *
 * Android draws shadows from the single `elevation` number and ignores the
 * `shadow*` props. iOS is the exact opposite: it ignores `elevation` entirely
 * and needs shadowColor/Offset/Opacity/Radius. Styles written for Android alone
 * therefore render completely FLAT on iOS.
 *
 * Spreading this keeps both platforms driven by one number:
 *
 *   card: {
 *     backgroundColor: '#fff',
 *     ...shadow(10),
 *   }
 *
 * Returning both sets (rather than Platform.select) is deliberate — each
 * platform ignores the other's props, so there is no branch to get wrong and
 * the Android output is byte-identical to the plain `elevation: 10` it replaces.
 *
 * NOTE (iOS): a shadow only renders on a view with a non-transparent
 * backgroundColor, and is clipped by `overflow: 'hidden'`. If a card still looks
 * flat after this, check those two things before changing the numbers.
 */

// Tuned against the Material elevation curve so an elevation that reads well on
// Android reads the same on iOS rather than turning into a dark smudge.
export const shadow = (elevation = 2, color = '#000') => ({
  elevation,
  shadowColor: color,
  shadowOffset: {width: 0, height: Math.max(1, Math.round(elevation * 0.5))},
  shadowRadius: Math.max(2, Math.round(elevation * 0.8)),
  shadowOpacity: Math.min(0.18, 0.08 + elevation * 0.008),
});

export default shadow;
