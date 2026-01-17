import React, {useState, useRef, useEffect} from 'react';
import {View, Image, FlatList, ScrollView} from 'react-native';
import {List} from 'react-native-paper';
import styles from './Styles';
import Ionicons from 'react-native-vector-icons/Ionicons';
import COLOR from '../../Services/Constants/COLORS';
import DIMENSIONS from '../../Services/Constants/DIMENSIONS';
import SubCatCard from '../Cards/SubCatCard';
import {navigateTo} from '../../Services/CommonMethods';
import {useTranslation} from 'react-i18next';
import {FTP_PATH} from '@env';

const Accordion = ({data, navigation}) => {
  const {t} = useTranslation();
  const [expandedIndex, setExpandedIndex] = useState(0); // Default to the first item
  const scrollViewRef = useRef(null);

  useEffect(() => {
    if (scrollViewRef.current) {
      // Scroll to the initially expanded item
      scrollViewRef.current.scrollTo({
        y: 0, // Adjust if needed based on item height
        animated: true,
      });
    }
  }, []);

  useEffect(() => {
    data.forEach((item) => {
      if (item.icon && typeof item.icon === 'string' && item.icon !== '0') {
        console.log('Icon:', FTP_PATH + item.icon); // Log only once per item
      }
    });
  }, [data]);

  const toggleExpanded = index => {
    setExpandedIndex(prevIndex => {
      const newIndex = prevIndex === index ? null : index;
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({
          y: newIndex * 100, // Adjust the value based on your item height
          animated: true,
        });
      }
      return newIndex;
    });
  };

  // Render subcategories in 3 columns
  const renderSubCategories = subCategories => (
    <View style={{flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center'}}>
      {subCategories.map((item) => (
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

  // Accordion item with centered title and subcategories in 3 columns
  const AccordionItem = ({item, index}) => {
    return (
      <List.Accordion
        title={item.name}
        titleStyle={styles.titleStyle} // Apply title styles here
        expanded={expandedIndex === index}
        onPress={() => toggleExpanded(index)}
        left={() => (
          <View style={styles.catCardIconContainer}>
            <Image
              source={
                item.icon && typeof item.icon === 'string' && item.icon !== '0'
                  ? (item.icon.endsWith('.svg')
                      ? require('../../Assets/Images/no-image.png') // Fallback for unsupported SVG
                      : {uri: FTP_PATH + item.icon})
                  : require('../../Assets/Images/no-image.png') // Fallback image
              }
              style={[
                styles.catCardIcon,
                expandedIndex === index && styles.selectedIcon,
              ]}
            />
          </View>
        )}
        right={() => (
          <Ionicons
            name={expandedIndex === index ? 'chevron-up' : 'chevron-down'}
            color={COLOR.black}
            size={DIMENSIONS.iconMedium}
          />
        )}
        contentStyle={styles.accordContent} // Ensure the accordion content is centered
        style={[
          styles.accordHeader,
          expandedIndex === index && styles.selectedHeader,
        ]} // Highlight selected item
      >
        <View style={styles.accordContent}>
          {renderSubCategories(item.sub_categories)}
        </View>
      </List.Accordion>
    );
  };

  return (
    <ScrollView ref={scrollViewRef}>
      <List.Section>
        {data.map((item, index) => (
          <AccordionItem key={index.toString()} item={item} index={index} />
        ))}
      </List.Section>
    </ScrollView>
  );
};

export default Accordion;
