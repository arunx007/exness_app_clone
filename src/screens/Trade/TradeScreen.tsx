import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Dimensions,
  Modal,
  ActivityIndicator,
  TextInput,
  RefreshControl,
  FlatList,
  ViewToken,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { SparklineChart } from '../../components/common/SparklineChart';
import { SymbolIcon } from '../../components/common/SymbolIcon';
import { useAccount } from '../../context/AccountContext';
import {
  SwitchAccountModal,
  OpenAccountModal,
} from '../../components/modals';
import { ChartScreen } from '../Chart/ChartScreen';
import { mt5TradingService } from '../../api/mt5/tradingService';
import { Mt5Position } from '../../api/mt5/types';
import { useMarketQuotes } from '../../hooks/useMarketQuotes';
import { DEFAULT_CATALOG_SYMBOLS, CatalogSymbol } from '../../constants/symbolsCatalog';
import { symbolDisplayName, marketSymbolsMatch } from '../../utils/symbol';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CATEGORY_TABS = [
  'Favorites',
  'Most traded',
  'Top Movers',
  'Majors',
  'Crypto',
  'Forex',
  'Metals',
];

function inferCategory(symbol: string): string {
  const upper = symbol.toUpperCase().replace('/', '');
  if (['XAU', 'XAG', 'GOLD', 'SILVER'].some((m) => upper.includes(m))) return 'Metals';
  if (['BTC', 'ETH', 'SOL', 'XRP', 'DOG', 'BNB', 'USDT'].some((c) => upper.includes(c))) return 'Crypto';
  if (['OIL', 'USOIL', 'BRENT'].some((o) => upper.includes(o))) return 'Commodities';
  if (['30', '100', '500', 'NAS', 'SPX', 'DOW'].some((i) => upper.includes(i))) return 'Indices';
  return 'Forex';
}

function formatPrice(price: number, digits: number): string {
  if (!Number.isFinite(price) || price <= 0) return '---';
  const effectiveDigits = Math.min(Math.max(digits, 2), 5);
  return price.toFixed(effectiveDigits);
}

export const TradeScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { accounts, activeAccount, setActiveAccount, addAccount } = useAccount();
  const isFocused = useIsFocused();

  const [activeTab, setActiveTab] = useState<string>('Favorites');
  const [catalog, setCatalog] = useState<CatalogSymbol[]>(DEFAULT_CATALOG_SYMBOLS);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);

  const [showSwitchAccount, setShowSwitchAccount] = useState<boolean>(false);
  const [showOpenAccount, setShowOpenAccount] = useState<boolean>(false);
  const [selectedChartSymbol, setSelectedChartSymbol] = useState<string | null>(null);

  const [positions, setPositions] = useState<Mt5Position[]>([]);
  const [sparklines, setSparklines] = useState<Record<string, number[]>>({});
  const [visibleSymbols, setVisibleSymbols] = useState<string[]>([]);

  // Filter instruments based on active tab and search query
  const filteredSymbols = useMemo(() => {
    let list = catalog;

    // Filter by category tab
    if (activeTab === 'Favorites') {
      const favoriteSymbols = ['BTCUSD', 'XAUUSD', 'EURUSD', 'GBPUSD', 'ETHUSD', 'USDJPY', 'SOLUSD', 'XAGUSD'];
      list = list.filter((s) => favoriteSymbols.some((fav) => marketSymbolsMatch(s.symbol, fav)));
    } else if (activeTab === 'Most traded') {
      const popularSymbols = ['XAUUSD', 'EURUSD', 'BTCUSD', 'GBPUSD', 'USDJPY', 'USOIL', 'ETHUSD'];
      list = list.filter((s) => popularSymbols.some((pop) => marketSymbolsMatch(s.symbol, pop)));
    } else if (activeTab === 'Top Movers') {
      list = [...list].sort((a, b) => {
        const qA = a.changePercent;
        const qB = b.changePercent;
        return Math.abs(qB) - Math.abs(qA);
      });
    } else if (activeTab === 'Majors') {
      const majors = ['EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'AUDUSD', 'USDCAD', 'NZDUSD'];
      list = list.filter((s) => majors.some((maj) => marketSymbolsMatch(s.symbol, maj)));
    } else if (activeTab === 'Crypto') {
      list = list.filter((s) => inferCategory(s.symbol) === 'Crypto');
    } else if (activeTab === 'Forex') {
      list = list.filter((s) => inferCategory(s.symbol) === 'Forex');
    } else if (activeTab === 'Metals') {
      list = list.filter((s) => inferCategory(s.symbol) === 'Metals');
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      list = list.filter(
        (s) =>
          s.symbol.toLowerCase().includes(query) ||
          s.name.toLowerCase().includes(query) ||
          symbolDisplayName(s.symbol).toLowerCase().includes(query)
      );
    }

    // Deduplicate base symbols so suffixed variants don't clutter the same tab
    const seen = new Set<string>();
    const deduplicated: CatalogSymbol[] = [];
    for (const item of list) {
      const base = item.symbol.toUpperCase().split('.')[0].replace(/[^A-Z0-9]/g, '');
      if (!seen.has(base)) {
        seen.add(base);
        deduplicated.push(item);
      }
    }

    return deduplicated;
  }, [catalog, activeTab, searchQuery]);

  // Viewport-based visibility tracking (ONLY subscribe to symbols visible on screen)
  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 15,
    minimumViewTime: 80,
  }).current;

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: Array<ViewToken> }) => {
      const visible = viewableItems
        .map((v) => (v.item as CatalogSymbol)?.symbol)
        .filter((s): s is string => typeof s === 'string' && Boolean(s));

      if (visible.length > 0) {
        setVisibleSymbols(visible);
      }
    }
  ).current;

  // On tab switch or search change, prime visibleSymbols with the visible window
  useEffect(() => {
    if (filteredSymbols.length > 0) {
      setVisibleSymbols(filteredSymbols.slice(0, 7).map((s) => s.symbol));
    }
  }, [activeTab, searchQuery, filteredSymbols.length]);

  // Active subscribed symbols: strictly symbols currently in viewport
  const activeSubscribedSymbols = useMemo(() => {
    if (visibleSymbols.length > 0) {
      const valid = visibleSymbols.filter((sym) =>
        filteredSymbols.some((item) => marketSymbolsMatch(item.symbol, sym))
      );
      if (valid.length > 0) return valid;
    }
    return filteredSymbols.slice(0, 7).map((s) => s.symbol);
  }, [visibleSymbols, filteredSymbols]);

  const liveQuotes = useMarketQuotes(activeSubscribedSymbols);

  // Reset chart symbol if switching tabs
  useEffect(() => {
    if (!isFocused) {
      setSelectedChartSymbol(null);
    }
  }, [isFocused]);

  // Load symbols from MT5 API
  const loadSymbols = useCallback(async () => {
    try {
      const res = await mt5TradingService.getSymbols();
      if (res && res.length > 0) {
        const mapped: CatalogSymbol[] = res.map((s) => {
          const defaultFallback = DEFAULT_CATALOG_SYMBOLS.find((d) =>
            marketSymbolsMatch(d.symbol, s.symbol)
          );
          const bid = s.bid > 0 ? s.bid : (defaultFallback?.bid ?? 0);
          const ask = s.ask > 0 ? s.ask : (defaultFallback?.ask ?? bid);
          const changePercent = s.changePercent !== 0 ? s.changePercent : (defaultFallback?.changePercent ?? 0);
          const digits = s.digits > 0 ? s.digits : (defaultFallback?.digits ?? 2);
          const initialSparkline = defaultFallback?.initialSparkline ?? (bid > 0 ? [
            bid * 0.9985,
            bid * 0.9992,
            bid * 0.9989,
            bid * 1.0004,
            bid * 1.0001,
            bid,
          ] : undefined);

          return {
            id: s.symbol.toLowerCase(),
            symbol: s.symbol,
            name: s.description || symbolDisplayName(s.symbol),
            category: s.category || inferCategory(s.symbol),
            bid,
            ask,
            spread: s.spread || (defaultFallback?.spread ?? 0),
            changePercent,
            digits,
            initialSparkline,
          };
        });
        setCatalog(mapped);
      }
    } catch {
      // Offline or MT5 not yet authenticated; use default catalog
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Fetch active positions for active account to show order banners
  const fetchPositions = useCallback(async () => {
    try {
      const livePositions = await mt5TradingService.getPositions();
      setPositions(livePositions);
    } catch {
      setPositions([]);
    }
  }, []);

  useEffect(() => {
    loadSymbols();
  }, [loadSymbols, activeAccount.id]);

  useEffect(() => {
    if (isFocused) {
      fetchPositions();
    }
  }, [isFocused, activeAccount.id, fetchPositions]);

  // Update sparklines when live ticks arrive
  useEffect(() => {
    const entries = Object.entries(liveQuotes);
    if (entries.length === 0) return;

    setSparklines((prev) => {
      let changed = false;
      const next = { ...prev };

      for (const [sym, quote] of entries) {
        const mid = (quote.bid + quote.ask) / 2 || quote.bid;
        if (mid > 0) {
          const currentSeries = next[sym] ?? [];
          const lastPoint = currentSeries[currentSeries.length - 1];
          if (lastPoint !== mid) {
            const updated = currentSeries.length === 0
              ? [mid * 0.9995, mid]
              : [...currentSeries.slice(-20), mid];
            next[sym] = updated;
            changed = true;
          }
        }
      }

      return changed ? next : prev;
    });
  }, [liveQuotes]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadSymbols();
    fetchPositions();
  }, [loadSymbols, fetchPositions]);

  // Active positions summary per symbol
  const getSymbolTradeSummary = useCallback(
    (symbol: string) => {
      const matched = positions.filter((p) => marketSymbolsMatch(p.symbol, symbol));
      if (matched.length === 0) return null;
      const count = matched.length;
      const profit = matched.reduce((sum, p) => sum + (p.profit || 0), 0);
      return {
        count,
        profit,
        isLoss: profit < 0,
      };
    },
    [positions]
  );

  const renderInstrumentCard = useCallback(
    ({ item }: { item: CatalogSymbol }) => {
      const live =
        liveQuotes[item.symbol] ??
        Object.values(liveQuotes).find((q) => marketSymbolsMatch(q.symbol, item.symbol));
      const rawPrice = live && live.bid > 0 ? live.bid : item.bid;
      const formattedPrice = formatPrice(rawPrice, item.digits);

      const changePercent =
        live?.changePercent !== undefined ? live.changePercent : item.changePercent;
      const isPositive = changePercent >= 0;
      const formattedChange = `${isPositive ? '+' : ''}${changePercent.toFixed(2)}%`;

      // Dynamic sparkline from real ticks or fallback
      const itemSparkline =
        sparklines[item.symbol] && sparklines[item.symbol].length >= 2
          ? sparklines[item.symbol]
          : item.initialSparkline || [rawPrice * 0.999, rawPrice];

      const tradeSummary = getSymbolTradeSummary(item.symbol);

      return (
        <TouchableOpacity
          key={item.id || item.symbol}
          activeOpacity={0.85}
          style={styles.instrumentCard}
          onPress={() => setSelectedChartSymbol(item.symbol)}
        >
          {/* Top row of card */}
          <View style={styles.cardMainRow}>
            {/* Left Column: Dynamic SymbolIcon + Symbol Name + Subtitle */}
            <View style={styles.cardLeft}>
              <SymbolIcon symbol={item.symbol} size={34} />

              {/* Symbol & Subtitle */}
              <View style={styles.symbolInfo}>
                <View style={styles.symbolHeaderRow}>
                  <Text style={styles.symbolText}>
                    {item.symbol.includes('.') ? item.symbol.split('.')[0] : item.symbol}
                  </Text>
                  {live && <View style={styles.liveIndicatorDot} />}
                </View>
                <Text
                  style={styles.instrumentSubtitle}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {item.name || symbolDisplayName(item.symbol)}
                </Text>
              </View>
            </View>

            {/* Middle Column: Live Sparkline Chart */}
            <View style={styles.cardCenter}>
              <SparklineChart
                points={itemSparkline}
                isPositive={isPositive}
                width={78}
                height={28}
              />
            </View>

            {/* Right Column: Live Price & 24h Change */}
            <View style={styles.cardRight}>
              <Text style={styles.priceText}>{formattedPrice}</Text>
              <View style={styles.changeRow}>
                <Text
                  style={[
                    styles.changeText,
                    { color: isPositive ? '#2563EB' : '#EF4444' },
                  ]}
                >
                  {isPositive ? '↑' : '↓'} {formattedChange}
                </Text>
              </View>
            </View>
          </View>

          {/* Bottom active order banner (if any) */}
          {tradeSummary && (
            <View
              style={[
                styles.activeOrderBanner,
                tradeSummary.isLoss ? styles.orderBannerLoss : styles.orderBannerProfit,
              ]}
            >
              <Text style={styles.activeOrderLabel}>
                Orders {tradeSummary.count}
              </Text>
              <Text
                style={[
                  styles.activeOrderPnl,
                  { color: tradeSummary.isLoss ? '#DC2626' : '#16A34A' },
                ]}
              >
                {tradeSummary.isLoss ? 'Loss ' : 'Profit '}
                {tradeSummary.profit >= 0 ? '+' : ''}
                {tradeSummary.profit.toFixed(2)} USD
              </Text>
            </View>
          )}
        </TouchableOpacity>
      );
    },
    [liveQuotes, sparklines, getSymbolTradeSummary]
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* TOP BAR: Centered Account Badge & Right Clock Icon */}
      <View style={styles.topBar}>
        {/* Centered Account Selector Pill */}
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
                activeAccount.type === 'Demo' ? styles.demoChipText : styles.realChipText,
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

        {/* Right Clock Icon */}
        <TouchableOpacity style={styles.clockBtn} activeOpacity={0.7}>
          <Ionicons name="time-outline" size={24} color="#111827" />
        </TouchableOpacity>
      </View>

      {/* SCREEN TITLE: "Trade" */}
      <View style={styles.titleRow}>
        <Text style={styles.screenTitle}>Trade</Text>
      </View>

      {/* SEARCH BAR (Expandable) */}
      {isSearchOpen && (
        <View style={styles.searchBarContainer}>
          <Ionicons name="search-outline" size={18} color="#6B7280" style={styles.searchBarIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search instruments or currencies..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
            autoCapitalize="none"
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchBtn}>
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => {
              setIsSearchOpen(false);
              setSearchQuery('');
            }}
            style={styles.cancelSearchBtn}
          >
            <Text style={styles.cancelSearchText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* HORIZONTAL CATEGORY TABS & SEARCH ICON */}
      <View style={styles.tabsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScrollView}
        >
          {CATEGORY_TABS.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tabButton, isActive && styles.tabButtonActive]}
                activeOpacity={0.8}
                onPress={() => setActiveTab(tab)}
              >
                <Text
                  style={[
                    styles.tabButtonText,
                    isActive ? styles.tabTextActive : styles.tabTextInactive,
                  ]}
                >
                  {tab}
                </Text>
                {isActive && <View style={styles.tabIndicator} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Search Icon */}
        <TouchableOpacity
          style={styles.searchBtn}
          activeOpacity={0.7}
          onPress={() => setIsSearchOpen(!isSearchOpen)}
        >
          <Ionicons
            name={isSearchOpen ? 'close-outline' : 'search-outline'}
            size={22}
            color="#111827"
          />
        </TouchableOpacity>
      </View>
      <View style={styles.tabsDivider} />

      {/* FILTER SUB-BAR: "Sorted manually" & "Edit ✎" */}
      <View style={styles.filterRow}>
        <View style={styles.filterPill}>
          <Text style={styles.filterPillText}>
            {activeTab === 'Top Movers' ? 'Sorted by volatility' : 'Sorted manually'}
          </Text>
        </View>

        <TouchableOpacity style={styles.editPill} activeOpacity={0.7}>
          <Text style={styles.editPillText}>Edit</Text>
          <Ionicons name="create-outline" size={15} color="#111827" style={{ marginLeft: 4 }} />
        </TouchableOpacity>
      </View>

      {/* INSTRUMENTS LIST / LOADING STATE */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F59E0B" />
          <Text style={styles.loadingText}>Loading market data...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredSymbols}
          keyExtractor={(item) => item.id || item.symbol}
          renderItem={renderInstrumentCard}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.instrumentsList}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          initialNumToRender={7}
          maxToRenderPerBatch={8}
          windowSize={5}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#F59E0B"
              colors={['#F59E0B']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="search" size={40} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No instruments found</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery ? `No results for "${searchQuery}"` : 'No instruments in this category'}
              </Text>
            </View>
          }
        />
      )}

      {/* Switch Account Modal */}
      <SwitchAccountModal
        visible={showSwitchAccount}
        accounts={accounts}
        activeAccountId={activeAccount.id}
        onSelectAccount={(account) => setActiveAccount(account)}
        onOpenNewAccount={() => setShowOpenAccount(true)}
        onClose={() => setShowSwitchAccount(false)}
      />

      {/* Open Account Modal with 3-Step Wizard */}
      <OpenAccountModal
        visible={showOpenAccount}
        onClose={() => setShowOpenAccount(false)}
        onAccountCreated={(newAccount) => {
          addAccount(newAccount);
        }}
      />

      {/* Chart Screen Full Modal */}
      {selectedChartSymbol && (
        <Modal
          visible={true}
          animationType="slide"
          onRequestClose={() => setSelectedChartSymbol(null)}
        >
          <ChartScreen
            symbol={selectedChartSymbol}
            onClose={() => setSelectedChartSymbol(null)}
          />
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 4,
    position: 'relative',
  },
  accountPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    paddingVertical: 5,
    paddingLeft: 6,
    paddingRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  accountTypeChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginRight: 8,
  },
  demoChip: {
    backgroundColor: '#E6F7EC',
  },
  realChip: {
    backgroundColor: '#FFF8E1',
  },
  accountTypeChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  demoChipText: {
    color: '#0A8754',
  },
  realChipText: {
    color: '#B45309',
  },
  accountBalanceText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  clockBtn: {
    position: 'absolute',
    right: 16,
    padding: 6,
  },
  titleRow: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
  },
  screenTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.8,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    paddingHorizontal: 10,
    height: 42,
  },
  searchBarIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    paddingVertical: 0,
  },
  clearSearchBtn: {
    padding: 4,
  },
  cancelSearchBtn: {
    marginLeft: 8,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  cancelSearchText: {
    fontSize: 14,
    color: '#F59E0B',
    fontWeight: '600',
  },
  tabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
  },
  tabsScrollView: {
    paddingHorizontal: 16,
  },
  tabButton: {
    paddingVertical: 8,
    marginRight: 22,
    position: 'relative',
  },
  tabButtonActive: {},
  tabButtonText: {
    fontSize: 15,
  },
  tabTextActive: {
    fontWeight: '700',
    color: '#111827',
  },
  tabTextInactive: {
    fontWeight: '500',
    color: '#6B7280',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#111827',
  },
  searchBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tabsDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    width: '100%',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterPill: {
    backgroundColor: '#F4F4F6',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 10,
  },
  filterPillText: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '500',
  },
  editPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F4F6',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  editPillText: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  instrumentsList: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  instrumentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    padding: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  cardMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1.2,
  },
  symbolInfo: {
    justifyContent: 'center',
    marginLeft: 10,
    flex: 1,
  },
  symbolHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  symbolText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  liveIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginLeft: 6,
  },
  instrumentSubtitle: {
    fontSize: 12.5,
    color: '#8E95A2',
    marginTop: 2,
  },
  cardCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  cardRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  priceText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    fontVariant: ['tabular-nums'],
  },
  changeRow: {
    marginTop: 2,
  },
  changeText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  activeOrderBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 10,
  },
  orderBannerProfit: {
    backgroundColor: '#F0FDF4',
  },
  orderBannerLoss: {
    backgroundColor: '#FEF2F2',
  },
  activeOrderLabel: {
    fontSize: 12.5,
    color: '#1F2937',
    fontWeight: '500',
  },
  activeOrderPnl: {
    fontSize: 12.5,
    fontWeight: '600',
  },
});
