import React, {useEffect, useState} from 'react';
import {FlatList, View, SafeAreaView} from 'react-native';
import {connect} from 'react-redux';
import Header from '../../Components/Common/Header';
import SearchBar from '../../Components/Customs/Search';
import Loader from '../../Components/Customs/Loader';
import {ListItem} from '@rneui/themed';
import {
  checkLogin,
  goBackHandler,
  navigateTo,
} from '../../Services/CommonMethods';
import {comnPost} from '../../Services/Api/CommonServices';
import {setLoader} from '../../Reducers/CommonActions';
import {useTranslation} from 'react-i18next';

const CityPlaceSearch = ({navigation, route, ...props}) => {
  const {t} = useTranslation();

  const [searchValue, setSearchValue] = useState('');
  const [tableName, setTableName] = useState('places');
  const [placesList, setPlacesList] = useState([]);
  const [isCity, setIsCity] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    props.setLoader(true);
    const backHandler = goBackHandler(navigation);
    checkLogin(navigation);
    searchPlace('', t('TABLE.PLACES'));
    return () => {
      backHandler.remove();
    };
  }, []);

  const searchPlace = (val, table) => {
    setSearchValue(val);
    const data = {
      search: val,
      apitype: 'dropdown',
      global: 1,
    };
    // if (searchValue.length > 2) {
    comnPost('v2/sites', data)
      .then(res => {
        setPlacesList(res.data.data.data);
        setIsLoading(false);
        props.setLoader(false);
      })
      .catch(err => {
        setIsLoading(false);
        props.setLoader(false);
      });
    // } else setPlacesList([])
  };

  const onChipClick = val => {
    setIsCity(val);
    let table = t('TABLE.CITIES');
    if (!val) {
      setTableName(t('TABLE.PLACES'));
      table = t('TABLE.PLACES');
    } else setTableName(t('TABLE.CITIES'));
    searchPlace(searchValue, table);
  };

  const onListItemClick = id => {
    if (isCity) navigateTo(navigation, t('SCREEN.CITY_DETAILS'), {id});
    else navigateTo(navigation, t('SCREEN.PLACE_DETAILS'), {id});
  };

  const renderItem = ({item}) => {
    return (
      <ListItem bottomDivider onPress={() => onListItemClick(item.id)}>
        <ListItem.Content>
          <ListItem.Title>{item.name}</ListItem.Title>
        </ListItem.Content>
      </ListItem>
    );
  };

  return (
    <View>
      <Loader isLoading={isLoading} />
      <Header
        Component={
          <SearchBar
            placeholder={t('PLACEHOLDER.ENTER_TEXT')}
            value={searchValue}
            onChangeText={v => searchPlace(v, tableName)}
          />
        }
      />

      {/* <View style={styles.flexRow}>
                <TouchableOpacity style={[styles.clickChip, isCity ? styles.chipEnabled : styles.chipDisabled]} onPress={() => onChipClick(true)}>
                    <GlobalText text={"City"} style={styles.chipTitle} />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.clickChip, !isCity ? styles.chipEnabled : styles.chipDisabled]} onPress={() => onChipClick(false)}>
                    <GlobalText text={"Place"} style={styles.chipTitle} />
                </TouchableOpacity>
            </View> */}

      <SafeAreaView>
        <FlatList
          keyExtractor={item => item.id}
          data={placesList}
          renderItem={renderItem}
        />
      </SafeAreaView>
    </View>
  );
};

const mapStateToProps = state => {
  return {};
};

const mapDispatchToProps = dispatch => {
  return {
    setLoader: data => {
      dispatch(setLoader(data));
    },
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(CityPlaceSearch);
