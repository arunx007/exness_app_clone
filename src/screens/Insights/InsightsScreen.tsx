import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
import { marketSymbolsMatch, symbolDisplayName } from '../../utils/symbol';
import { DEFAULT_CATALOG_SYMBOLS } from '../../constants/symbolsCatalog';
import { mt5TradingService } from '../../api/mt5/tradingService';
import { Mt5Symbol } from '../../api/mt5/types';
import {
  economicCalendarService,
  EconomicEvent,
} from '../../services/economicCalendarService';
import {
  signalsService,
  TradingSignalItem,
} from '../../services/signalsService';
import {
  marketNewsService,
  MarketNewsArticle,
} from '../../services/marketNewsService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface DynamicMoverItem {
  symbol: string;
  name: string;
  bid: number;
  ask: number;
  changePercent: number;
  digits: number;
  sparkline: number[];
}

export const InsightsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { accounts, activeAccount, setActiveAccount, addAccount } = useAccount();

  const [refreshing, setRefreshing] = useState(false);
  const [showSwitchAccount, setShowSwitchAccount] = useState(false);
  const [showOpenAccount, setShowOpenAccount] = useState(false);
  const [selectedChartSymbol, setSelectedChartSymbol] = useState<string | null>(null);

  // Dynamic state for all 4 sections
  const [symbols, setSymbols] = useState<Mt5Symbol[]>([]);
  const [isLoadingMovers, setIsLoadingMovers] = useState(true);

  const [signals, setSignals] = useState<TradingSignalItem[]>([]);
  const [isLoadingSignals, setIsLoadingSignals] = useState(true);

  const [events, setEvents] = useState<EconomicEvent[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);

  const [news, setNews] = useState<MarketNewsArticle[]>([]);
  const [isLoadingNews, setIsLoadingNews] = useState(true);
  const [selectedNews, setSelectedNews] = useState<MarketNewsArticle | null>(null);

  // Sparkline history ticks for live movers
  const [sparklines, setSparklines] = useState<Record<string, number[]>>({});

  // 1. Fetch live symbols from MT5 / API dynamically
  const loadSymbols = useCallback(async () => {
    setIsLoadingMovers(true);
    try {
      const liveSymbols = await mt5TradingService.getSymbols();
      if (Array.isArray(liveSymbols) && liveSymbols.length > 0) {
        setSymbols(liveSymbols);
      }
    } catch (e) {
      console.warn('Failed to load MT5 symbols:', e);
    } finally {
      setIsLoadingMovers(false);
    }
  }, []);

  // 2. Fetch upcoming economic events dynamically
  const loadEvents = useCallback(async () => {
    setIsLoadingEvents(true);
    try {
      const liveEvents = await economicCalendarService.fetchEvents();
      setEvents(liveEvents);
    } catch (e) {
      console.warn('Failed to load calendar events:', e);
    } finally {
      setIsLoadingEvents(false);
    }
  }, []);

  // 3. Fetch top market news dynamically
  const loadNews = useCallback(async () => {
    setIsLoadingNews(true);
    try {
      const liveNews = await marketNewsService.fetchTopNews();
      setNews(liveNews);
    } catch (e) {
      console.warn('Failed to load market news:', e);
    } finally {
      setIsLoadingNews(false);
    }
  }, []);

  // Initial mount load
  useEffect(() => {
    void loadSymbols();
    void loadEvents();
    void loadNews();
  }, [loadSymbols, loadEvents, loadNews]);

  const isSignalsInitializedRef = useRef(false);

  // Pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    isSignalsInitializedRef.current = false;
    await Promise.all([loadSymbols(), loadEvents(), loadNews()]);
    setRefreshing(false);
  }, [loadSymbols, loadEvents, loadNews]);

  // Dynamic Top Movers selection: prioritizes active instruments and sorts by absolute change
  const topMoverSymbols = useMemo(() => {
    const priority = ['ETHBTC', 'BTCUSD', 'BTCUSDT', 'XAUUSD', 'USOIL', 'EURUSD', 'ETHUSD', 'SOLUSD'];
    if (symbols.length === 0) {
      return priority;
    }

    const activeFromMeta = [...symbols]
      .filter((s) => Boolean(s.symbol) && !s.symbol.includes('.'))
      .sort((a, b) => Math.abs(b.changePercent || 0) - Math.abs(a.changePercent || 0))
      .map((s) => s.symbol);

    const combined = [...new Set([...priority, ...activeFromMeta])];
    return combined.slice(0, 8);
  }, [symbols]);

  // Connect to live WebSocket quotes for top movers & active symbols
  const allSubscribedSymbols = useMemo(() => {
    const list = new Set<string>(topMoverSymbols);
    list.add('BTCUSD');
    list.add('ETHUSD');
    list.add('XAUUSD');
    list.add('USOIL');
    list.add('EURUSD');
    list.add('GBPUSD');
    return Array.from(list);
  }, [topMoverSymbols]);

  const liveQuotes = useMarketQuotes(allSubscribedSymbols);

  // Update sparklines dynamically as live WebSocket ticks arrive
  useEffect(() => {
    if (!liveQuotes || Object.keys(liveQuotes).length === 0) return;

    setSparklines((prev) => {
      let updated = false;
      const next = { ...prev };

      for (const [sym, quote] of Object.entries(liveQuotes)) {
        if (!quote || quote.bid <= 0) continue;
        const currentPoints = next[sym] || [];
        const lastVal = currentPoints[currentPoints.length - 1];

        if (lastVal !== quote.bid) {
          const newPoints = [...currentPoints, quote.bid].slice(-10);
          next[sym] = newPoints;
          updated = true;
        }
      }

      return updated ? next : prev;
    });
  }, [liveQuotes]);

  // 4. Dynamically compute trading signals from live quotes without continuous spinner
  useEffect(() => {
    if (!isSignalsInitializedRef.current) {
      setIsLoadingSignals(true);
    }
    signalsService
      .fetchSignals(liveQuotes)
      .then((sigList) => {
        setSignals(sigList);
        isSignalsInitializedRef.current = true;
      })
      .catch(() => {})
      .finally(() => {
        setIsLoadingSignals(false);
      });
  }, [liveQuotes]);

  // Render Impact indicator 3 bars
  const renderImpactBars = (impact: string) => {
    const isHigh = impact === 'High';
    const isMedium = impact === 'Medium';
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

        {isLoadingMovers ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#F59E0B" />
            <Text style={styles.loadingText}>Loading live movers…</Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalMoversList}
          >
            {topMoverSymbols.map((sym, idx) => {
              const live =
                liveQuotes[sym] ??
                Object.values(liveQuotes).find((q) => marketSymbolsMatch(q.symbol, sym));

              const symbolMeta = symbols.find((s) => marketSymbolsMatch(s.symbol, sym));
              const defaultFallback = DEFAULT_CATALOG_SYMBOLS.find((d) =>
                marketSymbolsMatch(d.symbol, sym)
              );
              const rawPrice =
                live && live.bid > 0
                  ? live.bid
                  : symbolMeta && symbolMeta.bid > 0
                  ? symbolMeta.bid
                  : defaultFallback?.bid || 0;
              const changePercent =
                live?.changePercent !== undefined
                  ? live.changePercent
                  : symbolMeta?.changePercent !== undefined && symbolMeta.changePercent !== 0
                  ? symbolMeta.changePercent
                  : defaultFallback?.changePercent || 0;
              const isPositive = changePercent >= 0;

              const digits =
                symbolMeta?.digits !== undefined && symbolMeta.digits > 0
                  ? symbolMeta.digits
                  : defaultFallback?.digits !== undefined
                  ? defaultFallback.digits
                  : rawPrice >= 1000
                  ? 2
                  : rawPrice >= 10
                  ? 3
                  : 5;

              const formattedPrice = rawPrice > 0 ? rawPrice.toFixed(digits) : '---';
              const formattedChange = `${isPositive ? '↑' : '↓'} ${Math.abs(
                changePercent
              ).toFixed(2)}%`;

              const displaySymbol =
                sym === 'BTCUSD'
                  ? 'BTC'
                  : sym === 'ETHUSD'
                  ? 'ETH'
                  : sym === 'ETHBTC'
                  ? 'ETH/BTC'
                  : sym === 'BTCUSDT'
                  ? 'BTC/USDT'
                  : sym.includes('/')
                  ? sym
                  : sym.length === 6
                  ? `${sym.slice(0, 3)}/${sym.slice(3)}`
                  : sym;

              // Dynamic sparkline points from live ticks
              const sparkPoints =
                sparklines[sym] && sparklines[sym].length >= 2
                  ? sparklines[sym]
                  : [rawPrice * 0.9995, rawPrice];

              return (
                <TouchableOpacity
                  key={idx}
                  activeOpacity={0.82}
                  style={styles.moverCard}
                  onPress={() => setSelectedChartSymbol(sym)}
                >
                  {/* Symbol Icon & Label */}
                  <View style={styles.moverTopRow}>
                    <SymbolIcon symbol={sym} size={28} />
                    <Text style={styles.moverSymbolName} numberOfLines={1}>
                      {displaySymbol}
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
        )}

        {/* SECTION 2: TRADING SIGNALS */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>TRADING SIGNALS</Text>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.showMoreLink}>Show more</Text>
          </TouchableOpacity>
        </View>

        {isLoadingSignals ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#F59E0B" />
            <Text style={styles.loadingText}>Analyzing market signals…</Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalMoversList}
          >
            {signals.map((sig) => (
              <SignalCard
                key={sig.id}
                signal={sig}
                onPress={() => setSelectedChartSymbol(sig.symbol)}
              />
            ))}
          </ScrollView>
        )}

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
          ) : events.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={32} color="#9CA3AF" />
              <Text style={styles.emptyText}>No upcoming events currently scheduled</Text>
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
          {isLoadingNews ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#F59E0B" />
              <Text style={styles.loadingText}>Loading market news…</Text>
            </View>
          ) : news.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="newspaper-outline" size={32} color="#9CA3AF" />
              <Text style={styles.emptyText}>No market news available at the moment</Text>
            </View>
          ) : (
            news.map((article, index) => {
              const isLast = index === news.length - 1;
              const liveQuote = article.symbolTag
                ? liveQuotes[article.symbolTag] ??
                  Object.values(liveQuotes).find((q) =>
                    marketSymbolsMatch(q.symbol, article.symbolTag!)
                  )
                : undefined;

              const liveChange = liveQuote?.changePercent;
              const isPositive = (liveChange ?? 0) >= 0;

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

                    {/* Meta row: Symbol Tag + live change from WebSocket + time ago */}
                    <View style={styles.newsMetaRow}>
                      {article.symbolTag && (
                        <View style={styles.newsSymbolPill}>
                          <Text style={styles.newsSymbolText}>
                            {article.symbolTag}
                          </Text>
                          {liveChange !== undefined && (
                            <Text
                              style={[
                                styles.newsChangeText,
                                {
                                  color: isPositive ? '#2563EB' : '#DC2626',
                                },
                              ]}
                            >
                              {isPositive ? '↑' : '↓'}{' '}
                              {Math.abs(liveChange).toFixed(2)}%
                            </Text>
                          )}
                        </View>
                      )}
                      <Text style={styles.newsTimeAgo}>{article.timeAgo}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
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
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 13,
    color: '#6B7280',
  },
  emptyContainer: {
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 8,
    fontSize: 13,
    color: '#9CA3AF',
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
