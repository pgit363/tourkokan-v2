import React, {useState, useEffect, useRef, useCallback} from 'react';
import {useFocusEffect} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
  Image,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import NetInfo from '@react-native-community/netinfo';
import {connect} from 'react-redux';
import {useTranslation} from 'react-i18next';
import {
  comnPost,
  dataSync,
  getFromStorage,
  saveToStorage,
} from '../../Services/Api/CommonServices';
import {setLoader, setMode} from '../../Reducers/CommonActions';
import {
  backPage,
  checkLogin,
  goBackHandler,
  navigateTo,
} from '../../Services/CommonMethods';
import ModePopup from '../../Components/Common/ModePopup';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Design tokens
const C = {
  oceanDeep: '#0D3D4A',
  oceanMid: '#1B6B7B',
  oceanFoam: '#B8E4EA',
  forestDeep: '#1A3320',
  forestMid: '#2E5C3A',
  forestPale: '#D4EDD9',
  cream: '#F0EAD8',
  textDark: '#1C1917',
  textMid: '#44403C',
  textLight: '#78716C',
  white: '#FFFFFF',
};

// Contextual emoji fallback based on category name
const getCategoryEmoji = name => {
  const n = (name || '').toLowerCase();
  if (n.includes('beach') || n.includes('kokan') || n.includes('view') || n.includes('coastal')) return '🏝';
  if (n.includes('accommodat') || n.includes('hotel') || n.includes('resort') || n.includes('stay') || n.includes('lodge')) return '🏨';
  if (n.includes('food') || n.includes('dining') || n.includes('restaurant') || n.includes('eat') || n.includes('cafe')) return '🍽';
  if (n.includes('transport') || n.includes('bus') || n.includes('travel') || n.includes('road') || n.includes('vehicle')) return '🚌';
  if (n.includes('emergency') || n.includes('ambulance') || n.includes('fire') || n.includes('rescue')) return '🚨';
  if (n.includes('hospital') || n.includes('health') || n.includes('clinic') || n.includes('medical')) return '🏥';
  if (n.includes('government') || n.includes('office') || n.includes('admin') || n.includes('municipal')) return '🏛';
  if (n.includes('temple') || n.includes('religious') || n.includes('church') || n.includes('mosque') || n.includes('mandir')) return '🙏';
  if (n.includes('shop') || n.includes('market') || n.includes('store') || n.includes('mall') || n.includes('bazar')) return '🛍';
  if (n.includes('park') || n.includes('garden') || n.includes('forest') || n.includes('nature') || n.includes('wildlife')) return '🌳';
  if (n.includes('bank') || n.includes('atm') || n.includes('finance') || n.includes('money')) return '🏦';
  if (n.includes('school') || n.includes('college') || n.includes('education') || n.includes('university')) return '🎓';
  if (n.includes('sport') || n.includes('fitness') || n.includes('gym') || n.includes('game')) return '⚽';
  if (n.includes('police') || n.includes('security') || n.includes('safety')) return '👮';
  if (n.includes('fort') || n.includes('heritage') || n.includes('historic') || n.includes('monument')) return '🏰';
  return '📍';
};

// ---- Skeleton Card ----
const SkeletonCard = ({shimmer}) => {
  const opacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 1],
  });
  return (
    <Animated.View style={[styles.categoryCard, {opacity}]}>
      <View style={styles.categoryRow}>
        <View style={[styles.iconCircle, {backgroundColor: '#E5E7EB'}]} />
        <View style={{flex: 1, marginLeft: 16}}>
          <View style={{height: 17, width: '60%', backgroundColor: '#E5E7EB', borderRadius: 8, marginBottom: 9}} />
          <View style={{height: 13, width: '40%', backgroundColor: '#F3F4F6', borderRadius: 6}} />
        </View>
        <View style={{width: 22, height: 22, backgroundColor: '#F3F4F6', borderRadius: 4}} />
      </View>
    </Animated.View>
  );
};

// ---- Category Item ----
const CategoryItem = ({item, isExpanded, onToggle, onSubCatPress}) => {
  const {t} = useTranslation();
  const hasSubcats = item.sub_categories && item.sub_categories.length > 0;

  // Resolve icon: use API URL if it looks like a valid remote URL (not SVG, not '0')
  const iconUrl =
    item.icon &&
    typeof item.icon === 'string' &&
    item.icon !== '0' &&
    !item.icon.endsWith('.svg') &&
    item.icon.startsWith('http')
      ? item.icon
      : null;

  // Count shown below category name
  const siteCount = item.total_count || item.count || item.sites_count || null;

  return (
    <View style={styles.categoryCard}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={hasSubcats ? onToggle : () => onSubCatPress(item)}
        style={styles.categoryRow}>
        {/* Icon circle */}
        <View style={styles.iconCircle}>
          {iconUrl ? (
            <Image
              source={{uri: iconUrl}}
              style={{width: 40, height: 40}}
              resizeMode="contain"
            />
          ) : (
            <Text style={styles.iconEmoji}>{getCategoryEmoji(item.name)}</Text>
          )}
        </View>

        {/* Info */}
        <View style={styles.categoryInfo}>
          <Text style={styles.categoryName} numberOfLines={2}>
            {item.name}
          </Text>
          {siteCount != null && siteCount > 0 && (
            <Text style={styles.categoryCount}>{siteCount} {t('CATEGORIES_SCREEN.PLACES')}</Text>
          )}
        </View>

        {/* Arrow icon — Ionicons instead of text character */}
        {hasSubcats && (
          <Ionicons
            name={isExpanded ? 'chevron-down' : 'chevron-forward'}
            size={22}
            color={C.textLight}
          />
        )}
      </TouchableOpacity>

      {/* Subcategories expanded */}
      {isExpanded && hasSubcats && (
        <View style={styles.subcategoriesContainer}>
          <View style={styles.subcategoriesDivider} />
          <View style={styles.pillsWrap}>
            {item.sub_categories.map(sub => {
              const subCount = sub.total_count || sub.count || sub.sites_count || null;
              const subIconUrl =
                sub.icon &&
                typeof sub.icon === 'string' &&
                sub.icon !== '0' &&
                !sub.icon.endsWith('.svg') &&
                sub.icon.startsWith('http')
                  ? sub.icon
                  : null;
              return (
                <TouchableOpacity
                  key={sub.id ? sub.id.toString() : sub.name}
                  onPress={() => onSubCatPress(sub)}
                  activeOpacity={0.7}
                  style={styles.pill}>
                  <View style={styles.pillInner}>
                    {subIconUrl ? (
                      <Image
                        source={{uri: subIconUrl}}
                        style={styles.pillIcon}
                        resizeMode="contain"
                      />
                    ) : (
                      <Text style={styles.pillEmoji}>{getCategoryEmoji(sub.name)}</Text>
                    )}
                    <Text style={styles.pillText} numberOfLines={1} ellipsizeMode="tail">
                      {sub.name}{subCount != null && subCount > 0 ? ` (${subCount})` : ''}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
};

// ---- Main Component ----
const Categories = ({route, navigation, ...props}) => {
  const {t} = useTranslation();

  const [categories, setCategories] = useState([]);
  const [expandedIndex, setExpandedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [offline, setOffline] = useState(false);
  const [showOnlineMode, setShowOnlineMode] = useState(false);

  const shimmer = useRef(new Animated.Value(0)).current;
  // Ref keeps mode current inside stale closures (e.g. NetInfo listener)
  const modeRef = useRef(props.mode);
  useEffect(() => {
    modeRef.current = props.mode;
  }, [props.mode]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {toValue: 1, duration: 800, useNativeDriver: true}),
        Animated.timing(shimmer, {toValue: 0, duration: 800, useNativeDriver: true}),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [shimmer]);

  useEffect(() => {
    let unsubscribe;
    const backHandler = goBackHandler(navigation);
    checkLogin(navigation);

    const init = async () => {
      props.setLoader(true);
      const localData = await getFromStorage(t('STORAGE.CATEGORIES_RESPONSE'));
      if (localData) {
        try {
          const cats = JSON.parse(localData);
          setCategories(cats);
        } catch (e) {}
        setIsLoading(false);
        props.setLoader(false);
      } else {
        setIsLoading(true);
      }

      unsubscribe = NetInfo.addEventListener(state => {
        setOffline(!state.isConnected);
        // Use modeRef.current so we always read the latest mode, not a stale closure value
        dataSync(
          t('STORAGE.CATEGORIES_RESPONSE'),
          () => getCategories(),
          modeRef.current,
        ).then(res => {
          if (res) {
            try {
              const cats = JSON.parse(res);
              setCategories(cats);
            } catch (e) {}
          }
          setIsLoading(false);
          props.setLoader(false);
        });
      });
    };

    init();

    return () => {
      backHandler.remove();
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Re-fetch when language changes
  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem('isLangChanged').then(val => {
        if (val === 'true') {
          AsyncStorage.setItem('isLangChanged', 'false');
          getCategories().then(res => {
            if (res && res.length > 0) {
              setCategories(res);
              saveToStorage(t('STORAGE.CATEGORIES_RESPONSE'), JSON.stringify(res));
            }
          });
        }
      });
    }, []),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    // Read current mode fresh from storage — same pattern as HomeScreen.js
    const currentMode = JSON.parse(await getFromStorage(t('STORAGE.MODE')));
    if (!currentMode || offline) {
      setShowOnlineMode(true);
      setRefreshing(false);
      return;
    }
    getCategories().then(res => {
      if (res && res.length > 0) {
        setCategories(res);
        saveToStorage(t('STORAGE.CATEGORIES_RESPONSE'), JSON.stringify(res));
      }
      setRefreshing(false);
    });
  };

  const getCategories = () => {
    const data = {parent_list: '1', per_page: '20'};
    return comnPost('v2/listcategories', data, navigation)
      .then(res => {
        if (res && res.data && res.data.data) return res.data.data.data;
        return [];
      })
      .catch(() => []);
  };

  const toggleExpanded = index => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedIndex(prev => (prev === index ? null : index));
  };

  const goToSubCats = subCat => {
    navigateTo(navigation, t('SCREEN.CITY_PLACE_SEARCH'), {
      initialCategoryKey: subCat.code || subCat.name,
      initialCityName: subCat.name,
    });
  };

  const handleModeChange = async newMode => {
    await saveToStorage(t('STORAGE.MODE'), JSON.stringify(newMode));
    props.setMode(newMode);
    setShowOnlineMode(false);
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      {/* Header — ocean-deep base with forest-deep overlay for teal-to-green blend */}
      <View style={styles.header}>
        <View style={styles.headerForestOverlay} />
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => backPage(navigation)}
          activeOpacity={0.8}>
          <Ionicons name="chevron-back-outline" size={20} color={C.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('CATEGORIES_SCREEN.TITLE')}</Text>
      </View>

      {/* Content wrapper — cream with large rounded top creates the curve effect */}
      <View style={styles.contentWrap}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={C.oceanMid}
              colors={[C.oceanMid]}
            />
          }>
          {/* Offline banner */}
          {offline && (
            <View style={styles.offlineBanner}>
              <Ionicons name="cloud-offline-outline" size={14} color="#856404" style={{marginRight: 6}} />
              <Text style={styles.offlineBannerText}>
                {t('CATEGORIES_SCREEN.OFFLINE_BANNER')}
              </Text>
            </View>
          )}

          {/* Category list */}
          <View style={styles.categoriesList}>
            {isLoading && categories.length === 0 ? (
              [0, 1, 2, 3, 4, 5].map(i => <SkeletonCard key={i} shimmer={shimmer} />)
            ) : categories.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyTitle}>{t('CATEGORIES_SCREEN.NO_CATEGORIES')}</Text>
                <Text style={styles.emptyText}>{t('CATEGORIES_SCREEN.TRY_AGAIN')}</Text>
              </View>
            ) : (
              categories.map((item, index) => (
                <CategoryItem
                  key={item.id ? item.id.toString() : index.toString()}
                  item={item}
                  isExpanded={expandedIndex === index}
                  onToggle={() => toggleExpanded(index)}
                  onSubCatPress={goToSubCats}
                />
              ))
            )}
          </View>
        </ScrollView>
      </View>

      <ModePopup
        visible={showOnlineMode}
        currentMode={props.mode}
        onClose={() => setShowOnlineMode(false)}
        onModeChange={handleModeChange}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: C.oceanDeep,
  },

  // Header
  header: {
    backgroundColor: C.oceanDeep,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
    position: 'relative',
    overflow: 'hidden',
  },
  // Forest-green overlay blended over ocean-deep for gradient simulation
  headerForestOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: C.forestDeep,
    opacity: 0.32,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: C.white,
    letterSpacing: 0.3,
  },

  // Content with rounded top — creates the curve against the header background
  contentWrap: {
    flex: 1,
    backgroundColor: C.cream,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },

  scrollView: {
    flex: 1,
    backgroundColor: C.cream,
  },
  scrollContent: {
    paddingTop: 20,
    paddingBottom: 100,
  },

  // Offline banner
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#FFF3CD',
    borderRadius: 10,
  },
  offlineBannerText: {
    fontSize: 13,
    color: '#856404',
    flex: 1,
  },

  // Categories list
  categoriesList: {
    paddingHorizontal: 20,
  },

  // Category card — no elevation, no shadow
  categoryCard: {
    backgroundColor: C.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 10,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 70,
    height: 70,
    borderRadius: 20,
    backgroundColor: C.oceanFoam,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEmoji: {
    fontSize: 34,
  },
  categoryInfo: {
    flex: 1,
    marginLeft: 16,
  },
  categoryName: {
    fontSize: 17,
    fontWeight: '600',
    color: C.textDark,
    marginBottom: 4,
  },
  categoryCount: {
    fontSize: 13,
    color: C.textLight,
  },

  // Subcategories
  subcategoriesContainer: {
    marginTop: 14,
  },
  subcategoriesDivider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.04)',
    marginBottom: 12,
  },
  pillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    backgroundColor: C.forestPale,
    borderRadius: 50,
    paddingHorizontal: 14,
    paddingVertical: 9,
    minHeight: 44,
    justifyContent: 'center',
    flexShrink: 1,
  },
  pillInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pillIcon: {
    width: 18,
    height: 18,
    borderRadius: 4,
    flexShrink: 0,
  },
  pillEmoji: {
    fontSize: 15,
    lineHeight: 18,
    flexShrink: 0,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '500',
    color: C.forestMid,
  },

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: C.textMid,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 13,
    color: C.textLight,
    textAlign: 'center',
  },
});

const mapStateToProps = state => ({
  access_token: state.commonState.access_token,
  mode: state.commonState.mode,
  isLoading: state.commonState.isLoading,
});

const mapDispatchToProps = dispatch => ({
  setLoader: data => dispatch(setLoader(data)),
  setMode: data => dispatch(setMode(data)),
});

export default connect(mapStateToProps, mapDispatchToProps)(Categories);
