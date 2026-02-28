/* eslint-disable react-hooks/exhaustive-deps */
import React, {useEffect, useState} from 'react';
import {FlatList} from 'react-native';
import {connect} from 'react-redux';
import Header from '../Components/Common/Header';
import SearchBar from '../Components/Customs/Search';
import styles from './Styles';
import {comnPost} from '../Services/Api/CommonServices';
import {ListItem} from '@rneui/themed';
import {setDestination, setLoader, setSource} from '../Reducers/CommonActions';
import Loader from '../Components/Customs/Loader';
import {checkLogin, goBackHandler, navigateTo} from '../Services/CommonMethods';
import STRING from '../Services/Constants/STRINGS';
import {TouchableOpacity} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import COLOR from '../Services/Constants/COLORS';

const SearchPlace = ({navigation, route, ...props}) => {
  const [searchValue, setSearchValue] = useState('');
  const [placesList, setPlacesList] = useState([]);
  const [nextPage, setNextPage] = useState(1);

  const screenStyle = {flex: 1, backgroundColor: COLOR.white};
  const listStyle = {marginBottom: 30};

  useEffect(() => {
    props.setLoader(true);
    const backHandler = goBackHandler(navigation);
    checkLogin(navigation);
    searchPlace('');
    return () => {
      backHandler.remove();
    };
  }, []);

  const searchPlace = v => {
    setPlacesList([]);
    setSearchValue(v);
    let data = {
      search: v,
      apitype: 'dropdown',
      type: 'bus',
    };
    comnPost('v2/sites', data)
      .then(res => {
        if (res.data.success) {
          let nextUrl = res.data.data.next_page_url;
          setPlacesList([...placesList, ...res.data.data.data]);
          setNextPage(nextUrl[nextUrl.length - 1]);
          props.setLoader(false);
          setPlacesList(res.data.data.data);
        } else {
          props.setLoader(false);
        }
      })
      .catch(error => {
        console.warn('Search place failed:', error);
        props.setLoader(false);
      });
  };

  const scrollPlace = (v, page) => {
    // props.setLoader(true)
    setSearchValue(v);
    let data = {
      search: v,
      apitype: 'dropdown',
      type: 'bus',
    };
    comnPost(`v2/sites?page=${page}`, data)
      .then(res => {
        if (res.data.success) {
          let nextUrl = res.data.data.next_page_url;
          setPlacesList([...placesList, ...res.data.data.data]);
          setNextPage(nextUrl[nextUrl.length - 1]);
          props.setLoader(false);
        } else {
          props.setLoader(false);
        }
      })
      .catch(error => {
        console.warn('Scroll place failed:', error);
        props.setLoader(false);
      });
  };

  const setPlace = place => {
    navigateTo(navigation, route.params?.from, {from: 'SearchPlace'});
    if (route.params.type === STRING.LABEL.SOURCE) {
      props.setSource(place);
    } else {
      props.setDestination(place);
    }
    setSearchValue('');
  };

  const goToNext = () => {
    props.setLoader(true);
    scrollPlace(searchValue, nextPage);
  };

  const renderItem = ({item}) => {
    return (
      <TouchableOpacity
        key={item.id}
        onPress={() => setPlace(item)}
        style={styles.listItem}
        activeOpacity={0.3} // Set the opacity when the item is pressed
      >
        <ListItem bottomDivider>
          <ListItem.Content>
            <ListItem.Title>{item.name}</ListItem.Title>
          </ListItem.Content>
        </ListItem>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView edges={['top']} style={screenStyle}>
      <Loader />
      <Header
        Component={
          <SearchBar
            style={styles.homeSearchBar}
            placeholder={`Enter ${route.params.type}`}
            value={searchValue}
            onChangeText={v => searchPlace(v)}
          />
        }
      />
      {/* <ScrollView> */}
      <FlatList
        keyExtractor={item => item.id}
        data={placesList}
        renderItem={renderItem}
        onEndReached={goToNext}
        onEndReachedThreshold={0.5}
        style={listStyle}
      />
      {/* </ScrollView> */}
    </SafeAreaView>
  );
};

const mapStateToProps = state => {
  return {
    source: state.commonState.source,
    destination: state.commonState.destination,
  };
};

const mapDispatchToProps = dispatch => {
  return {
    setSource: data => {
      dispatch(setSource(data));
    },
    setDestination: data => {
      dispatch(setDestination(data));
    },
    setLoader: data => {
      dispatch(setLoader(data));
    },
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(SearchPlace);
