import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  Modal,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';
import Path from '../../Services/Api/BaseUrl';
import styles from './Styles';
import GlobalText from './Text';
import {FTP_PATH} from '@env';

const MasonryGrid = ({data, loadMore}) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [screenWidth, setScreenWidth] = useState(
    Dimensions.get('window').width,
  );

  useEffect(() => {
    const updateDimensions = () => {
      setScreenWidth(Dimensions.get('window').width);
    };

    Dimensions.addEventListener('change', updateDimensions);

    return () => {
      Dimensions.removeEventListener('change', updateDimensions);
    };
  }, []);

  const handleLongPress = image => {
    setSelectedImage(image);
  };

  const closeModal = () => {
    setSelectedImage(null);
  };

  const calculateImageDimensions = () => {
    const numColumns = 3; // Adjust the number of columns as needed
    const margin = 0; // Adjust the margin between images as needed
    const totalMargin = (numColumns - 1) * margin;
    const imageWidth = (screenWidth - totalMargin) / numColumns;
    const imageHeight = imageWidth * 1.5; // Adjust the aspect ratio as needed

    return {width: imageWidth, height: imageHeight};
  };

  const images = data.map((item, index) => {
    const {width, height} = calculateImageDimensions();
    return {
      uri: FTP_PATH + item.image,
      text: item.name,
      dimensions: {width, height},
      index,
    };
  });

  const renderItem = ({item}) => (
    <TouchableOpacity onLongPress={() => handleLongPress(item)}>
      <View
        style={[
          styles.masonryContainer,
          {
            width: item.dimensions.width,
            height: item.dimensions.height,
          },
        ]}>
        <Image source={{uri: item.uri}} style={styles.gridImage} />
        <Text style={styles.gridText}>{item.text}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View>
      <FlatList
        data={images}
        numColumns={3}
        keyExtractor={item => item.index.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.flatListContainer}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
      />

      <Modal
        visible={selectedImage !== null}
        transparent
        animationType="slide"
        onRequestClose={closeModal}>
        <TouchableWithoutFeedback onPress={closeModal}>
          <View style={styles.modalContainer}>
            <Image
              source={{uri: selectedImage?.uri}}
              style={styles.modalImage}
            />
            <View style={styles.masonryTextContainer}>
              <GlobalText text={selectedImage?.text} style={styles.modalText} />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

export default MasonryGrid;
