import {StyleSheet} from 'react-native';

export const RADIUS = 18;

export const C = {
  oceanDeep: '#0D3D4A',
  oceanMid: '#1B6B7B',
  oceanFoam: '#B8E4EA',
  sandMid: '#C4972A',
  cream: '#FAF7F0',
  white: '#FFFFFF',
  textDark: '#1C1917',
  textMid: '#44403C',
  textLight: '#78716C',
};

export const s = StyleSheet.create({
  root: {flex: 1, backgroundColor: C.cream},

  // Header
  header: {paddingHorizontal: 16, paddingBottom: 16, zIndex: 10, gap: 12},
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'flex-start',
  },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: RADIUS, paddingHorizontal: 16, paddingVertical: 13,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)', minHeight: 52,
  },
  searchBarFocused: {
    borderColor: C.oceanFoam,
    borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderBottomWidth: 0,
  },
  searchInput: {
    flex: 1, fontSize: 15, color: C.textDark, fontWeight: '500',
    paddingVertical: 2, includeFontPadding: false,
  },

  // Dropdown
  dropdown: {
    position: 'absolute', left: 16, right: 16,
    zIndex: 999, elevation: 12,
    backgroundColor: '#fff',
    borderWidth: 2, borderTopWidth: 0,
    borderColor: C.oceanFoam,
    borderBottomLeftRadius: RADIUS, borderBottomRightRadius: RADIUS,
  },
  suggestionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  suggestionRowIcon: {fontSize: 20},
  suggestionRowText: {fontSize: 14, fontWeight: '500', color: C.textDark},
  suggestionRowSub: {fontSize: 11, color: C.textLight, marginTop: 1},

  // Offline banner
  offlineBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#E74C3C', paddingHorizontal: 16, paddingVertical: 8,
  },
  offlineBannerText: {fontSize: 12, color: C.white, fontWeight: '600'},

  // List
  list: {flex: 1},
  listContent: {paddingHorizontal: 16, paddingBottom: 32},

  // Recent
  recentSection: {marginTop: 16, marginBottom: 8},
  recentHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 13, fontWeight: '700', color: C.textDark,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  clearAll: {fontSize: 12, color: C.oceanMid, fontWeight: '600'},
  recentScroll: {gap: 8, paddingBottom: 4},
  recentChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.08)',
    borderRadius: 50, paddingHorizontal: 14, paddingVertical: 8,
  },
  recentText: {fontSize: 13, color: C.textDark, fontWeight: '500'},

  // Sticky results bar
  stickyResultsBar: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: C.cream,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  resultsCount: {fontSize: 14, fontWeight: '700', color: C.textDark},
  viewToggle: {
    flexDirection: 'row', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 4, borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)',
  },
  toggleBtn: {width: 34, height: 34, borderRadius: 7, alignItems: 'center', justifyContent: 'center'},
  toggleBtnActive: {backgroundColor: C.oceanMid},

  // Grid card
  resultCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: RADIUS, overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)',
  },
  resultImageWrap: {
    width: '100%', height: 140, backgroundColor: C.oceanFoam,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  resultBadge: {
    position: 'absolute', top: 10, right: 10,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 50, paddingHorizontal: 10, paddingVertical: 5,
  },
  resultBadgeText: {fontSize: 11, fontWeight: '700', color: C.oceanMid},
  resultInfo: {padding: 14},
  resultName: {fontSize: 16, fontWeight: '700', color: C.textDark, marginBottom: 5},
  resultLocation: {fontSize: 12, color: C.textLight, marginBottom: 7},
  resultMeta: {flexDirection: 'row', alignItems: 'center', gap: 8},
  resultMetaText: {fontSize: 12, color: C.textMid},
  resultMetaDot: {fontSize: 12, color: C.textLight},

  // List compact
  resultCompact: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 14, padding: 12, marginBottom: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)',
  },
  resultThumb: {
    width: 60, height: 60, borderRadius: 10,
    backgroundColor: C.oceanFoam,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', flexShrink: 0,
  },
  resultThumbImg: {width: '100%', height: '100%'},
  resultContent: {flex: 1},
  resultCompactName: {fontSize: 15, fontWeight: '700', color: C.textDark, marginBottom: 4},
  resultCompactMeta: {fontSize: 11, color: C.textLight},

  // Map
  mapWrapper: {flex: 1},
  mapContainer: {flex: 1, position: 'relative'},
  map: {flex: 1},
  mapNoData: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(250,247,240,0.9)',
  },
  mapNoDataIcon: {fontSize: 40, marginBottom: 10},
  mapNoDataText: {fontSize: 14, color: C.textMid, fontWeight: '600'},

  // Selected place card (floating over map bottom)
  mapCard: {
    position: 'absolute', left: 12, right: 12, bottom: 12,
    backgroundColor: C.white,
    borderRadius: 20, padding: 14,
    elevation: 8,
    shadowColor: '#000', shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15, shadowRadius: 10,
  },
  mapCardClose: {position: 'absolute', top: 12, right: 12, zIndex: 1},
  mapCardBody: {flexDirection: 'row', gap: 12, marginBottom: 12, paddingRight: 24},
  mapCardThumb: {
    width: 64, height: 64, borderRadius: 12,
    backgroundColor: C.oceanFoam,
    overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  mapCardInfo: {flex: 1, justifyContent: 'center', gap: 3},
  mapCardName: {fontSize: 15, fontWeight: '700', color: C.textDark},
  mapCardMeta: {fontSize: 12, color: C.textLight},
  mapCardCategory: {fontSize: 11, color: C.textMid, fontWeight: '500'},
  mapCardActions: {flexDirection: 'row', gap: 8},
  mapActionBtnPrimary: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 6,
    backgroundColor: C.oceanMid, borderRadius: 12, paddingVertical: 10,
  },
  mapActionBtnPrimaryText: {fontSize: 13, fontWeight: '700', color: C.white},
  mapActionBtnSecondary: {
    flex: 1.3, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 6,
    backgroundColor: 'rgba(27,107,123,0.1)',
    borderRadius: 12, paddingVertical: 10,
    borderWidth: 1.5, borderColor: 'rgba(27,107,123,0.25)',
  },
  mapActionBtnSecondaryText: {fontSize: 13, fontWeight: '700', color: C.oceanMid},

  // Filter chips
  filterChipsBar: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
    paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: C.cream,
  },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(27,107,123,0.1)',
    borderWidth: 1.5, borderColor: 'rgba(27,107,123,0.3)',
    borderRadius: 50, paddingHorizontal: 12, paddingVertical: 6,
  },
  filterChipText: {fontSize: 12, fontWeight: '600', color: C.oceanMid},

  // Pagination
  loadMoreSpinner: {paddingVertical: 20, alignItems: 'center'},

  // Empty state
  emptyState: {alignItems: 'center', paddingVertical: 48, paddingHorizontal: 32},
  emptyIcon: {fontSize: 52, marginBottom: 16, opacity: 0.3},
  emptyTitle: {fontSize: 16, fontWeight: '700', color: C.textMid, marginBottom: 8, textAlign: 'center'},
  emptySub: {fontSize: 13, color: C.textLight, textAlign: 'center', lineHeight: 20},

  // Can't find card
  addPlaceCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderWidth: 2, borderColor: C.oceanMid,
    borderStyle: 'dashed', borderRadius: 14,
    padding: 16, marginBottom: 16,
  },
  addPlaceIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: C.oceanFoam,
    alignItems: 'center', justifyContent: 'center',
  },
  addPlaceTitle: {fontSize: 14, fontWeight: '700', color: C.textDark, marginBottom: 2},
  addPlaceSub: {fontSize: 11, color: C.textLight},

  // Map horizontal card list
  mapCardList: {position: 'absolute', bottom: 12, left: 0, right: 0},
  mapHCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.white,
    borderRadius: 16, overflow: 'hidden',
    height: 90,
    elevation: 6,
    shadowColor: '#000', shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.14, shadowRadius: 8,
  },
  mapHCardActive: {borderWidth: 2, borderColor: C.oceanMid},
  mapHCardThumb: {
    width: 90, height: 90,
    backgroundColor: C.oceanFoam,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', flexShrink: 0,
  },
  mapHCardInfo: {flex: 1, paddingHorizontal: 12, justifyContent: 'center', gap: 4},
  mapHCardName: {fontSize: 13, fontWeight: '700', color: C.textDark},
  mapHCardMeta: {fontSize: 11, color: C.textLight},
  mapHCardCat: {fontSize: 11, color: C.textMid, fontWeight: '500'},
  mapHCardStreetBtn: {
    paddingHorizontal: 12, alignSelf: 'stretch',
    alignItems: 'center', justifyContent: 'center',
    borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: 'rgba(0,0,0,0.08)',
  },

  // Skeleton — grid
  skeletonCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: RADIUS, overflow: 'hidden', marginBottom: 12,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)',
  },
  skeletonImage: {width: '100%', height: 140, backgroundColor: '#D1E8EC'},
  skeletonInfo: {padding: 14, gap: 8},
  skeletonTitleLine: {height: 14, borderRadius: 7, backgroundColor: '#D1E8EC', width: '70%'},
  skeletonMetaLine: {height: 11, borderRadius: 6, backgroundColor: '#E4F2F4', width: '50%'},
  skeletonMetaShort: {height: 11, borderRadius: 6, backgroundColor: '#E4F2F4', width: '30%'},

  // Skeleton — list
  skeletonListRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 14, padding: 12, marginBottom: 10,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)',
  },
  skeletonThumb: {width: 60, height: 60, borderRadius: 10, backgroundColor: '#D1E8EC', flexShrink: 0},
  skeletonListContent: {flex: 1, gap: 8},
  skeletonListTitle: {height: 14, borderRadius: 7, backgroundColor: '#D1E8EC', width: '65%'},
  skeletonListMeta: {height: 11, borderRadius: 6, backgroundColor: '#E4F2F4', width: '45%'},

  // Skeleton — map
  skeletonMapBg: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#C4D9E0', gap: 10,
  },
  skeletonMapIcon: {fontSize: 52},
  skeletonMapText: {fontSize: 14, color: C.oceanDeep, fontWeight: '600'},
});
