/**
 * ErrorBoundary
 *
 * App-wide safety net. Catches render/runtime errors in the React tree so a
 * single thrown error doesn't white-screen the whole app. Shows a friendly
 * fallback with a "Try again" button that re-mounts the subtree.
 */

import React from 'react';
import {View, Text, TouchableOpacity, Image, StyleSheet} from 'react-native';
import {createLogger} from '../../Services/Logger';

const log = createLogger('ErrorBoundary');

class ErrorBoundary extends React.Component {
  state = {hasError: false};

  static getDerivedStateFromError() {
    return {hasError: true};
  }

  componentDidCatch(error, info) {
    // Keep a log trail; hook a crash reporter (Crashlytics) here later.
    log.error(error, info?.componentStack);
  }

  handleReset = () => this.setState({hasError: false});

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <View style={s.wrap}>
        <Image
          source={require('../../Assets/Images/Logos/tourkokan-logo.png')}
          style={s.logo}
          resizeMode="contain"
        />
        <Text style={s.title}>Something went wrong</Text>
        <Text style={s.msg}>
          An unexpected error occurred. Please try again.
        </Text>
        <TouchableOpacity style={s.btn} onPress={this.handleReset} activeOpacity={0.85}>
          <Text style={s.btnText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const s = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  logo: {width: 120, height: 120, marginBottom: 16},
  title: {fontSize: 18, fontWeight: '700', color: '#0D3D4A', marginBottom: 8},
  msg: {
    fontSize: 14,
    color: '#78716C',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  btn: {
    backgroundColor: '#1B6B7B',
    borderRadius: 50,
    paddingVertical: 13,
    paddingHorizontal: 36,
  },
  btnText: {fontSize: 15, fontWeight: '700', color: '#FFFFFF'},
});

export default ErrorBoundary;
