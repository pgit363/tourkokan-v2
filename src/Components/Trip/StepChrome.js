/**
 * The furniture every step of the trip stepper is built from.
 *
 * Lifted out of PlanTripScreen rather than copied: `Section`, `Chip` and
 * `Choice` were declared inside it, and four step screens each re-declaring a
 * chip is how two of them end up looking subtly different. The one-page form
 * imports them from here now too, so there is one chip in the app.
 *
 * `StepHeader` and `StepFooter` are the stepper's own: a progress line that
 * says where you are without pretending the steps are interchangeable, and a
 * footer whose primary action is blocked with a reason rather than silently.
 */
import React from 'react';
import {ActivityIndicator, StyleSheet, TouchableOpacity, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import PropTypes from 'prop-types';
import GlobalText from '../Customs/Text';
import {C} from '../Marketplace/theme';

/**
 * Steps in the long flow — where & what, pick, arrange, review.
 *
 * Letting the model choose the places skips the middle two, so a screen
 * passes its own `total` and the dots follow. Shown as "Step 2 of 4".
 */
export const TOTAL_STEPS = 4;
export const EXPRESS_STEPS = 2;

// ── Shared form pieces ──────────────────────────────────────────────────────

export const Section = ({label, hint, children}) => (
  <View style={s.section}>
    <GlobalText text={label.toUpperCase()} style={s.sectionLabel} />
    {!!hint && <GlobalText text={hint} style={s.sectionHint} />}
    {children}
  </View>
);

Section.propTypes = {
  label: PropTypes.string.isRequired,
  hint: PropTypes.string,
  children: PropTypes.node,
};

export const Chip = ({label, meta, on, onPress}) => (
  <TouchableOpacity
    style={[s.chip, on && s.chipOn]}
    accessibilityRole="button"
    accessibilityState={{selected: on}}
    onPress={onPress}>
    <GlobalText text={label} style={[s.chipTxt, on && s.chipTxtOn]} />
    {!!meta && (
      <GlobalText text={meta} style={[s.chipMeta, on && s.chipMetaOn]} />
    )}
  </TouchableOpacity>
);

Chip.propTypes = {
  label: PropTypes.string.isRequired,
  meta: PropTypes.string,
  on: PropTypes.bool,
  onPress: PropTypes.func.isRequired,
};

/** Two mutually exclusive answers, side by side. */
export const Choice = ({options, value, onChange}) => (
  <View style={s.choice}>
    {options.map(option => {
      const on = option.value === value;

      return (
        <TouchableOpacity
          key={option.value}
          style={[s.choiceBtn, on && s.choiceBtnOn]}
          accessibilityRole="radio"
          accessibilityState={{selected: on}}
          onPress={() => onChange(option.value)}>
          <Ionicons
            name={option.icon}
            size={19}
            color={on ? C.oceanMid : C.textLight}
          />
          <GlobalText
            text={option.label}
            style={[s.choiceTxt, on && s.choiceTxtOn]}
          />
          {!!option.hint && (
            <GlobalText text={option.hint} style={s.choiceHint} />
          )}
        </TouchableOpacity>
      );
    })}
  </View>
);

Choice.propTypes = {
  options: PropTypes.array.isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
};

// ── Stepper chrome ──────────────────────────────────────────────────────────

/**
 * Where the traveller is, and the way back.
 *
 * The dots are not tappable. A step depends on the one before it — you cannot
 * pick places before saying which towns — so offering them as navigation
 * would promise a jump the flow cannot honour.
 */
export const StepHeader = ({step, total, title, caption, onBack, backLabel}) => {
  const steps = total || TOTAL_STEPS;
  const insets = useSafeAreaInsets();

  return (
    <View style={[s.header, {paddingTop: insets.top + 8}]}>
      <View style={s.headerRow}>
        <TouchableOpacity
          style={s.back}
          accessibilityRole="button"
          accessibilityLabel={backLabel}
          onPress={onBack}>
          <Ionicons name="chevron-back" size={20} color={C.white} />
        </TouchableOpacity>
        <View style={s.headerText}>
          <GlobalText text={title} style={s.headerTitle} />
          {!!caption && <GlobalText text={caption} style={s.headerCaption} />}
        </View>
      </View>

      <View
        style={s.dots}
        accessibilityRole="progressbar"
        accessibilityValue={{min: 1, max: steps, now: step}}>
        {Array.from({length: steps}, (_, i) => (
          <View
            key={i}
            style={[
              s.dot,
              i + 1 === step && s.dotOn,
              i + 1 < step && s.dotDone,
            ]}
          />
        ))}
      </View>
    </View>
  );
};

StepHeader.propTypes = {
  step: PropTypes.number.isRequired,
  total: PropTypes.number,
  title: PropTypes.string.isRequired,
  caption: PropTypes.string,
  onBack: PropTypes.func.isRequired,
  backLabel: PropTypes.string,
};

/**
 * The primary action, and why it is not available yet.
 *
 * `verdict` always says something. A disabled button with no explanation is
 * the thing people tap twice and then leave.
 */
export const StepFooter = ({label, verdict, ready, busy, onPress}) => (
  <View style={s.footer}>
    <TouchableOpacity
      style={[s.primaryBtn, !ready && s.primaryBtnOff]}
      accessibilityRole="button"
      accessibilityState={{disabled: !ready || busy}}
      disabled={!ready || busy}
      onPress={onPress}>
      {busy ? (
        <ActivityIndicator color={C.white} />
      ) : (
        <GlobalText text={label} style={s.primaryTxt} />
      )}
    </TouchableOpacity>
    {!!verdict && (
      <View style={s.verdict}>
        <GlobalText text={verdict} style={s.verdictTxt} />
      </View>
    )}
  </View>
);

StepFooter.propTypes = {
  label: PropTypes.string.isRequired,
  verdict: PropTypes.string,
  ready: PropTypes.bool,
  busy: PropTypes.bool,
  onPress: PropTypes.func.isRequired,
};

const s = StyleSheet.create({
  section: {marginBottom: 26},
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: C.textLight,
    marginBottom: 4,
  },
  sectionHint: {fontSize: 12.5, color: C.textLight, marginBottom: 11},

  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.white,
  },
  chipOn: {borderColor: C.oceanMid, backgroundColor: 'rgba(27,107,123,0.08)'},
  chipTxt: {fontSize: 14, fontWeight: '600', color: C.textDark},
  chipTxtOn: {color: C.oceanMid, fontWeight: '700'},
  chipMeta: {fontSize: 11, color: C.textLight},
  chipMetaOn: {color: C.oceanMid},

  choice: {flexDirection: 'row', gap: 10},
  choiceBtn: {
    flex: 1,
    gap: 5,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.white,
  },
  choiceBtnOn: {
    borderColor: C.oceanMid,
    backgroundColor: 'rgba(27,107,123,0.06)',
  },
  choiceTxt: {fontSize: 14.5, fontWeight: '700', color: C.textDark},
  choiceTxtOn: {color: C.oceanMid},
  choiceHint: {fontSize: 11.5, color: C.textLight, lineHeight: 16},

  header: {
    backgroundColor: C.oceanDeep,
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  headerRow: {flexDirection: 'row', alignItems: 'center', gap: 10},
  back: {
    width: 38,
    height: 38,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  headerText: {flex: 1, minWidth: 0},
  headerTitle: {fontSize: 17, fontWeight: '800', color: C.white},
  headerCaption: {fontSize: 11.5, color: C.oceanFoam},

  dots: {flexDirection: 'row', gap: 6, marginTop: 12},
  dot: {
    flex: 1,
    height: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  dotOn: {backgroundColor: C.white},
  dotDone: {backgroundColor: C.oceanFoam},

  footer: {
    padding: 16,
    paddingBottom: 20,
    backgroundColor: C.white,
    borderTopWidth: 1,
    borderTopColor: C.line,
  },
  primaryBtn: {
    height: 52,
    borderRadius: 999,
    backgroundColor: C.oceanMid,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnOff: {backgroundColor: C.textLight, opacity: 0.4},
  primaryTxt: {fontSize: 16, fontWeight: '700', color: C.white},
  verdict: {
    flexDirection: 'row',
    gap: 7,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 11,
  },
  verdictTxt: {fontSize: 12.5, color: C.textLight, textAlign: 'center'},
});
