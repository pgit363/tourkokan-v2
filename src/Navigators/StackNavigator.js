import React, {useState, useRef, useEffect} from 'react';
import {BackHandler, Platform} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createNavigationLogger} from '../Services/Logger';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import {exitApp} from '../Services/CommonMethods';

import DrawerNavigator from './DrawerNavigator';

import AllRoutesSearch from '../Screens/ListPages/AllRoutesSearch';
import BusRouteList from '../Screens/ListPages/BusRouteList';
import MSRTCSearch from '../Screens/ListPages/MSRTCSearch';
import PasswordLogin from '../Screens/AuthScreens/PasswordLogin';
import Email from '../Screens/AuthScreens/Email';
// import LangSelection from '../Screens/AuthScreens/LangSelection'; // unused — file renamed to -unused
import ContactUs from '../Screens/ContactUs';
// import SignIn from '../Screens/AuthScreens/SignIn-unused'; // unused
import SignUp from '../Screens/AuthScreens/SignUp';
// import SearchList from '../Screens/ListPages/SearchList-unused'; // unused
import RoutesList from '../Screens/ListPages/RoutesList';
// import BusTimings from '../Screens/BusTimings-unused'; // unused
// import CategoryProjects from '../Screens/CategoryProjects-unused'; // unused
import CityDetails from '../Screens/DetailPages/CityDetails';
import SiteDetailPage from '../Screens/DetailPages/SiteDetailPage';
import CityList from '../Screens/ListPages/CityList';
// import Explore from '../Screens/ListPages/Explore-unused'; // unused
import Categories from '../Screens/ListPages/Categories';
import ExploreGrid from '../Screens/ListPages/ExploreGrid';
// import ProjectList from '../Screens/ListPages/ProjectList-unused'; // unused
import QueriesList from '../Screens/ListPages/QueriesList';
import CityPlaceSearch from '../Screens/ListPages/CityPlaceSearch';
// import StopList from '../Screens/ListPages/StopList-unused'; // unused
import EmailSignIn from '../Screens/AuthScreens/EmailSignIn';
// import AuthScreen from '../Screens/AuthScreens/AuthScreen-unused'; // unused
import VerifyOTP from '../Screens/AuthScreens/VerifyOTP';
import PlaceDetails from '../Screens/DetailPages/PlaceDetails';
// import ProjectDetails from '../Screens/DetailPages/ProjectDetails-unused'; // unused
import StopDetails from '../Screens/DetailPages/StopDetails';
import SearchPlace from '../Screens/SearchPlace';
import MapScreen from '../Screens/MapScreen';
import ProfileView from '../Screens/ProfileView';
import Profile from '../Screens/Profile';
import InboxScreen from '../Screens/InboxScreen';
import SubmitPlaceScreen from '../Screens/SubmitPlaceScreen';
import MySubmissionsScreen from '../Screens/MySubmissionsScreen';
import EventsList from '../Screens/ListPages/EventsList';
import EventDetail from '../Screens/DetailPages/EventDetail';
import CreateEvent from '../Screens/CreateEvent';
import UpdateEvent from '../Screens/UpdateEvent';
import MyEvents from '../Screens/MyEvents';
import HelpCenterScreen from '../Screens/HelpCenterScreen';
import BrowseScreen from '../Screens/Marketplace/BrowseScreen';
import ProductDetailScreen from '../Screens/Marketplace/ProductDetailScreen';
import VendorListScreen from '../Screens/Marketplace/VendorListScreen';
import VendorProfileScreen from '../Screens/Marketplace/VendorProfileScreen';
import VendorDashboardScreen from '../Screens/Marketplace/VendorDashboardScreen';
import MyProductsScreen from '../Screens/Marketplace/MyProductsScreen';
import AddProductScreen from '../Screens/Marketplace/AddProductScreen';
import ManageProductScreen from '../Screens/Marketplace/ManageProductScreen';
import MyLeadsScreen from '../Screens/Marketplace/MyLeadsScreen';
import ProductAnalyticsScreen from '../Screens/Marketplace/ProductAnalyticsScreen';
import SubscriptionScreen from '../Screens/Marketplace/SubscriptionScreen';
import FavouritesScreen from '../Screens/Marketplace/FavouritesScreen';
import MyEnquiriesScreen from '../Screens/Marketplace/MyEnquiriesScreen';

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

const StackNavigator = ({initialRoute}) => {
  const {t} = useTranslation();
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  // Event-based screen logging: every screen visit is logged from this one
  // chokepoint — no per-screen log calls needed.
  const navigationRef = useRef(null);
  const navLogger = useRef(null);
  if (!navLogger.current) {
    navLogger.current = createNavigationLogger(navigationRef);
  }

  // Global hardware-back safety net. Native-stack does NOT auto-pop here, so a
  // screen whose own BackHandler is missing/throwing would let the press fall
  // through to the OS and close the app. Registered once at the container: it
  // sits at the BOTTOM of the LIFO handler chain, so any screen's own handler
  // still runs first — this only fires when nothing else consumed the press.
  useEffect(() => {
    const onBack = () => {
      const nav = navigationRef.current;
      if (nav?.canGoBack?.()) {
        nav.goBack();
        return true;
      }
      // At the navigator root → double-tap-to-exit (never a silent close).
      return exitApp();
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
    return () => sub.remove();
  }, []);

  return (
    <NavigationContainer
      ref={navigationRef}
      linking={linking}
      onReady={navLogger.current.onReady}
      onStateChange={navLogger.current.onStateChange}>
      <Stack.Navigator
        initialRouteName={initialRoute}
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
            // presentation: 'modal' is a NORMAL PUSH on Android, but on iOS
            // native-stack renders a real sheet: inset from the top, rounded
            // corners, and swipe-down-to-dismiss. This group holds ~57 screens
            // INCLUDING Home, so on iOS the whole app rendered as stacked
            // sheets and Home slid up as a card over the login screen after
            // sign-in — which read as "login didn't redirect properly".
            // Android keeps 'modal' so its behaviour is byte-identical.
            presentation: Platform.OS === 'ios' ? 'card' : 'modal',
            // native-stack uses contentStyle; cardStyle is a JS-stack option and
            // is silently ignored here (kept so Android is untouched).
            cardStyle: {backgroundColor: '#fff'},
            contentStyle: {backgroundColor: '#fff'},
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
          {/* <Stack.Screen name={t('SCREEN.SEARCH_LIST')} component={SearchList} /> unused */}
          <Stack.Screen
            name={t('SCREEN.ALL_ROUTES_SEARCH')}
            component={AllRoutesSearch}
          />
          <Stack.Screen
            name={t('SCREEN.BUS_ROUTE_LIST')}
            component={BusRouteList}
          />
          <Stack.Screen
            name={t('SCREEN.ROUTES')}
            component={MSRTCSearch}
          />
          <Stack.Screen name={t('SCREEN.ROUTES_LIST')} component={RoutesList} />
          {/* <Stack.Screen name={t('SCREEN.BUS_TIMINGS')} component={BusTimings} /> unused */}
          {/* <Stack.Screen
            name={t('SCREEN.LANG_SELECTION')}
            component={LangSelection}
          /> */}
          {/* <Stack.Screen name={t('SCREEN.AUTH_SCREEN')} component={AuthScreen} /> unused */}
          {/* <Stack.Screen name={t('SCREEN.LOGIN')} component={SignIn} /> unused */}
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
          {/* <Stack.Screen
            name={t('SCREEN.CATEGORY_PROJECTS')}
            component={CategoryProjects}
          /> unused */}
          <Stack.Screen name={t('SCREEN.CITY_LIST')} component={CityList} />
          {/* <Stack.Screen name={t('SCREEN.EXPLORE')} component={Explore} /> unused */}
          <Stack.Screen name={t('SCREEN.CATEGORIES')} component={Categories} />
          {/* <Stack.Screen
            name={t('SCREEN.PROJECT_LIST')}
            component={ProjectList}
          /> unused */}
          <Stack.Screen
            name={t('SCREEN.QUERIES_LIST')}
            component={QueriesList}
          />
          <Stack.Screen name={t('SCREEN.CONTACT_US')} component={ContactUs} />

          {/* <Stack.Screen name={t('SCREEN.STOP_LIST')} component={StopList} /> unused */}
          <Stack.Screen
            name={t('SCREEN.CITY_DETAILS')}
            component={CityDetails}
          />
          <Stack.Screen
            name={t('SCREEN.SITE_DETAIL')}
            component={SiteDetailPage}
          />
          <Stack.Screen
            name={t('SCREEN.PLACE_DETAILS')}
            component={PlaceDetails}
          />
          {/* <Stack.Screen
            name={t('SCREEN.PROJECT_DETAILS')}
            component={ProjectDetails}
          /> unused */}
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
          <Stack.Screen name={t('SCREEN.INBOX')} component={InboxScreen} />
          <Stack.Screen name={t('SCREEN.SUBMIT_PLACE')} component={SubmitPlaceScreen} />
          <Stack.Screen name={t('SCREEN.MY_SUBMISSIONS')} component={MySubmissionsScreen} />
          <Stack.Screen name={t('SCREEN.EVENTS_LIST')} component={EventsList} />
          <Stack.Screen name={t('SCREEN.EVENT_DETAIL')} component={EventDetail} />
          <Stack.Screen name={t('SCREEN.CREATE_EVENT')} component={CreateEvent} />
          <Stack.Screen name={t('SCREEN.UPDATE_EVENT')} component={UpdateEvent} />
          <Stack.Screen name={t('SCREEN.MY_EVENTS')} component={MyEvents} />
          <Stack.Screen name={t('SCREEN.HELP_CENTER')} component={HelpCenterScreen} />

          {/* ── Marketplace ── */}
          <Stack.Screen name={t('SCREEN.MARKETPLACE')} component={BrowseScreen} />
          <Stack.Screen name={t('SCREEN.PRODUCT_DETAIL')} component={ProductDetailScreen} />
          <Stack.Screen name={t('SCREEN.VENDORS')} component={VendorListScreen} />
          <Stack.Screen name={t('SCREEN.VENDOR_PROFILE')} component={VendorProfileScreen} />
          <Stack.Screen name={t('SCREEN.VENDOR_DASHBOARD')} component={VendorDashboardScreen} />
          <Stack.Screen name={t('SCREEN.MY_PRODUCTS')} component={MyProductsScreen} />
          <Stack.Screen name={t('SCREEN.ADD_PRODUCT')} component={AddProductScreen} />
          <Stack.Screen name={t('SCREEN.MANAGE_PRODUCT')} component={ManageProductScreen} />
          <Stack.Screen name={t('SCREEN.MY_LEADS')} component={MyLeadsScreen} />
          <Stack.Screen name={t('SCREEN.PRODUCT_ANALYTICS')} component={ProductAnalyticsScreen} />
          <Stack.Screen name={t('SCREEN.SUBSCRIPTION')} component={SubscriptionScreen} />
          <Stack.Screen name={t('SCREEN.MARKET_FAVOURITES')} component={FavouritesScreen} />
          <Stack.Screen name={t('SCREEN.MY_ENQUIRIES')} component={MyEnquiriesScreen} />

        </Stack.Group>
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default StackNavigator;
