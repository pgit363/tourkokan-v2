import React, {useState} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';

import DrawerNavigator from './DrawerNavigator';

import AllRoutesSearch from '../Screens/ListPages/AllRoutesSearch';
import PasswordLogin from '../Screens/AuthScreens/PasswordLogin';
import Email from '../Screens/AuthScreens/Email';
import LangSelection from '../Screens/AuthScreens/LangSelection';
import ContactUs from '../Screens/ContactUs';
import SignIn from '../Screens/AuthScreens/SignIn';
import SignUp from '../Screens/AuthScreens/SignUp';
import SearchList from '../Screens/ListPages/SearchList';
import RoutesList from '../Screens/ListPages/RoutesList';
import BusTimings from '../Screens/BusTimings';
import CategoryProjects from '../Screens/CategoryProjects';
import CityDetails from '../Screens/DetailPages/CityDetails';
import CityList from '../Screens/ListPages/CityList';
import Explore from '../Screens/ListPages/Explore';
import Categories from '../Screens/ListPages/Categories';
import ExploreGrid from '../Screens/ListPages/ExploreGrid';
import ProjectList from '../Screens/ListPages/ProjectList';
import QueriesList from '../Screens/ListPages/QueriesList';
import CityPlaceSearch from '../Screens/ListPages/CityPlaceSearch';
import StopList from '../Screens/ListPages/StopList';
import EmailSignIn from '../Screens/AuthScreens/EmailSignIn';
import AuthScreen from '../Screens/AuthScreens/AuthScreen';
import VerifyOTP from '../Screens/AuthScreens/VerifyOTP';
import PlaceDetails from '../Screens/DetailPages/PlaceDetails';
import ProjectDetails from '../Screens/DetailPages/ProjectDetails';
import StopDetails from '../Screens/DetailPages/StopDetails';
import SearchPlace from '../Screens/SearchPlace';
import MapScreen from '../Screens/MapScreen';
import ProfileView from '../Screens/ProfileView';
import Profile from '../Screens/Profile';

const Stack = createNativeStackNavigator();

const linking = {
  prefixes: ['myapp://'],
  config: {
    screens: {
      Home: 'home',
      Details: 'details',
    },
  },
};

const StackNavigator = () => {
  const {t} = useTranslation();
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator
        screenOptions={{
          cardStyle: {backgroundColor: '#fff'},
          keyboardHandlingEnabled: true,
        }}>
        {isLoggedIn ? (
          // Screens for logged in users
          <Stack.Group
            screenOptions={{
              headerShown: false,
              cardStyle: {backgroundColor: '#fff'},
            }}>
            {/* <Stack.Screen
              name={t('SCREEN.LANG_SELECTION')}
              component={LangSelection}
              options={{headerShown: false}}
            /> */}
            <Stack.Screen name={t('SCREEN.EMAIL')} component={Email} />
            <Stack.Screen
              name={t('SCREEN.MAIN')}
              component={DrawerNavigator}
              options={{headerShown: false}}
            />
            {/* <Stack.Screen name="HomeScreen" component={HomeScreen} /> */}
          </Stack.Group>
        ) : (
          // Auth screens
          <Stack.Group
            screenOptions={{
              headerShown: false,
              cardStyle: {backgroundColor: '#fff'},
            }}>
            <Stack.Screen
              name={t('SCREEN.EMAIL_SIGN_IN')}
              component={EmailSignIn}
            />
          </Stack.Group>
        )}
        {/* Common modal screens */}
        <Stack.Group
          screenOptions={{
            headerShown: false,
            presentation: 'modal',
            cardStyle: {backgroundColor: '#fff'},
          }}>
          {/* <Stack.Screen
            name={t('SCREEN.LANG_SELECTION')}
            component={LangSelection}
            options={{headerShown: false}}
          /> */}
          <Stack.Screen
            name={t('SCREEN.HOME')}
            component={DrawerNavigator}
            options={{headerShown: false}}
          />
          <Stack.Screen name={t('SCREEN.SEARCH_LIST')} component={SearchList} />
          <Stack.Screen
            name={t('SCREEN.ALL_ROUTES_SEARCH')}
            component={AllRoutesSearch}
          />
          <Stack.Screen name={t('SCREEN.ROUTES_LIST')} component={RoutesList} />
          <Stack.Screen name={t('SCREEN.BUS_TIMINGS')} component={BusTimings} />
          {/* <Stack.Screen
            name={t('SCREEN.LANG_SELECTION')}
            component={LangSelection}
          /> */}
          <Stack.Screen name={t('SCREEN.AUTH_SCREEN')} component={AuthScreen} />
          <Stack.Screen name={t('SCREEN.LOGIN')} component={SignIn} />
          <Stack.Screen
            name={t('SCREEN.EMAIL_SIGN_IN')}
            component={EmailSignIn}
          />
          {/* <Stack.Screen name={t('SCREEN.EMAIL')} component={Email} /> */}
          <Stack.Screen
            name={t('SCREEN.PASSWORD_LOGIN')}
            component={PasswordLogin}
          />
          <Stack.Screen name={t('SCREEN.VERIFY_OTP')} component={VerifyOTP} />
          <Stack.Screen name={t('SCREEN.SIGN_UP')} component={SignUp} />
          <Stack.Screen
            name={t('SCREEN.CATEGORY_PROJECTS')}
            component={CategoryProjects}
          />
          <Stack.Screen name={t('SCREEN.CITY_LIST')} component={CityList} />
          <Stack.Screen name={t('SCREEN.EXPLORE')} component={Explore} />
          <Stack.Screen name={t('SCREEN.CATEGORIES')} component={Categories} />
          <Stack.Screen
            name={t('SCREEN.PROJECT_LIST')}
            component={ProjectList}
          />
          <Stack.Screen
            name={t('SCREEN.QUERIES_LIST')}
            component={QueriesList}
          />
          <Stack.Screen name={t('SCREEN.CONTACT_US')} component={ContactUs} />

          <Stack.Screen name={t('SCREEN.STOP_LIST')} component={StopList} />
          <Stack.Screen
            name={t('SCREEN.CITY_DETAILS')}
            component={CityDetails}
          />
          <Stack.Screen
            name={t('SCREEN.PLACE_DETAILS')}
            component={PlaceDetails}
          />
          <Stack.Screen
            name={t('SCREEN.PROJECT_DETAILS')}
            component={ProjectDetails}
          />
          <Stack.Screen
            name={t('SCREEN.STOP_DETAILS')}
            component={StopDetails}
          />
          <Stack.Screen
            name={t('SCREEN.SEARCH_PLACE')}
            component={SearchPlace}
          />
          <Stack.Screen name={t('SCREEN.MAP_SCREEN')} component={MapScreen} />
          <Stack.Screen
            name={t('SCREEN.CITY_PLACE_SEARCH')}
            component={CityPlaceSearch}
          />
          <Stack.Screen
            name={t('SCREEN.PROFILE_VIEW')}
            component={ProfileView}
          />
          <Stack.Screen name={t('SCREEN.PROFILE')} component={Profile} />
          <Stack.Screen
            name={t('SCREEN.EXPLOREGRID')}
            component={ExploreGrid}
          />
        </Stack.Group>
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default StackNavigator;
