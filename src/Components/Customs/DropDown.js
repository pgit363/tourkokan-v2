import React, {useState} from 'react';
import styles from './Styles';
import {Dropdown} from 'react-native-element-dropdown';

const DropDown = ({...props}) => {
  const [errorText, setErrorText] = useState('');
  const [value, setValue] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [isFocus, setIsFocus] = useState(false);

  const handleChange = event => {
    let txtVal = event;
    if (txtVal !== '') {
      setValue(txtVal);
      setIsValid(false);
      props.setChild(txtVal, true, props.parentDetails);
    } else {
      setErrorText(props.helperMsg);
      setValue(txtVal);
      setIsValid(true);
      props.setChild(txtVal, false, props.parentDetails);
    }
  };

  return (
    <Dropdown
      style={[styles.dropdown, isFocus && {borderColor: 'blue'}, props.style]}
      placeholderStyle={styles.placeholderStyle}
      selectedTextStyle={props.selectedTextStyle}
      inputSearchStyle={styles.inputSearchStyle}
      iconStyle={styles.iconStyle}
      itemTextStyle={styles.itemTextStyle}
      data={props.List}
      search={false}
      maxHeight={300}
      labelField="name"
      valueField="name"
      placeholder={props.label}
      searchPlaceholder="Search..."
      value={props.value === '' && isValid ? value : props.value}
      onFocus={() => setIsFocus(true)}
      onBlur={() => setIsFocus(false)}
      onChange={handleChange}
      dropdownTextStyle={styles.text}
      // renderLeftIcon={() => ()}
    />
  );
};

export default DropDown;
