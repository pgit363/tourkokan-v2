import React from 'react';
import {View} from 'react-native';
import Spinner from 'react-native-loading-spinner-overlay';
import styles from './Styles';
import {connect} from 'react-redux';

const Loader = props => {
  return (
    <View style={styles.container}>
      <Spinner
        visible={props.isLoading}
        textContent={props.text}
        textStyle={styles.spinnerTextStyle}
      />
    </View>
  );
};

const mapStateToProps = state => {
  return {
    isLoading: state.commonState.isLoading,
  };
};

export default connect(mapStateToProps)(Loader);
