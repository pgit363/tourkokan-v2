/** Product lifecycle status → a colored pill. */
import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useTranslation} from 'react-i18next';
import {TONE} from './theme';

const MAP = {
  approved: 'live',
  live: 'live',
  active: 'live',
  pending: 'pending',
  draft: 'draft',
  rejected: 'rejected',
  paused: 'paused',
};
const LABEL_KEY = {
  live: 'STATUS_LIVE',
  pending: 'STATUS_PENDING',
  draft: 'STATUS_DRAFT',
  rejected: 'STATUS_REJECTED',
  paused: 'PAUSED',
};

export const statusTone = status => MAP[(status || '').toLowerCase()] || 'draft';

const StatusPill = ({status, style}) => {
  const {t} = useTranslation();
  const tone = statusTone(status);
  const c = TONE[tone];
  return (
    <View style={[s.pill, {backgroundColor: c.bg}, style]}>
      <View style={[s.dot, {backgroundColor: c.fg}]} />
      <Text style={[s.txt, {color: c.fg}]}>{t('MARKETPLACE.' + LABEL_KEY[tone])}</Text>
    </View>
  );
};

const s = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  dot: {width: 6, height: 6, borderRadius: 3},
  txt: {fontSize: 9.5, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.4},
});

export default StatusPill;
