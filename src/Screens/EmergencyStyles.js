import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#DC2626', // red
    },
    header: {
        backgroundColor: '#DC2626',
        paddingBottom: 28,
        paddingHorizontal: 20,
    },
    curve: {
        height: 20,
        backgroundColor: '#DC2626',
    },
    listContent: {
        backgroundColor: '#FAF7F0',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        marginTop: -20,
        paddingTop: 20,
    },
    headerBack: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    headerTitle: {
        fontFamily: 'Playfair Display',
        fontSize: 28,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 6,
    },
    headerSubtitle: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.9)',
    },
    quickActions: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 20,
    },
    quickBtn: {
      backgroundColor: '#fff',
      borderWidth: 2,
      borderColor: 'rgba(255,255,255,0.6)',
      borderRadius: 18,
      paddingVertical: 15,
      paddingHorizontal: 10,
      alignItems: 'center',
      flex: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
    quickIcon: {
      fontSize: 30,
    },
    quickLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: '#DC2626',
      textTransform: 'uppercase',
      marginTop: 8,
      letterSpacing: 0.5,
    },
    quickNumber: {
      fontSize: 16,
      fontWeight: '700',
      color: '#1C1917', // text-dark
      marginTop: 4,
    },
    alertBox: {
        marginHorizontal: 20,
        marginBottom: 20,
        backgroundColor: '#FEE2E2',
        borderLeftWidth: 4,
        borderColor: '#DC2626',
        borderRadius: 18,
        padding: 16,
        flexDirection: 'row',
        gap: 12
    },
    alertIcon: {
        fontSize: 24,
        flexShrink: 0
    },
    alertTextContainer: {
      flex: 1,
    },
    alertText: {
        fontSize: 13,
        lineHeight: 20,
        color: '#1C1917'
    },
    tabs: {
        flexDirection: 'row',
        gap: 8,
        paddingHorizontal: 20,
        paddingBottom: 16
    },
    tab: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 50,
        backgroundColor: '#fff',
        borderWidth: 1.5,
        borderColor: '#00000008'
    },
    activeTab: {
        backgroundColor: '#1B6B7B', // ocean-mid
        borderColor: 'transparent',
    },
    tabText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#1C1917'
    },
    activeTabText: {
        color: '#fff'
    },
    contactsList: {
      paddingBottom: 20,
      backgroundColor: '#F2F0EB',
    },
    contactCard: {
      backgroundColor: '#fff',
      borderRadius: 18,
      padding: 16,
      marginBottom: 12,
      marginHorizontal: 20,
      flexDirection: 'row',
      gap: 14,
    },
    groupedCard: {
      backgroundColor: '#EFF6FF',
      borderWidth: 2,
      borderColor: '#DBEAFE',
      borderRadius: 18,
      padding: 16,
      marginBottom: 12,
      marginHorizontal: 20,
      flexDirection: 'row',
      gap: 14,
    },
    groupedIconContainer: {
      width: 56,
      height: 56,
      borderRadius: 14,
      backgroundColor: '#DBEAFE',
      justifyContent: 'center',
      alignItems: 'center',
    },
    groupedRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 5,
      borderBottomWidth: 1,
      borderBottomColor: '#DBEAFE',
    },
    groupedLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: '#44403C',
      flex: 1,
    },
    groupedNumber: {
      fontSize: 14,
      fontWeight: '700',
      color: '#1B6B7B',
    },
    contactIconContainer: {
      width: 56,
      height: 56,
      borderRadius: 14,
      backgroundColor: '#FEE2E2',
      justifyContent: 'center',
      alignItems: 'center',
    },
    contactIcon: {
      fontSize: 28,
    },
    contactInfo: {
      flex: 1,
    },
    contactName: {
      fontSize: 16,
      fontWeight: '600',
      color: '#1C1917',
      marginBottom: 4,
    },
    contactMeta: {
      fontSize: 12,
      color: '#78716C', // text-light
      marginBottom: 8,
    },
    contactNumber: {
      fontSize: 14,
      fontWeight: '600',
      color: '#1B6B7B',
      marginBottom: 8,
    },
    contactActions: {
      flexDirection: 'row',
      gap: 8,
      flexWrap: 'wrap',
    },
    btnCall: {
      backgroundColor: '#10B981',
      borderRadius: 50,
      paddingVertical: 8,
      paddingHorizontal: 16,
    },
    btnCallText: {
      color: '#fff',
      fontSize: 13,
      fontWeight: '600',
    },
    btnDirections: {
      backgroundColor: '#00000008',
      borderRadius: 50,
      paddingVertical: 8,
      paddingHorizontal: 16,
    },
    btnDirectionsText: {
      color: '#1C1917',
      fontSize: 13,
      fontWeight: '600',
    },
    loaderContainer: {
      paddingVertical: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyText: {
      fontSize: 14,
      color: '#78716C',
    },
  });

  export default styles;