import React, {useState, useEffect} from 'react';
import {View, SafeAreaView, StyleSheet} from 'react-native';
import {comnPost} from '../../Services/Api/CommonServices';
import {connect} from 'react-redux';
import {setLoader} from '../../Reducers/CommonActions';
import {
  checkLogin,
  goBackHandler,
  navigateTo,
} from '../../Services/CommonMethods';
import MapView, {Marker} from 'react-native-maps';
import {useTranslation} from 'react-i18next';

const ProjectList = ({navigation, ...props}) => {
  const {t} = useTranslation();

  const [projects, setProjects] = useState([]); // State to store projects
  const [error, setError] = useState(null); // State to store error message

  useEffect(() => {
    const backHandler = goBackHandler(navigation);
    checkLogin(navigation);
    props.setLoader(true);
    getProjects();
    return () => {
      backHandler.remove();
    };
  }, []);

  const getProjects = () => {
    const data = {};
    comnPost('v2/projects', data)
      .then(res => {
        setProjects(res.data.data.data); // Update projects state with response data
        props.setLoader(false);
      })
      .catch(error => {
        props.setLoader(false);
        setError(error.message); // Update error state with error message
      });
  };

  const handleSmallCardClick = id => {
    navigateTo(navigation, t('SCREEN.PROJECT_DETAILS'), {id});
  };

  return (
    // <ScrollView>
    //   <View style={{ flex: 1, alignItems: "center" }}>
    //     <Loader />
    //      <Header name={t("HEADER.PROJECTS")}
    //       startIcon={
    //         <Ionicons
    //           name="chevron-back-outline"
    //           color={COLOR.black}
    //           size={DIMENSIONS.userIconSize}
    //           onPress={() => backPage(navigation)}
    //         />
    //       }
    //     />
    //     <View style={styles.cardsWrap}>
    //       {projects.map((project) => (
    //         <SmallCard
    //           Icon={
    //             <Ionicons
    //               name="bus"
    //               color={COLOR.yellow}
    //               size={DIMENSIONS.iconSize}
    //             />
    //           }
    //           title={project.name}
    //           onPress={() => handleSmallCardClick(project.id)}
    //         />
    //       ))}
    //     </View>
    //   </View>
    // </ScrollView>
    <SafeAreaView style={{flex: 1}}>
      <View style={stylesMap.containerMap}>
        <MapView
          style={stylesMap.mapStyle}
          initialRegion={{
            latitude: 19.2309972,
            longitude: 73.0838757,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
          customMapStyle={mapStyle}>
          <Marker
            draggable
            coordinate={{
              latitude: 19.2309972,
              longitude: 73.0838757,
            }}
            onDragEnd={e => alert(JSON.stringify(e.nativeEvent.coordinate))}
            title={t('TEST_MARKER')}
            description={t('MARKER_DESCRIPTION')}
          />
        </MapView>
      </View>
    </SafeAreaView>
  );
};

const mapStateToProps = state => {
  return {
    access_token: state.commonState.access_token,
  };
};

const mapDispatchToProps = dispatch => {
  return {
    setLoader: data => {
      dispatch(setLoader(data));
    },
  };
};

const mapStyle = [
  {elementType: 'geometry', stylers: [{color: '#242f3e'}]},
  {elementType: 'labels.text.fill', stylers: [{color: '#746855'}]},
  {elementType: 'labels.text.stroke', stylers: [{color: '#242f3e'}]},
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{color: '#d59563'}],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{color: '#d59563'}],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{color: '#263c3f'}],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{color: '#6b9a76'}],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{color: '#38414e'}],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{color: '#212a37'}],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{color: '#9ca5b3'}],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{color: '#746855'}],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{color: '#1f2835'}],
  },
  {
    featureType: 'road.highway',
    elementType: 'labels.text.fill',
    stylers: [{color: '#f3d19c'}],
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{color: '#2f3948'}],
  },
  {
    featureType: 'transit.station',
    elementType: 'labels.text.fill',
    stylers: [{color: '#d59563'}],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{color: '#17263c'}],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{color: '#515c6d'}],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.stroke',
    stylers: [{color: '#17263c'}],
  },
];

const stylesMap = StyleSheet.create({
  containerMap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  mapStyle: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
export default connect(mapStateToProps, mapDispatchToProps)(ProjectList);
