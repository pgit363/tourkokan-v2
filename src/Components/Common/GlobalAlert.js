import React, {useState, useCallback, useEffect} from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const C = {
  oceanDeep: '#0D3D4A',
  oceanMid: '#1B6B7B',
  white: '#FFFFFF',
  textDark: '#1C1917',
  textMid: '#44403C',
  textLight: '#78716C',
  error: '#DC2626',
  success: '#059669',
  warning: '#D97706',
  info: '#1B6B7B',
};

const TYPE = {
  info:    {icon: 'information-circle', color: C.info,    iconBg: '#DBEAFE'},
  success: {icon: 'checkmark-circle',  color: C.success,  iconBg: '#D1FAE5'},
  error:   {icon: 'close-circle',      color: C.error,    iconBg: '#FEE2E2'},
  warning: {icon: 'warning',           color: C.warning,  iconBg: '#FEF3C7'},
};

// Module-level registry — show function is registered when provider mounts
let _show = null;

export const registerAlertShow = fn => { _show = fn; };
export const unregisterAlertShow = () => { _show = null; };

export const showThemedAlert = (title, message, type = 'info', buttons = null) => {
  if (_show) {
    _show({title, message, type, buttons});
  }
};

export const GlobalAlertProvider = () => {
  const [config, setConfig] = useState(null);

  const show = useCallback(cfg => setConfig(cfg), []);
  const hide = useCallback(() => setConfig(null), []);

  useEffect(() => {
    registerAlertShow(show);
    return () => unregisterAlertShow();
  }, [show]);

  if (!config) return null;

  const cfg = TYPE[config.type] || TYPE.info;
  const buttons = config.buttons || [{text: 'OK'}];

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={hide}>
      <View style={s.backdrop}>
        <View style={s.card}>
          <View style={[s.accentStrip, {backgroundColor: cfg.color}]} />

          <View style={s.body}>
            <View style={[s.iconCircle, {backgroundColor: cfg.iconBg}]}>
              <Ionicons name={cfg.icon} size={34} color={cfg.color} />
            </View>

            {!!config.title && <Text style={s.title}>{config.title}</Text>}
            {!!config.message && <Text style={s.message}>{config.message}</Text>}
          </View>

          <View style={s.divider} />

          {buttons.length > 1 ? (
            <View style={s.btnRow}>
              {buttons.map((btn, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <View style={s.btnDivider} />}
                  <TouchableOpacity
                    style={s.multiBtn}
                    activeOpacity={0.75}
                    onPress={() => {
                      hide();
                      btn.onPress?.();
                    }}>
                    <Text
                      style={[
                        s.multiBtnText,
                        i === buttons.length - 1 && {color: cfg.color, fontWeight: '700'},
                        btn.style === 'destructive' && {color: C.error},
                      ]}>
                      {btn.text}
                    </Text>
                  </TouchableOpacity>
                </React.Fragment>
              ))}
            </View>
          ) : (
            <TouchableOpacity
              style={s.singleBtn}
              activeOpacity={0.8}
              onPress={() => {
                hide();
                buttons[0]?.onPress?.();
              }}>
              <Text style={[s.singleBtnText, {color: cfg.color}]}>
                {buttons[0]?.text || 'OK'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(13,61,74,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
  },
  card: {
    width: '100%',
    backgroundColor: C.white,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 12,
  },
  accentStrip: {
    height: 4,
    width: '100%',
  },
  body: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 24,
    gap: 10,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: C.textDark,
    textAlign: 'center',
    letterSpacing: 0.1,
  },
  message: {
    fontSize: 14,
    color: C.textMid,
    textAlign: 'center',
    lineHeight: 21,
    paddingHorizontal: 4,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(0,0,0,0.09)',
  },
  btnRow: {
    flexDirection: 'row',
    height: 52,
  },
  multiBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  multiBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: C.textLight,
  },
  btnDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(0,0,0,0.09)',
    alignSelf: 'stretch',
    marginVertical: 10,
  },
  singleBtn: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  singleBtnText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
