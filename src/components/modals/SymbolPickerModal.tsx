import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  FlatList,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SymbolIcon } from '../common/SymbolIcon';
import { DEFAULT_CATALOG_SYMBOLS, CatalogSymbol } from '../../constants/symbolsCatalog';
import { useMarketQuotes } from '../../hooks/useMarketQuotes';
import { marketSymbolsMatch } from '../../utils/symbol';

interface SymbolPickerModalProps {
  visible: boolean;
  selectedSymbol: string;
  onSelectSymbol: (symbol: string) => void;
  onClose: () => void;
}

export const SymbolPickerModal: React.FC<SymbolPickerModalProps> = ({
  visible,
  selectedSymbol,
  onSelectSymbol,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const catalogSymbols = useMemo(() => DEFAULT_CATALOG_SYMBOLS.map((s) => s.symbol), []);
  const liveQuotes = useMarketQuotes(catalogSymbols);

  const filteredSymbols = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return DEFAULT_CATALOG_SYMBOLS;
    return DEFAULT_CATALOG_SYMBOLS.filter(
      (item) =>
        item.symbol.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q),
    );
  }, [search]);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.handleBar} />
            <View style={styles.headerRow}>
              <Text style={styles.title}>Select Instrument</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
                <Ionicons name="close" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Search bar */}
          <View style={styles.searchBarContainer}>
            <Ionicons name="search" size={17} color="#9CA3AF" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search pairs, coins, metals..."
              placeholderTextColor="#9CA3AF"
              value={search}
              onChangeText={setSearch}
              autoCorrect={false}
              autoCapitalize="characters"
              clearButtonMode="while-editing"
            />
          </View>

          {/* List of symbols */}
          <FlatList
            data={filteredSymbols}
            keyExtractor={(item) => item.symbol}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              const isSelected = marketSymbolsMatch(item.symbol, selectedSymbol);
              const live = liveQuotes[item.symbol];
              const price = live && live.bid > 0 ? live.bid : item.bid;
              const change = live?.changePercent !== undefined ? live.changePercent : item.changePercent;
              const isPositive = change >= 0;

              return (
                <TouchableOpacity
                  style={[styles.symbolRow, isSelected && styles.symbolRowSelected]}
                  activeOpacity={0.75}
                  onPress={() => {
                    onSelectSymbol(item.symbol);
                    onClose();
                  }}
                >
                  <View style={styles.symbolLeft}>
                    <SymbolIcon symbol={item.symbol} size={36} />
                    <View style={styles.symbolInfo}>
                      <View style={styles.symbolNameRow}>
                        <Text style={styles.symbolText}>{item.symbol}</Text>
                        {isSelected && (
                          <View style={styles.selectedBadge}>
                            <Text style={styles.selectedBadgeText}>Active</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.symbolSubtitle} numberOfLines={1}>
                        {item.name}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.symbolRight}>
                    <Text style={styles.priceText}>
                      {price.toFixed(item.digits)}
                    </Text>
                    <Text
                      style={[
                        styles.changeText,
                        { color: isPositive ? '#10B981' : '#EF4444' },
                      ]}
                    >
                      {isPositive ? '+' : ''}
                      {change.toFixed(2)}%
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: Dimensions.get('window').height * 0.75,
    minHeight: Dimensions.get('window').height * 0.5,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
    alignItems: 'center',
  },
  handleBar: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  closeBtn: {
    padding: 4,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    height: 42,
    borderRadius: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14.5,
    color: '#111827',
    paddingVertical: 0,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  symbolRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 4,
  },
  symbolRowSelected: {
    backgroundColor: '#EFF6FF',
  },
  symbolLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  symbolInfo: {
    marginLeft: 12,
    flex: 1,
  },
  symbolNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  symbolText: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#111827',
  },
  selectedBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    marginLeft: 6,
  },
  selectedBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#1D4ED8',
  },
  symbolSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 1,
  },
  symbolRight: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  priceText: {
    fontSize: 14.5,
    fontWeight: '600',
    color: '#111827',
    fontVariant: ['tabular-nums'],
  },
  changeText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
});
