import React, {useEffect, useMemo, useRef, useState} from 'react';
import {KeyboardAvoidingView, View} from 'react-native';
import {SrcDest} from '../../Services/Constants/FIELDS';
import TextButton from '../Customs/Buttons/TextButton';
import TextField from '../Customs/TextField';
import styles from './Styles';
import {connect} from 'react-redux';
import {comnPost, getFromStorage} from '../../Services/Api/CommonServices';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import COLOR from '../../Services/Constants/COLORS';
import DIMENSIONS from '../../Services/Constants/DIMENSIONS';
import {navigateTo} from '../../Services/CommonMethods';
import {
  setDestination as setDestinationAction,
  setLoader,
  setSource as setSourceAction,
} from '../../Reducers/CommonActions';
import GlobalText from '../Customs/Text';
import SearchDropdown from './SearchDropdown';
import {useTranslation} from 'react-i18next';
import STRING from '../../Services/Constants/STRINGS';
import Popup from './Popup';
import NetInfo from '@react-native-community/netinfo';

const SearchPanel = ({navigation, from, onSwap, ...props}) => {
  const {t} = useTranslation();

  const [placesList, setPlacesList] = useState([]);
  const [nextPage, setNextPage] = useState(1);
  const [searchValue, setSearchValue] = useState('');
  const [fieldType, setFieldType] = useState('');
  const [source, setSource] = useState({});
  const [destination, setDestination] = useState({});
  const [isAlert, setIsAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const searchDebounceRef = useRef(null);
  const panelWrapStyle = {marginVertical: 20, zIndex: 50};
  const dropdownWrapStyle = {
    position: 'absolute',
    width: DIMENSIONS.bannerWidth,
    top: 160,
  };

  useEffect(() => {
    setSource(props.source || {});
    setDestination(props.destination || {});
  }, [props.source, props.destination]);

  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, []);

  const setValue = (v, i, index, type) => {
    switch (index) {
      case 0:
        setSource(v);
        break;
      case 1:
        setDestination(v);
        break;
    }
    queueSearchPlace(v);
    setFieldType(type);
  };

  const getValue = i => {
    switch (i) {
      case 0:
        return source?.name;
      case 1:
        return destination?.name;
    }
  };

  const isValid = useMemo(
    () => Boolean(source?.name && destination?.name),
    [source?.name, destination?.name],
  );

  const gotoRoutes = async () => {
    const mode = JSON.parse(await getFromStorage(t('STORAGE.MODE')));
    // Check the internet connectivity state
    const state = await NetInfo.fetch();
    const isConnected = state.isConnected;

    // Combined condition for all three cases
    if (
      (isConnected && !mode) || // Case 1: Internet is available but mode is offline
      (!isConnected && !mode) || // Case 2: Internet is not available and mode is offline
      (!isConnected && mode) // Case 3: Internet is not available but mode is online
    ) {
      // The user should be alerted based on their mode and connectivity status
      setIsAlert(true);
      setAlertMessage(
        !isConnected && !mode
          ? t('ALERT.NETWORK') // Alert: Network is available but mode is offline
          : !isConnected && mode
            ? t('ALERT.NO_INTERNET_AVAILABLE_MODE_ONLINE') // Alert: Mode is offline, you need to set it to online
            : isConnected && !mode
              ? t('ALERT.INTERNET_AVAILABLE_MODE_OFFLINE') // Alert: No internet available but mode is online
              : '', // Default case (optional), if none of the conditions match
      );

      return;
    }
    // setSource("")
    // setDestination("")
    if (isValid) {
      navigateTo(navigation, t('SCREEN.ALL_ROUTES_SEARCH'), {
        source,
        destination,
      });
    } else {
      setIsAlert(true);
      setAlertMessage(t('ALERT.SOURCE_DESTINATION_REQUIRED'));
      return;
    }
    setSource({});
    setDestination({});
  };

  const swap = () => {
    let a = source;
    let b = destination;
    setSource(b);
    setDestination(a);
    props.setSource(b);
    props.setDestination(a);
  };

  const refresh = () => {
    setSource('');
    setDestination('');
    props.setSource('');
    props.setDestination('');
    // onSwap(a, b);
  };

  const queueSearchPlace = v => {
    setSearchValue(v);
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    if (!v || !v.trim()) {
      setPlacesList([]);
      return;
    }
    searchDebounceRef.current = setTimeout(() => {
      searchPlace(v);
    }, 300);
  };

  const searchPlace = v => {
    let data = {
      search: v,
      apitype: 'dropdown',
      type: 'bus',
    };
    comnPost('v2/sites', data)
      .then(res => {
        if (res.data.success) {
          props.setLoader(false);
          setPlacesList(res.data.data.data);
        } else {
          props.setLoader(false);
        }
      })
      .catch(() => {
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
          setPlacesList(prevList => [...prevList, ...res.data.data.data]);
          setNextPage(nextUrl[nextUrl.length - 1]);
          props.setLoader(false);
        } else {
          props.setLoader(false);
        }
      })
      .catch(() => {
        props.setLoader(false);
      });
  };

  const setPlace = place => {
    if (fieldType === STRING.LABEL.SOURCE) {
      setSource(place);
    } else {
      setDestination(place);
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
      from: t('SCREEN.HOME'),
    });
    setFieldType(type);
  };

  const closeDropdown = () => {
    setPlacesList([]);
    if (fieldType === STRING.LABEL.SOURCE) {
      setSource({name: ''});
    } else {
      setDestination({name: ''});
    }
  };

  const closePopup = () => {
    setIsAlert(false);
  };

  return (
    <KeyboardAvoidingView
      enabled
      behavior="position"
      style={panelWrapStyle}>
      <View style={styles.fieldsView}>
        <GlobalText text={t('UNCOVER')} style={styles.instructionText} />
        {SrcDest.map((field, index) => {
          return (
            <TextField
              key={field?.name || index} // <-- this fixes the warning
              onPress={() => pressed(field.name)}
              name={field.name}
              label={field.name}
              placeholder={field.placeholder}
              fieldType={field.type}
              length={field.length}
              required={field.required}
              disabled={index === 1 && !source?.name}
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
            style={styles.swapIcon}
            name="swap-vert-circle"
            color={isValid ? COLOR.black : COLOR.grey}
            size={DIMENSIONS.iconL}
            onPress={isValid ? swap : null}
          />
          <Ionicons
            style={styles.refreshIcon}
            name="refresh-circle"
            color={source?.name ? COLOR.black : COLOR.grey}
            size={DIMENSIONS.iconL}
            onPress={source?.name ? refresh : null}
          />
        </View>
      </View>

      <Popup message={alertMessage} onPress={closePopup} visible={isAlert} />

      <TextButton
        title={t('BUTTON.SEARCH')}
        buttonView={styles.searchButtonStyle}
        titleStyle={styles.buttonTitleStyle}
        raised={false}
        onPress={gotoRoutes}
      />
      <View style={dropdownWrapStyle}>
        {placesList[0] && (
          <SearchDropdown
            placesList={placesList}
            goToNext={goToNext}
            setPlace={setPlace}
            closeDropdown={() => closeDropdown()}
            height={330}
          />
        )}
      </View>
    </KeyboardAvoidingView>
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
      dispatch(setSourceAction(data));
    },
    setDestination: data => {
      dispatch(setDestinationAction(data));
    },
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(SearchPanel);
