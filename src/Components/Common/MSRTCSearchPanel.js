import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import {connect} from 'react-redux';
import {useFocusEffect} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {setSource, setDestination, setLoader} from '../../Reducers/CommonActions';
import {navigateTo} from '../../Services/CommonMethods';
import STRING from '../../Services/Constants/STRINGS';
import {useGuestGate, isGuestUser, GUEST_KEYS, incrementGuestCount} from './GuestGateModal';
import {useConnectivityGate} from './useConnectivityGate';

// ─── Design tokens ────────────────────────────────────────────────────────────

const C = {
  oceanDeep: '#0D3D4A',
  oceanMid: '#1B6B7B',
  forestMid: '#2E5C3A',
  sandMid: '#C4972A',
  earthMid: '#6B4226',
  cream: '#FAF7F0',
  white: '#FFFFFF',
  textDark: '#1C1917',
  textMid: '#44403C',
  textLight: '#78716C',
};

// ─── Component ────────────────────────────────────────────────────────────────

const MSRTCSearchPanel = ({navigation, ...props}) => {
  const {t} = useTranslation();
  const {show: showGuestPopup, modal: guestModal} = useGuestGate(navigation);
  const {modal: connectivityModal, ensureOnline} = useConnectivityGate();
  const [errorText, setErrorText] = useState('');

  // Sync Redux state when returning from SearchPlace screen
  useFocusEffect(
    React.useCallback(() => {
      setErrorText('');
    }, [props.source, props.destination]),
  );

  const srcName = props.source?.name || '';
  const destName = props.destination?.name || '';
  const isValid = !!(props.source?.id && props.destination?.id);
  const canSwap = !!(srcName || destName);

  // Routes need live data → gate source/destination pickers + search by mode.
  const pressedSource = () =>
    ensureOnline(() =>
      navigateTo(navigation, t('SCREEN.SEARCH_PLACE'), {
        type: STRING.LABEL.SOURCE,
        from: t('SCREEN.ROUTES'),
      }),
    );

  const pressedDest = () =>
    ensureOnline(() =>
      navigateTo(navigation, t('SCREEN.SEARCH_PLACE'), {
        type: STRING.LABEL.DESTINATION,
        from: t('SCREEN.ROUTES'),
      }),
    );

  const swap = () => {
    const a = props.source;
    const b = props.destination;
    props.setSource(b || '');
    props.setDestination(a || '');
    setErrorText('');
  };

  const reset = () => {
    props.setSource('');
    props.setDestination('');
    setErrorText('');
  };

  const handleSearch = async () => {
    if (!isValid) {
      setErrorText(t('ALERT.SOURCE_DESTINATION_REQUIRED'));
      return;
    }
    const count = await incrementGuestCount(GUEST_KEYS.ROUTE_SEARCH_COUNT);
    if (count > 2 && (await isGuestUser())) {
      showGuestPopup('Login to search more routes. Guest users are limited to 2 searches.');
      return;
    }
    setErrorText('');
    // Offline mode → prompt to go online before searching routes.
    ensureOnline(() =>
      navigateTo(navigation, t('SCREEN.ALL_ROUTES_SEARCH'), {
        source: props.source,
        destination: props.destination,
      }),
    );
  };

  return (
    <View style={s.card}>

      {/* FROM */}
      <Text style={s.inputLabel}>{t('MSRTC_SCREEN.FROM_LABEL')}</Text>
      <TouchableOpacity
        style={[s.inputField, srcName && s.inputFieldFilled]}
        onPress={pressedSource}
        activeOpacity={0.8}>
        <Ionicons
          name="location-outline"
          size={18}
          color={srcName ? C.oceanMid : C.textLight}
        />
        <Text
          style={[s.inputFieldText, srcName && s.inputFieldTextFilled]}
          numberOfLines={1}>
          {srcName || t('MSRTC_SCREEN.FROM_PLACEHOLDER')}
        </Text>
        {srcName ? (
          <Ionicons name="checkmark-circle" size={16} color={C.oceanMid} />
        ) : null}
      </TouchableOpacity>

      {/* Divider row with swap + reset floating between the two fields */}
      <View style={s.dividerRow}>
        <View style={s.dividerLine} />

        <View style={s.dividerActions}>
          {/* Swap */}
          <View style={[s.swapRing, !canSwap && s.btnDisabled]}>
            <TouchableOpacity
              style={s.swapBtn}
              onPress={canSwap ? swap : null}
              activeOpacity={0.8}>
              <Text style={s.swapIcon}>⇅</Text>
            </TouchableOpacity>
          </View>

          {/* Reset */}
          <View style={[s.resetRing, !canSwap && s.btnDisabled]}>
            <TouchableOpacity
              style={s.resetBtn}
              onPress={canSwap ? reset : null}
              activeOpacity={0.75}>
              <Ionicons
                name="refresh-outline"
                size={18}
                color={C.white}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={s.dividerLine} />
      </View>

      {/* TO */}
      <Text style={s.inputLabel}>{t('MSRTC_SCREEN.TO_LABEL')}</Text>
      <TouchableOpacity
        style={[s.inputField, destName && s.inputFieldFilled]}
        onPress={pressedDest}
        activeOpacity={0.8}>
        <Ionicons
          name="navigate-outline"
          size={18}
          color={destName ? C.oceanMid : C.textLight}
        />
        <Text
          style={[s.inputFieldText, destName && s.inputFieldTextFilled]}
          numberOfLines={1}>
          {destName || t('MSRTC_SCREEN.TO_PLACEHOLDER')}
        </Text>
        {destName ? (
          <Ionicons name="checkmark-circle" size={16} color={C.oceanMid} />
        ) : null}
      </TouchableOpacity>

      {/* Error */}
      {!!errorText && (
        <Text style={s.errorText}>{errorText}</Text>
      )}

      {/* Search button */}
      <TouchableOpacity
        style={[s.searchBtn, !isValid && s.searchBtnDisabled]}
        onPress={handleSearch}
        activeOpacity={0.85}>
        <Image
          source={require('../../Assets/Images/Bus1_png_high.png')}
          style={s.searchBtnIcon}
          resizeMode="contain"
        />
        <Text style={s.searchBtnText}>{t('MSRTC_SCREEN.SEARCH_BTN')}</Text>
      </TouchableOpacity>

      {guestModal}
      {connectivityModal}
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  card: {
    backgroundColor: C.white,
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },

  // Labels
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: C.textMid,
    letterSpacing: 0.8,
    marginBottom: 6,
    textTransform: 'uppercase',
  },

  // Fields
  inputField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.10)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 15,
    backgroundColor: '#F9FAFB',
  },
  inputFieldFilled: {
    borderColor: C.oceanMid,
    backgroundColor: 'rgba(27,107,123,0.04)',
  },
  inputFieldText: {
    flex: 1,
    fontSize: 14,
    color: C.textLight,
  },
  inputFieldTextFilled: {
    color: C.textDark,
    fontWeight: '500',
  },

  // Divider row between FROM and TO
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: -8,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.07)',
  },
  dividerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  // Swap — outer ring + inner filled circle
  swapRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: C.sandMid,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swapBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.sandMid,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swapIcon: {
    fontSize: 18,
    color: C.white,
    fontWeight: '700',
  },

  // Reset — outer ring + inner filled circle
  resetRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: C.oceanMid,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.oceanMid,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Disabled state shared
  btnDisabled: {
    opacity: 0.45,
  },

  // Error
  errorText: {
    fontSize: 12,
    color: '#E53E3E',
    marginTop: 8,
    marginBottom: 2,
  },

  // Search button — gradient-like via oceanMid→forestMid
  searchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 20,
    paddingVertical: 16,
    borderRadius: 50,
    backgroundColor: C.oceanMid,
    shadowColor: C.oceanMid,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  searchBtnDisabled: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0,
    elevation: 0,
  },
  searchBtnIcon: {width: 24, height: 24},
  searchBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: C.white,
    letterSpacing: 0.3,
  },
});

// ─── Redux ────────────────────────────────────────────────────────────────────

const mapStateToProps = state => ({
  source: state.commonState.source,
  destination: state.commonState.destination,
});

const mapDispatchToProps = dispatch => ({
  setLoader: data => dispatch(setLoader(data)),
  setSource: data => dispatch(setSource(data)),
  setDestination: data => dispatch(setDestination(data)),
});

export default connect(mapStateToProps, mapDispatchToProps)(MSRTCSearchPanel);
