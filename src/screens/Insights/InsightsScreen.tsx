import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Dimensions,
  ActivityIndicator,
  Image,
  RefreshControl,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { SymbolIcon } from '../../components/common/SymbolIcon';
import { SparklineChart } from '../../components/common/SparklineChart';
import { SignalCard } from '../../components/cards/SignalCard';
import { useAccount } from '../../context/AccountContext';
import { SwitchAccountModal, OpenAccountModal } from '../../components/modals';
import { ChartScreen } from '../Chart/ChartScreen';
import { useMarketQuotes } from '../../hooks/useMarketQuotes';
import { marketSymbolsMatch } from '../../utils/symbol';
import {
  economicCalendarService,
  EconomicEvent,
} from '../../services/economicCalendarService';
import {
  TRADING_SIGNALS,
  TradingSignalItem,
} from '../../services/signalsService';
import {
  TOP_NEWS_ARTICLES,
  MarketNewsArticle,
} from '../../services/marketNewsService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface TopMoverDef {
  symbol: string;
  querySymbol: string;
  displayName: string;
  fallbackPrice: number;
  fallbackChange: number;
  digits: number;
  initialPoints: number[];
}

const TOP_MOVERS_LIST: TopMoverDef[] = [
  {
    symbol: 'ETH/BTC',
    querySymbol: 'ETHBTC',
    displayName: 'ETH/BTC',
    fallbackPrice: 0.03201,
    fallbackChange: 0.04,
    digits: 6,
    initialPoints: [0.03198, 0.03195, 0.03202, 0.03204, 0.03201],
  },
  {
    symbol: 'BTC',
    querySymbol: 'BTCUSD',
    displayName: 'BTC',
    fallbackPrice: 84023.99,
    fallbackChange: -0.07,
    digits: 2,
    initialPoints: [84080, 84050, 84010, 84040, 84023.99],
  },
  {
    symbol: 'BTC/USDT',
    querySymbol: 'BTCUSDT',
    displayName: 'BTC/USDT',
    fallbackPrice: 84028.99,
    fallbackChange: -0.07,
    digits: 2,
    initialPoints: [84090, 84060, 84015, 84045, 84028.99],
  },
  {
    symbol: 'XAU/USD',
    querySymbol: 'XAUUSD',
    displayName: 'XAU/USD',
    fallbackPrice: 2654.8,
    fallbackChange: 0.68,
    digits: 2,
    initialPoints: [2642, 2646, 2650, 2652, 2654.8],
  },
  {
    symbol: 'USOIL',
    querySymbol: 'USOIL',
    displayName: 'USOIL',
    fallbackPrice: 71.45,
    fallbackChange: -1.25,
    digits: 2,
    initialPoints: [72.3, 72.0, 71.8, 71.6, 71.45],
  },
  {
    symbol: 'ETH/USD',
    querySymbol: 'ETHUSD',
    displayName: 'ETH/USD',
    fallbackPrice: 2685.5,
    fallbackChange: 0.12,
    digits: 2,
    initialPoints: [2678, 2680, 2684, 2682, 2685.5],
  },
];

export const InsightsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { accounts, activeAccount, setActiveAccount, addAccount } = useAccount();

  const [refreshing, setRefreshing] = useState(false);
  const [showSwitchAccount, setShowSwitchAccount] = useState(false);
  const [showOpenAccount, setShowOpenAccount] = useState(false);
  const [selectedChartSymbol, setSelectedChartSymbol] = useState<string | null>(null);

  // Economic events & news state
  const [events, setEvents] = useState<EconomicEvent[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [selectedNews, setSelectedNews] = useState<MarketNewsArticle | null>(null);

  // Subscribe to live top movers quotes via WebSocket
  const moverSymbols = useMemo(
    () => TOP_MOVERS_LIST.map((m) => m.querySymbol),
    []
  );
  const liveMoverQuotes = useMarketQuotes(moverSymbols);

  const loadCalendarEvents = useCallback(async () => {
    setIsLoadingEvents(true);
    try {
      const data = await economicCalendarService.fetchEvents();
      setEvents(data);
    } catch {
      // fallback handled in service
    } finally {
      setIsLoadingEvents(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadCalendarEvents();
  }, [loadCalendarEvents]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadCalendarEvents();
  }, [loadCalendarEvents]);

  // Render Impact indicator 3 bars
  const renderImpactBars = (impact: string) => {
    const isHigh = impact === 'High';
    const isMedium = impact === 'Medium';
    const isLow = impact === 'Low';
    const isHoliday = impact === 'Holiday';

    if (isHoliday) {
      return (
        <View style={styles.holidayBadge}>
          <Text style={styles.holidayText}>Holiday</Text>
        </View>
      );
    }

    return (
      <View style={styles.impactBarsRow}>
        <View style={[styles.impactBar, { backgroundColor: '#F59E0B' }]} />
        <View
          style={[
            styles.impactBar,
            { backgroundColor: isHigh || isMedium ? '#F59E0B' : '#E5E7EB' },
          ]}
        />
        <View
          style={[
            styles.impactBar,
            { backgroundColor: isHigh ? '#F59E0B' : '#E5E7EB' },
          ]}
        />
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* TOP BAR: Centered Account Badge */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.accountPill}
          activeOpacity={0.8}
          onPress={() => setShowSwitchAccount(true)}
        >
          <View
            style={[
              styles.accountTypeChip,
              activeAccount.type === 'Demo' ? styles.demoChip : styles.realChip,
            ]}
          >
            <Text
              style={[
                styles.accountTypeChipText,
                activeAccount.type === 'Demo'
                  ? styles.demoChipText
                  : styles.realChipText,
              ]}
            >
              {activeAccount.type}
            </Text>
          </View>

          <Text style={styles.accountBalanceText}>
            {activeAccount.balance} {activeAccount.currency}
          </Text>

          <Ionicons
            name="ellipsis-vertical"
            size={14}
            color="#111827"
            style={{ marginLeft: 4 }}
          />
        </TouchableOpacity>
      </View>

      {/* Main Scroll Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 48 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#F59E0B"
            colors={['#F59E0B']}
          />
        }
      >
        {/* SCREEN TITLE: "Insights" */}
        <View style={styles.titleRow}>
          <Text style={styles.screenTitle}>Insights</Text>
        </View>

        {/* SECTION 1: TOP MOVERS */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>TOP MOVERS</Text>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.showMoreLink}>Show more</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalMoversList}
        >
          {TOP_MOVERS_LIST.map((item, idx) => {
            const live =
              liveMoverQuotes[item.querySymbol] ??
              Object.values(liveMoverQuotes).find((q) =>
                marketSymbolsMatch(q.symbol, item.querySymbol)
              );
            const price = live && live.bid > 0 ? live.bid : item.fallbackPrice;
            const changePercent =
              live?.changePercent !== undefined
                ? live.changePercent
                : item.fallbackChange;
            const isPositive = changePercent >= 0;
            const formattedPrice = price.toFixed(item.digits);
            const formattedChange = `${isPositive ? '↑' : '↓'} ${Math.abs(
              changePercent
            ).toFixed(2)}%`;

            // Sparkline points
            const sparkPoints = isPositive
              ? [price * 0.9992, price * 0.9988, price * 0.9996, price * 1.0002, price]
              : [price * 1.0008, price * 1.0004, price * 0.9998, price * 0.9994, price];

            return (
              <TouchableOpacity
                key={idx}
                activeOpacity={0.82}
                style={styles.moverCard}
                onPress={() => setSelectedChartSymbol(item.querySymbol)}
              >
                {/* Symbol Icon & Label */}
                <View style={styles.moverTopRow}>
                  <SymbolIcon symbol={item.querySymbol} size={28} />
                  <Text style={styles.moverSymbolName} numberOfLines={1}>
                    {item.displayName}
                  </Text>
                </View>

                {/* Sparkline chart with dashed baseline */}
                <View style={styles.moverSparkline}>
                  <SparklineChart
                    points={sparkPoints}
                    isPositive={isPositive}
                    width={82}
                    height={30}
                  />
                </View>

                {/* Big Price */}
                <Text style={styles.moverPrice} numberOfLines={1}>
                  {formattedPrice}
                </Text>

                {/* Change % Text */}
                <Text
                  style={[
                    styles.moverChangeText,
                    { color: isPositive ? '#2563EB' : '#DC2626' },
                  ]}
                >
                  {formattedChange}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* SECTION 2: TRADING SIGNALS */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>TRADING SIGNALS</Text>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.showMoreLink}>Show more</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalMoversList}
        >
          {TRADING_SIGNALS.map((sig) => (
            <SignalCard
              key={sig.id}
              signal={sig}
              onPress={() => setSelectedChartSymbol(sig.symbol)}
            />
          ))}
        </ScrollView>

        {/* SECTION 3: UPCOMING EVENTS */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>UPCOMING EVENTS</Text>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.showMoreLink}>Show more</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.eventsCardContainer}>
          {isLoadingEvents ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#F59E0B" />
              <Text style={styles.loadingText}>Loading calendar events…</Text>
            </View>
          ) : (
            events.slice(0, 5).map((ev, index) => {
              const isLast = index === Math.min(events.length, 5) - 1;
              return (
                <View
                  key={ev.id}
                  style={[
                    styles.eventItemRow,
                    !isLast && styles.eventItemBorderBottom,
                  ]}
                >
                  {/* Flag Icon */}
                  <Text style={styles.eventFlag}>{ev.flag}</Text>

                  {/* Title & Subtitle Info */}
                  <View style={styles.eventInfoCol}>
                    <Text style={styles.eventTitle} numberOfLines={1}>
                      {ev.title}
                    </Text>

                    <View style={styles.eventMetaRow}>
                      <Text style={styles.eventCountryCode}>{ev.country}</Text>
                      {renderImpactBars(ev.impact)}
                      <Text style={styles.eventRelativeTime}>
                        {ev.relativeTime}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* SECTION 4: TOP NEWS */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>TOP NEWS</Text>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.showMoreLink}>Show more</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.eventsCardContainer}>
          {TOP_NEWS_ARTICLES.map((article, index) => {
            const isLast = index === TOP_NEWS_ARTICLES.length - 1;
            return (
              <TouchableOpacity
                key={article.id}
                activeOpacity={0.75}
                style={[
                  styles.newsItemRow,
                  !isLast && styles.eventItemBorderBottom,
                ]}
                onPress={() => setSelectedNews(article)}
              >
                {/* News Thumbnail Image */}
                <Image
                  source={{ uri: article.imageUrl }}
                  style={styles.newsThumbnail}
                  resizeMode="cover"
                />

                {/* News Right Column */}
                <View style={styles.newsInfoCol}>
                  <Text style={styles.newsTitle} numberOfLines={2}>
                    {article.title}
                  </Text>

                  {/* Meta row: Symbol Tag + live change + time ago */}
                  <View style={styles.newsMetaRow}>
                    {article.symbolTag && (
                      <View style={styles.newsSymbolPill}>
                        <Text style={styles.newsSymbolText}>
                          {article.symbolTag}
                        </Text>
                        {article.symbolChange && (
                          <Text
                            style={[
                              styles.newsChangeText,
                              {
                                color: article.isPositive
                                  ? '#2563EB'
                                  : '#DC2626',
                              },
                            ]}
                          >
                            {article.isPositive ? '↑' : '↓'}{' '}
                            {article.symbolChange}
                          </Text>
                        )}
                      </View>
                    )}
                    <Text style={styles.newsTimeAgo}>{article.timeAgo}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Switch Account Modal */}
      <SwitchAccountModal
        visible={showSwitchAccount}
        onClose={() => setShowSwitchAccount(false)}
        accounts={accounts}
        activeAccountId={activeAccount.id}
        onSelectAccount={(account) => {
          setActiveAccount(account);
          setShowSwitchAccount(false);
        }}
        onOpenNewAccount={() => {
          setShowSwitchAccount(false);
          setShowOpenAccount(true);
        }}
      />

      {/* Open Account Modal */}
      <OpenAccountModal
        visible={showOpenAccount}
        onClose={() => setShowOpenAccount(false)}
        onAccountCreated={(newAcc) => {
          addAccount(newAcc);
          setShowOpenAccount(false);
        }}
      />

      {/* Chart Modal on Card Press */}
      {selectedChartSymbol && (
        <ChartScreen
          symbol={selectedChartSymbol}
          onClose={() => setSelectedChartSymbol(null)}
        />
      )}

      {/* News Article Detail Modal */}
      <Modal
        visible={selectedNews !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedNews(null)}
      >
        {selectedNews && (
          <View style={styles.articleModalContainer}>
            <View style={styles.articleModalHeader}>
              <Text style={styles.articleModalSource}>
                {selectedNews.source}
              </Text>
              <TouchableOpacity
                onPress={() => setSelectedNews(null)}
                style={styles.articleCloseBtn}
              >
                <Ionicons name="close" size={24} color="#111827" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20 }}>
              <Image
                source={{ uri: selectedNews.imageUrl }}
                style={styles.articleModalImage}
                resizeMode="cover"
              />
              <Text style={styles.articleModalTitle}>{selectedNews.title}</Text>
              <Text style={styles.articleModalTime}>{selectedNews.timeAgo}</Text>
              <Text style={styles.articleModalBody}>
                {selectedNews.content}
              </Text>
            </ScrollView>
          </View>
        )}
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  topBar: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  accountPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  accountTypeChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 8,
  },
  demoChip: {
    backgroundColor: '#E8F5E9',
  },
  realChip: {
    backgroundColor: '#EFF6FF',
  },
  accountTypeChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  demoChipText: {
    color: '#2E7D32',
  },
  realChipText: {
    color: '#2563EB',
  },
  accountBalanceText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  titleRow: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  screenTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.5,
  },
  showMoreLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
  },
  horizontalMoversList: {
    paddingHorizontal: 16,
  },
  moverCard: {
    width: 140,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    marginRight: 10,
  },
  moverTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  moverSymbolName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    marginLeft: 6,
    flex: 1,
  },
  moverSparkline: {
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
  },
  moverPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginTop: 4,
  },
  moverChangeText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  eventsCardContainer: {
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  loadingContainer: {
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 13,
    color: '#6B7280',
  },
  eventItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  eventItemBorderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  eventFlag: {
    fontSize: 26,
    marginRight: 14,
  },
  eventInfoCol: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  eventMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventCountryCode: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    marginRight: 8,
  },
  impactBarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  impactBar: {
    width: 3.5,
    height: 10,
    borderRadius: 1.5,
    marginRight: 2.5,
  },
  holidayBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    marginRight: 8,
  },
  holidayText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D97706',
  },
  eventRelativeTime: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  newsItemRow: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  newsThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    marginRight: 12,
  },
  newsInfoCol: {
    flex: 1,
  },
  newsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 20,
    marginBottom: 6,
  },
  newsMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  newsSymbolPill: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  newsSymbolText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginRight: 4,
  },
  newsChangeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  newsTimeAgo: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  articleModalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  articleModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  articleModalSource: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  articleCloseBtn: {
    padding: 4,
  },
  articleModalImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
  },
  articleModalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    lineHeight: 28,
    marginBottom: 8,
  },
  articleModalTime: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 16,
  },
  articleModalBody: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 24,
  },
});
