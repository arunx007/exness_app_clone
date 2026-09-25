import React from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMarketsViewModel } from '../../viewmodels';
import { useTheme } from '../../theme';
import { Header } from '../../components/common/Header';
import { MarketRow } from '../../components/cards/MarketRow';
import { Ionicons } from '@expo/vector-icons';

export const MarketsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { colors, brand, spacing, borderRadius, typography } = useTheme();
  const {
    symbols,
    categories,
    selectedCategory,
    searchQuery,
    setSelectedCategory,
    setSearchQuery,
  } = useMarketsViewModel();

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <Header title="Markets" subtitle="Live Watchlist & Quotes" />

      {/* Search Bar */}
      <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.sm }}>
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: colors.inputBg,
              borderColor: colors.border,
              borderRadius: borderRadius.md,
              paddingHorizontal: spacing.md,
            },
          ]}
        >
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            placeholder="Search instruments (e.g. XAUUSD, EURUSD)"
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchInput, { color: colors.textPrimary, marginLeft: spacing.sm }]}
          />
        </View>
      </View>

      {/* Categories chips */}
      <View style={{ marginVertical: spacing.md }}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          keyExtractor={(item) => item}
          contentContainerStyle={{ paddingHorizontal: spacing.lg }}
          renderItem={({ item }) => {
            const isSelected = item === selectedCategory;
            return (
              <TouchableOpacity
                onPress={() => setSelectedCategory(item)}
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor: isSelected ? brand.yellow : colors.surfaceSubtle,
                    borderRadius: borderRadius.full,
                    marginRight: spacing.sm,
                    paddingHorizontal: spacing.md,
                    paddingVertical: 6,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.categoryText,
                    {
                      color: isSelected ? brand.black : colors.textSecondary,
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Instrument List */}
      <FlatList
        data={symbols}
        keyExtractor={(item) => item.symbol}
        renderItem={({ item }) => <MarketRow item={item} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={{ color: colors.textMuted }}>No instruments found</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 42,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  categoryChip: {},
  categoryText: {
    fontSize: 13,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
});
