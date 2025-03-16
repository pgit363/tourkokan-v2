import React, {useState, useEffect} from 'react';
import {View, ScrollView, ImageBackground} from 'react-native';
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
  navigateTo,
} from '../Services/CommonMethods';
import Path from '../Services/Api/BaseUrl';
import styles from './Styles';
import ProjectCard from '../Components/Cards/ProjectCard';
import GlobalText from '../Components/Customs/Text';
import {useTranslation} from 'react-i18next';
import {FTP_PATH} from '@env';

const CategoryProjects = ({navigation, route, ...props}) => {
  const {t} = useTranslation();

  const [projects, setProjects] = useState([]); // State to store Projects
  const [error, setError] = useState(null); // State to store error message

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
      .catch(error => {
        props.setLoader(false);
        setError(error.message); // Update error state with error message
      });
  };

  // Function to handle SmallCard click
  const handleSmallCardClick = id => {
    navigateTo(navigation, t('SCREEN.PROJECT_DETAILS'), {id});
  };

  return (
    <ScrollView>
      <View style={{flex: 1, alignItems: 'center'}}>
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
              style={{marginTop: 50}}
            />
          </View>
        )}
      </View>
    </ScrollView>
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

export default connect(mapStateToProps, mapDispatchToProps)(CategoryProjects);
