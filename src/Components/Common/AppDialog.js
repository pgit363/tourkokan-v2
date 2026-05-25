import React, {useState, useCallback} from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const C = {
  oceanDeep: '#0D3D4A',
  oceanMid: '#1B6B7B',
  cream: '#FAF7F0',
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
  delete:  {icon: 'trash',             color: C.error,    iconBg: '#FEE2E2'},
  confirm: {icon: 'help-circle',       color: C.oceanMid, iconBg: '#E0F2FE'},
};

const AppDialog = ({
  visible,
  type = 'info',
  title,
  message,
  confirmText = 'OK',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  onClose,
  loading = false,
}) => {
  const cfg = TYPE[type] || TYPE.info;
  const hasTwoButtons = type === 'delete' || type === 'confirm' || (!!onConfirm && !!onCancel);
  const isDestructive = type === 'delete';

  const handleClose = () => onClose?.();
  const handleConfirm = () => onConfirm?.();

  return (
    <Modal
      visible={!!visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleClose}>
      <View style={s.backdrop}>
        <View style={s.card}>
          <View style={[s.accentStrip, {backgroundColor: cfg.color}]} />

          <View style={s.body}>
            <View style={[s.iconCircle, {backgroundColor: cfg.iconBg}]}>
              <Ionicons name={cfg.icon} size={34} color={cfg.color} />
            </View>

            {!!title && <Text style={s.title}>{title}</Text>}
            {!!message && <Text style={s.message}>{message}</Text>}
          </View>

          <View style={s.divider} />

          {hasTwoButtons ? (
            <View style={s.btnRow}>
              <TouchableOpacity
                style={s.cancelBtn}
                onPress={handleClose}
                activeOpacity={0.7}
                disabled={loading}>
                <Text style={s.cancelText}>{cancelText}</Text>
              </TouchableOpacity>

              <View style={s.btnDivider} />

              <TouchableOpacity
                style={[s.confirmBtn, loading && {opacity: 0.6}]}
                onPress={handleConfirm}
                activeOpacity={0.8}
                disabled={loading}>
                {loading ? (
                  <ActivityIndicator size="small" color={isDestructive ? C.error : C.oceanMid} />
                ) : (
                  <Text style={[s.confirmText, isDestructive && s.confirmTextDestructive]}>
                    {confirmText}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={s.singleBtn} onPress={handleClose} activeOpacity={0.8}>
              <Text style={[s.singleBtnText, {color: cfg.color}]}>{confirmText}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

export const useAppDialog = () => {
  const [config, setConfig] = useState(null);

  const show = useCallback(cfg => setConfig(cfg), []);
  const hide = useCallback(() => setConfig(null), []);

  const dialog = config ? (
    <AppDialog
      {...config}
      visible
      onClose={() => {
        hide();
        config.onClose?.();
        config.onCancel?.();
      }}
      onCancel={() => {
        hide();
        config.onCancel?.();
      }}
      onConfirm={() => {
        hide();
        config.onConfirm?.();
      }}
    />
  ) : null;

  return {show, hide, dialog};
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
    fontWeight: '400',
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
  cancelBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
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
  confirmBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: {
    fontSize: 15,
    fontWeight: '700',
    color: C.oceanMid,
  },
  confirmTextDestructive: {
    color: C.error,
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

export default AppDialog;
