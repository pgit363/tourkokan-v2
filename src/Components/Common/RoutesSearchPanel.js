import React, {useEffect, useState} from 'react';
import {View} from 'react-native';
import {SrcDest} from '../../Services/Constants/FIELDS';
import TextButton from '../Customs/Buttons/TextButton';
import TextField from '../Customs/TextField';
import styles from './Styles';
import {connect} from 'react-redux';
import {comnPost} from '../../Services/Api/CommonServices';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import COLOR from '../../Services/Constants/COLORS';
import DIMENSIONS from '../../Services/Constants/DIMENSIONS';
import {
  setDestination,
  setLoader,
  setSource,
} from '../../Reducers/CommonActions';
import GlobalText from '../Customs/Text';
import SearchDropdown from './SearchDropdown';
import {useTranslation} from 'react-i18next';
import STRING from '../../Services/Constants/STRINGS';
import {navigateTo} from '../../Services/CommonMethods';
import {useFocusEffect} from '@react-navigation/native';

const RoutesSearchPanel = ({
  mySource,
  myDestination,
  navigation,
  from,
  onSwap,
  setSourceId,
  setDestinationId,
  searchRoutes,
  ...props
}) => {
  const {t} = useTranslation();

  const [isValid, setIsValid] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [placesList, setPlacesList] = useState([]);
  const [nextPage, setNextPage] = useState(1);
  const [searchValue, setSearchValue] = useState('');
  const [fieldType, setFieldType] = useState('');
  const [source, setSource] = useState(mySource);
  const [destination, setDestination] = useState(myDestination);

  useEffect(() => {
    setSource(props.source || '');
    setDestination(props.destination || '');
    // checkIsValid()
    checkIsValid();
  }, [props]);

  useFocusEffect(
    React.useCallback(async () => {
      setSource(props.source || '');
      setDestination(props.destination || '');
      checkIsValid();
    }, [props.source, props.destination]),
  );

  const setValue = (v, i, index, type) => {
    switch (index) {
      case 0:
        setSource(v);
        break;
      case 1:
        setDestination(v);
        break;
    }
    searchPlace(v);
    setFieldType(type);
    checkIsValid();
  };

  const getValue = i => {
    switch (i) {
      case 0:
        return props.source?.name || source?.name;
      case 1:
        return props.destination?.name || destination?.name;
    }
  };

  const checkIsValid = () => {
    if (
      (source?.name || props.source?.name) &&
      (destination?.name || props.destination?.name)
    )
      setIsValid(true);
    else setIsValid(false);
  };

  const gotoRoutes = () => {
    // setSource("")
    // setDestination("")
    if (isValid) {
      searchRoutes(source.id, destination.id);
    } else setErrorText(t('ALERT.SOURCE_DESTINATION_REQUIRED'));
  };

  const swap = async () => {
    let a = source;
    let b = destination;
    setSource(b);
    setSourceId(b.id);
    setDestination(a);
    setDestinationId(a.id);
    props.setSource(b);
    props.setDestination(a);
  };

  const refresh = async () => {
    let a = '';
    let b = '';
    setSource('');
    setSourceId(null);
    setDestination('');
    setDestinationId(null);
    props.setSource('');
    props.setDestination('');
    onSwap(a, b);
  };

  const searchPlace = v => {
    setSearchValue(v);
    let data = {
      search: v,
      apitype: 'dropdown',
      type: 'bus',
    };
    comnPost(`v2/sites`, data)
      .then(res => {
        if (res.data.success) {
          props.setLoader(false);
          setPlacesList(res.data.data.data);
        } else {
          props.setLoader(false);
        }
      })
      .catch(err => {
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
      .catch(err => {
        props.setLoader(false);
      });
  };

  const setPlace = place => {
    if (fieldType == STRING.LABEL.SOURCE) {
      setSource(place);
      setSourceId(place.id);
    } else {
      setDestination(place);
      setDestinationId(place.id);
    }
    setSearchValue('');
    setPlacesList([]);
  };

  const goToNext = () => {
    props.setLoader(true);
    scrollPlace(searchValue, nextPage);
  };

  const pressed = type => {
    navigateTo(navigation, t('SCREEN.SEARCH_PLACE'), {
      type,
      from: t('SCREEN.ALL_ROUTES_SEARCH'),
    });
    setFieldType(type);
  };

  const closeDropdown = () => {
    setPlacesList([]);
    if (fieldType == STRING.LABEL.SOURCE) {
      setSource({name: ''});
    } else {
      setDestination({name: ''});
    }
  };

  return (
    <View style={{marginBottom: 20}}>
      <View style={styles.routesFieldsView}>
        {SrcDest.map((field, index) => {
          return (
            <TextField
              onPress={() => pressed(field.name)}
              name={field.name}
              label={field.name}
              placeholder={field.placeholder}
              fieldType={field.type}
              length={field.length}
              required={field.required}
              disabled={
                index == 1 && (source?.name == '' || source?.name == null)
              }
              value={getValue(index)}
              setChild={(val, i) => setValue(val, i, index, field.name)}
              style={styles.searchPanelField}
              containerStyle={styles.textContainerStyle}
              inputContainerStyle={styles.inputContainerStyle}
            />
          );
        })}
        <View style={styles.pannelIcons}>
          <MaterialIcons
            style={styles.routesSwapIcon}
            name="swap-vert-circle"
            color={isValid ? COLOR.black : COLOR.grey}
            size={DIMENSIONS.iconLarge}
            onPress={isValid ? swap : null}
          />
          <Ionicons
            style={styles.routesRefreshIcon}
            name="refresh-circle"
            color={source?.name ? COLOR.black : COLOR.grey}
            size={DIMENSIONS.iconLarge}
            onPress={source?.name ? refresh : null}
          />
        </View>
      </View>

      <View style={{minHeight: 20}}>
        {!isValid && <GlobalText text={errorText} style={styles.errorText} />}
      </View>
      <TextButton
        title={t('BUTTON.SEARCH')}
        buttonView={styles.searchButtonStyle}
        titleStyle={styles.buttonTitleStyle}
        raised={false}
        onPress={gotoRoutes}
      />
      <View
        style={{
          position: 'relative',
          marginTop: -50,
          marginBottom: 50,
        }}>
        {placesList[0] && (
          <SearchDropdown
            placesList={placesList}
            goToNext={goToNext}
            setPlace={setPlace}
            closeDropdown={() => closeDropdown()}
          />
        )}
      </View>
    </View>
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
    setLoader: data => {
      dispatch(setLoader(data));
    },
    setSource: data => {
      dispatch(setSource(data));
    },
    setDestination: data => {
      dispatch(setDestination(data));
    },
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(RoutesSearchPanel);
