import React from 'react';
import {ScrollView, View, StyleSheet} from 'react-native';
import {useTranslation} from 'react-i18next';
import DIMENSIONS from '../../Services/Constants/DIMENSIONS';
import TextButton from '../Customs/Buttons/TextButton';
import PrivacyPolicyContent from './PrivacyPolicyContent';

const PrivacyPolicy = ({cancelClick, acceptClick, containerStyle}) => {
  const {t} = useTranslation();

  return (
    <View style={[localStyles.container, containerStyle]}>
      <ScrollView
        style={localStyles.flex}
        contentContainerStyle={localStyles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <PrivacyPolicyContent />
      </ScrollView>

      {(acceptClick || cancelClick) && (
        <View style={localStyles.buttonContainer}>
          <TextButton title={t('BUTTON.ACCEPT')} onPress={acceptClick} />
          <TextButton title={t('BUTTON.CANCEL')} onPress={cancelClick} />
        </View>
      )}
    </View>
  );
};

const localStyles = StyleSheet.create({
  container: {
    height: DIMENSIONS.screenHeight - 200,
    width: DIMENSIONS.bannerWidth,
    marginTop: 20,
    marginBottom: -10,
  },
  flex: {flex: 1},
  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingVertical: 8,
  },
});

export default PrivacyPolicy;
