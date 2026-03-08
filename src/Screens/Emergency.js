import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  FlatList,
  View,
  Linking,
  TouchableOpacity,
  ScrollView,
  Text,
  ActivityIndicator,
  RefreshControl,
  Alert,
  BackHandler,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import COLOR from '../Services/Constants/COLORS';
import { backPage } from '../Services/CommonMethods';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { comnPost, dataSync, getFromStorage, saveToStorage } from '../Services/Api/CommonServices';
import STRING from '../Services/Constants/STRINGS';
import styles from './EmergencyStyles';

const getStaticOther = t => [
  {
    type: 'grouped',
    name: t('EMERGENCY_SCREEN.MORE_NUMBERS'),
    meta: t('EMERGENCY_SCREEN.NATIONAL_HELPLINES'),
    icon: 'ℹ️',
    lines: [
      { label: t('EMERGENCY_SCREEN.WOMEN_HELPLINE'), number: '1091' },
      { label: t('EMERGENCY_SCREEN.CHILD_HELPLINE'), number: '1098' },
      { label: t('EMERGENCY_SCREEN.SENIOR_CITIZENS'), number: '1291' },
      { label: t('EMERGENCY_SCREEN.TOURIST_HELPLINE'), number: '1363' },
      { label: t('EMERGENCY_SCREEN.DISASTER_MGMT'), number: '108' },
    ],
  },
];

const ICON_MAP = {
  hospital: '🏥',
  police_station: '🚔',
  fire_station: '🚒',
  fire_brigade: '🚒',
  blood_bank: '🩸',
  ambulance: '🚑',
  disaster: '⛑️',
  rescue: '🆘',
  civil_defence: '🛡️',
  emergency_service: '📞',
  disaster_relief: '🏕️',
};

const PER_PAGE = 10;

const mapSiteToContact = (item, icon) => ({
  name: item.name,
  meta: `${item.site?.name || 'Sindhudurg'} · ${item.categories?.[0]?.name || ''}`,
  number: item.address?.length > 0 ? item.address[item.address.length - 1].phone : '',
  icon,
  latitude: item.latitude,
  longitude: item.longitude,
});

const Emergency = ({ navigation }) => {
  const {t} = useTranslation();
  const insets = useSafeAreaInsets();
  const [tabs, setTabs] = useState([]);
  const [activeTab, setActiveTab] = useState('');
  const [contacts, setContacts] = useState({ Other: getStaticOther(t) });
  const [paging, setPaging] = useState({});
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const tabCodesRef = useRef({});
  const tabScrollRef = useRef(null);
  const tabLayoutsRef = useRef({});
  const loadingMoreRef = useRef(false);

  const quickActions = [
    { name: t('EMERGENCY_SCREEN.AMBULANCE'), number: '108', icon: '🚑' },
    { name: t('EMERGENCY_SCREEN.POLICE'), number: '100', icon: '👮' },
    { name: t('EMERGENCY_SCREEN.FIRE'), number: '101', icon: '🚒' },
  ];

  const fetchInitial = useCallback(async (isRefresh = false) => {
    const storageKey = STRING.STORAGE.EMERGENCY; // 'emergency' — populated by landing page API

    const parseSubCategories = parsed => {
      if (!parsed) return [];
      // Format from landing page API: {data: [{sub_categories: [...]}]}
      if (parsed?.data?.[0]?.sub_categories?.length > 0) return parsed.data[0].sub_categories;
      // Already a flat array of sub_categories
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      return [];
    };

    const populateTabs = subCategories => {
      if (!subCategories.length) return;
      const newContacts = { Other: getStaticOther(t) };
      const newPaging = {};
      const newTabCodes = {};
      const newTabs = [];

      subCategories.forEach(sc => {
        if (!sc.name) return;
        const icon = ICON_MAP[sc.code] || '📞';
        newContacts[sc.name] = (sc.sites || []).map(site => ({
          name: site.name,
          meta: `Sindhudurg · ${sc.name}`,
          number: '',
          icon,
        }));
        newPaging[sc.name] = { page: 1, hasMore: (sc.sites?.length || 0) >= PER_PAGE };
        newTabCodes[sc.name] = sc.code;
        newTabs.push(sc.name);
      });

      newTabs.push('Other');
      tabCodesRef.current = newTabCodes;
      setTabs(newTabs);
      setContacts(newContacts);
      setPaging(newPaging);
      setActiveTab(prev => prev && newTabs.includes(prev) ? prev : newTabs[0]);
    };

    // 1. Load local data immediately (same pattern as HomeScreen) — no spinner if data exists
    if (!isRefresh) {
      const localData = await getFromStorage(storageKey);
      if (localData) {
        try {
          const subCats = parseSubCategories(JSON.parse(localData));
          if (subCats.length > 0) {
            populateTabs(subCats);
            setInitialLoading(false);
          } else {
            setInitialLoading(true);
          }
        } catch (_) {
          setInitialLoading(true);
        }
      } else {
        setInitialLoading(true);
      }
    }

    // 2. Sync with API for fresh data (runs in background if local data was already loaded)
    try {
      const storedMode = await getFromStorage(STRING.STORAGE.MODE);
      const appMode = storedMode !== null ? JSON.parse(storedMode) : true;

      const result = await dataSync(
        storageKey,
        () => comnPost('v2/listcategories', { category: 'emergency', per_page: 10 }, navigation),
        appMode,
      );

      let subCategories = [];

      if (typeof result === 'string') {
        try {
          subCategories = parseSubCategories(JSON.parse(result));
        } catch (_) {}
      } else if (result && typeof result === 'object') {
        subCategories = result?.data?.data?.data?.[0]?.sub_categories || [];
        if (subCategories.length > 0) {
          // Save in landing-page format so future reads parse correctly
          saveToStorage(storageKey, JSON.stringify({ data: [{ sub_categories: subCategories }] }));
        }
      }

      if (subCategories.length > 0) {
        populateTabs(subCategories);
      }
    } catch (_) {
    } finally {
      setInitialLoading(false);
    }
  }, [navigation]);

  const fetchTabPage = useCallback(async (tab, page) => {
    const storedMode = await getFromStorage(STRING.STORAGE.MODE);
    const appMode = storedMode !== null ? JSON.parse(storedMode) : true;
    if (!appMode) {
      Alert.alert('Offline Mode', STRING.ALERT.MODE_OFFLINE);
      return;
    }
    const code = tabCodesRef.current[tab];
    if (!code) return;

    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const res = await comnPost(
        `v2/sites?page=${page}`,
        { apitype: 'list', category: code, per_page: PER_PAGE },
        navigation,
      );
      console.log(`[Emergency] fetchTabPage tab="${tab}" page=${page} code="${code}" raw res:`, res?.data);
      const data = res?.data?.data?.data || [];
      const hasMore = !!res?.data?.data?.next_page_url;
      console.log(`[Emergency] fetchTabPage data count: ${data.length}, hasMore: ${hasMore}`);
      if (data.length > 0) {
        console.log('[Emergency] fetchTabPage first item sample:', data[0]);
      }
      const icon = ICON_MAP[code] || '📞';
      const mapped = data.map(item => mapSiteToContact(item, icon));

      if (mapped.length > 0) {
        setContacts(prev => {
          const existing = prev[tab] || [];
          const updated = page === 1 ? mapped : [...existing, ...mapped];
          return { ...prev, [tab]: updated };
        });
      }
      setPaging(prev => ({ ...prev, [tab]: { page, hasMore } }));
    } catch (_) {
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [navigation]);

  const onRefresh = useCallback(async () => {
    const storedMode = await getFromStorage(STRING.STORAGE.MODE);
    const appMode = storedMode !== null ? JSON.parse(storedMode) : true;
    if (!appMode) {
      Alert.alert('Offline Mode', STRING.ALERT.MODE_OFFLINE);
      return;
    }
    setRefreshing(true);
    try {
      await fetchInitial(true);
    } finally {
      setRefreshing(false);
    }
  }, [fetchInitial]);

  const onEndReached = useCallback(() => {
    if (activeTab === 'Other' || !activeTab) return;
    const pagingInfo = paging[activeTab];
    if (!pagingInfo?.hasMore || loadingMoreRef.current || initialLoading) return;
    fetchTabPage(activeTab, (pagingInfo.page || 1) + 1);
  }, [activeTab, paging, initialLoading, fetchTabPage]);

  // Run only once on mount
  useEffect(() => {
    fetchInitial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-fetch when language changes
  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem('isLangChanged').then(val => {
        if (val === 'true') {
          AsyncStorage.setItem('isLangChanged', 'false');
          fetchInitial(true);
        }
      });
    }, [fetchInitial]),
  );

  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        navigation.navigate(STRING.SCREEN.DASHBOARD);
        return true;
      });
      return () => sub.remove();
    }, [navigation]),
  );

  // Scroll tab strip to align active chip near left
  useEffect(() => {
    if (!activeTab || !tabScrollRef.current) return;
    const layout = tabLayoutsRef.current[activeTab];
    if (!layout) return;
    const scrollX = layout.x - 40;
    tabScrollRef.current.scrollTo({ x: Math.max(0, scrollX), animated: false });
  }, [activeTab]);

  const makeCall = number => {
    if (!number) return;
    Linking.openURL(`tel:${number}`).catch(() => {});
  };

  const openDirections = (name, latitude, longitude) => {
    const url =
      latitude && longitude
        ? `https://maps.google.com/?q=${latitude},${longitude}`
        : `https://maps.google.com/?q=${encodeURIComponent(name + ' Sindhudurg Maharashtra')}`;
    Linking.openURL(url).catch(() => {});
  };

  const renderContactCard = ({ item }) => {
    if (item.type === 'grouped') {
      return (
        <View style={styles.groupedCard}>
          <View style={styles.groupedIconContainer}>
            <Text style={styles.contactIcon}>{item.icon}</Text>
          </View>
          <View style={styles.contactInfo}>
            <Text style={styles.contactName}>{item.name}</Text>
            <Text style={styles.contactMeta}>{item.meta}</Text>
            {item.lines.map(line => (
              <TouchableOpacity
                key={line.label}
                style={styles.groupedRow}
                onPress={() => makeCall(line.number)}>
                <Text style={styles.groupedLabel}>{line.label}:</Text>
                <Text style={styles.groupedNumber}>{line.number}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      );
    }

    return (
      <View style={styles.contactCard}>
        {item.icon && (
          <View style={styles.contactIconContainer}>
            <Text style={styles.contactIcon}>{item.icon}</Text>
          </View>
        )}
        <View style={styles.contactInfo}>
          <Text style={styles.contactName}>{item.name}</Text>
          <Text style={styles.contactMeta}>{item.meta}</Text>
          {!!item.number && (
            <Text style={styles.contactNumber}>📞 {item.number}</Text>
          )}
          <View style={styles.contactActions}>
            {!!item.number && (
              <TouchableOpacity
                style={styles.btnCall}
                onPress={() => makeCall(item.number)}>
                <Text style={styles.btnCallText}>📞 Call Now</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.btnDirections}
              onPress={() => openDirections(item.name, item.latitude, item.longitude)}>
              <Text style={styles.btnDirectionsText}>📍 Directions</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderTab = tabName => (
    <TouchableOpacity
      key={tabName}
      style={[styles.tab, activeTab === tabName && styles.activeTab]}
      onLayout={e => {
        tabLayoutsRef.current[tabName] = {
          x: e.nativeEvent.layout.x,
          width: e.nativeEvent.layout.width,
        };
      }}
      onPress={() => setActiveTab(tabName)}>
      <Text style={[styles.tabText, activeTab === tabName && styles.activeTabText]}>
        {tabName}
      </Text>
    </TouchableOpacity>
  );

  const ListHeader = () => (
    <>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => backPage(navigation)} style={styles.headerBack}>
          <Ionicons name="chevron-back" size={24} color={COLOR.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('EMERGENCY_SCREEN.TITLE')}</Text>
        <Text style={styles.headerSubtitle}>{t('EMERGENCY_SCREEN.SUBTITLE')}</Text>
        <View style={styles.quickActions}>
          {quickActions.map(item => (
            <TouchableOpacity
              key={item.name}
              style={styles.quickBtn}
              onPress={() => makeCall(item.number)}>
              <Text style={styles.quickIcon}>{item.icon}</Text>
              <Text style={styles.quickLabel}>{item.name}</Text>
              <Text style={styles.quickNumber}>{item.number}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <View style={styles.curve} />
      <View style={styles.listContent}>
        <View style={styles.alertBox}>
          <Text style={styles.alertIcon}>⚠️</Text>
          <View style={styles.alertTextContainer}>
            <Text style={styles.alertText}>
              <Text style={{ fontWeight: 'bold', color: '#DC2626' }}>{t('EMERGENCY_SCREEN.ALERT_BOLD')}</Text>
              {t('EMERGENCY_SCREEN.ALERT_TEXT')}
            </Text>
          </View>
        </View>
        {tabs.length > 0 && (
          <ScrollView
            ref={tabScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabs}>
            {tabs.map(tabName => renderTab(tabName))}
          </ScrollView>
        )}
      </View>
    </>
  );

  const ListEmpty = () =>
    initialLoading ? (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#DC2626" />
      </View>
    ) : (
      <View style={styles.loaderContainer}>
        <Text style={styles.emptyText}>{t('EMERGENCY_SCREEN.NO_CONTACTS')}</Text>
      </View>
    );

  const ListFooter = () =>
    loadingMore ? (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="small" color="#DC2626" />
      </View>
    ) : null;

  return (
    <FlatList
      data={activeTab ? contacts[activeTab] : []}
      renderItem={renderContactCard}
      keyExtractor={(_item, index) => index.toString()}
      contentContainerStyle={styles.contactsList}
      ListHeaderComponent={ListHeader}
      ListEmptyComponent={ListEmpty}
      ListFooterComponent={ListFooter}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.4}
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      windowSize={10}
      initialNumToRender={10}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#DC2626']}
          tintColor="#DC2626"
        />
      }
    />
  );
};

export default Emergency;
