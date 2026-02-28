import React, {useState, useRef, useEffect} from 'react';
import {View, Image, ScrollView} from 'react-native';
import {List} from 'react-native-paper';
import styles from './Styles';
import Ionicons from 'react-native-vector-icons/Ionicons';
import COLOR from '../../Services/Constants/COLORS';
import DIMENSIONS from '../../Services/Constants/DIMENSIONS';
import SubCatCard from '../Cards/SubCatCard';
import {navigateTo} from '../../Services/CommonMethods';
import {useTranslation} from 'react-i18next';
import {FTP_PATH} from '@env';

const subCategoryContainerStyle = {
  flexDirection: 'row',
  flexWrap: 'wrap',
  justifyContent: 'center',
};

const getIconSource = item => {
  if (item.icon && typeof item.icon === 'string' && item.icon !== '0') {
    if (item.icon.endsWith('.svg')) {
      return require('../../Assets/Images/no-image.png');
    }
    return {uri: item.icon};
  }

  return require('../../Assets/Images/no-image.png');
};

const renderLeftIcon = (item, isExpanded) => () => (
  <View style={styles.catCardIconContainer}>
    <Image
      source={getIconSource(item)}
      style={[styles.catCardIcon, isExpanded && styles.selectedIcon]}
    />
  </View>
);

const renderRightIcon = isExpanded => () => (
  <Ionicons
    name={isExpanded ? 'chevron-up' : 'chevron-down'}
    color={COLOR.black}
    size={DIMENSIONS.iconMedium}
  />
);

const AccordionItem = ({
  item,
  index,
  expandedIndex,
  toggleExpanded,
  renderSubCategories,
}) => (
  <List.Accordion
    title={item.name}
    titleStyle={styles.titleStyle}
    expanded={expandedIndex === index}
    onPress={() => toggleExpanded(index)}
    left={renderLeftIcon(item, expandedIndex === index)}
    right={renderRightIcon(expandedIndex === index)}
    contentStyle={styles.accordContent}
    style={[styles.accordHeader, expandedIndex === index && styles.selectedHeader]}>
    <View style={styles.accordContent}>
      {renderSubCategories(item.sub_categories)}
    </View>
  </List.Accordion>
);

const Accordion = ({data, navigation}) => {
  const {t} = useTranslation();
  const [expandedIndex, setExpandedIndex] = useState(0);
  const scrollViewRef = useRef(null);

  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        y: 0,
        animated: true,
      });
    }
  }, []);

  useEffect(() => {
    data.forEach(item => {
      if (item.icon && typeof item.icon === 'string' && item.icon !== '0') {
        console.log('Icon:', FTP_PATH + item.icon);
      }
    });
  }, [data]);

  const toggleExpanded = index => {
    setExpandedIndex(prevIndex => {
      const newIndex = prevIndex === index ? null : index;
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({
          y: newIndex * 100,
          animated: true,
        });
      }
      return newIndex;
    });
  };

  const renderSubCategories = subCategories => (
    <View style={subCategoryContainerStyle}>
      {subCategories.map(item => (
        <SubCatCard
          key={item.id.toString()}
          data={item}
          onClick={() => goToSubCats(item)}
        />
      ))}
    </View>
  );

  const goToSubCats = subCat => {
    navigateTo(navigation, t('SCREEN.CITY_LIST'), {subCat});
  };

  return (
    <ScrollView ref={scrollViewRef}>
      <List.Section>
        {data.map((item, index) => (
          <AccordionItem
            key={index.toString()}
            item={item}
            index={index}
            expandedIndex={expandedIndex}
            toggleExpanded={toggleExpanded}
            renderSubCategories={renderSubCategories}
          />
        ))}
      </List.Section>
    </ScrollView>
  );
};

export default Accordion;
