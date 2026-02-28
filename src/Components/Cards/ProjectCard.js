import React from 'react';
import {ImageBackground, View} from 'react-native';
import styles from './Styles';
import GlobalText from '../Customs/Text';
import {FTP_PATH} from '@env';

const projectTextWrapperStyle = {flex: 1, justifyContent: 'center', paddingLeft: 5};

const ProjectCard = ({project}) => {
  return (
    <View style={styles.projectCard}>
      <View>
        <View style={styles.overlay} />
        <ImageBackground
          source={{uri: FTP_PATH + project.logo}}
          style={styles.projectImage}
          imageStyle={styles.projectImageStyle}
          resizeMode="cover"
        />
      </View>
      <View style={projectTextWrapperStyle}>
        <GlobalText text={project.domain_name} />
      </View>
    </View>
  );
};

export default ProjectCard;
