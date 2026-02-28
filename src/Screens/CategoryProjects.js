/* eslint-disable react-hooks/exhaustive-deps */
import React, {useState, useEffect} from 'react';
import {View, ScrollView, ImageBackground, StyleSheet} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import COLOR from '../Services/Constants/COLORS';
import DIMENSIONS from '../Services/Constants/DIMENSIONS';
import {connect} from 'react-redux';
import Loader from '../Components/Customs/Loader';
import Header from '../Components/Common/Header';
import {setLoader} from '../Reducers/CommonActions';
import {
  backPage,
  checkLogin,
  goBackHandler,
} from '../Services/CommonMethods';
import styles from './Styles';
import ProjectCard from '../Components/Cards/ProjectCard';
import GlobalText from '../Components/Customs/Text';
import {FTP_PATH} from '@env';
import {SafeAreaView} from 'react-native-safe-area-context';
import {comnPost} from '../Services/Api/CommonServices';

const CategoryProjects = ({navigation, route, ...props}) => {
  const [projects, setProjects] = useState([]); // State to store Projects

  useEffect(() => {
    const backHandler = goBackHandler(navigation);
    checkLogin(navigation);
    props.setLoader(true);
    getAllProjects();
    return () => {
      backHandler.remove();
    };
  }, []);

  const getAllProjects = () => {
    comnPost(`v2/category/${route.params.id}/projects`, props.access_token)
      .then(res => {
        setProjects(res.data.data[0]); // Update Projects state with response data
        props.setLoader(false);
      })
      .catch(fetchError => {
        console.error('Error fetching category projects:', fetchError);
        props.setLoader(false);
      });
  };

  return (
    <SafeAreaView edges={['top']} style={localStyles.safeArea}>
    <ScrollView>
      <View style={localStyles.container}>
        <Loader />
        <Header
          name={route.params.name}
          startIcon={
            <Ionicons
              name="chevron-back-outline"
              color={COLOR.black}
              size={DIMENSIONS.userIconSize}
              onPress={() => backPage(navigation)}
            />
          }
        />
        {projects && (
          <View>
            <View style={styles.prjImgContainer}>
              <View style={styles.overlay} />
              <ImageBackground
                source={{
                  uri: FTP_PATH + projects.image_url,
                }}
                style={styles.categoryBack}
                imageStyle={styles.categoryBackImageStyle}
                resizeMode="cover"
              />
              <View style={styles.categoryImageDetails}>
                <GlobalText text={projects.name} style={styles.catTitle} />
                <GlobalText
                  text={projects.description}
                  style={styles.catSubTitle}
                />
              </View>
            </View>

            {projects.projects &&
              projects.projects.map(project => (
                <ProjectCard project={project} />
              ))}

            <GlobalText
              text={JSON.stringify(projects.projects)}
              style={localStyles.debugText}
            />
          </View>
        )}
      </View>
    </ScrollView>
    </SafeAreaView>
  );
};

const localStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLOR.white,
  },
  container: {
    flex: 1,
    alignItems: 'center',
  },
  debugText: {
    marginTop: 50,
  },
});

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

export default connect(mapStateToProps, mapDispatchToProps)(CategoryProjects);
