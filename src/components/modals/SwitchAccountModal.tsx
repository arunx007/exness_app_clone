import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export interface AccountItem {
  id: string;
  accountNumber: string;
  type: 'Demo' | 'Real';
  server: string;
  plan: string;
  balance: string;
  currency: string;
}

interface SwitchAccountModalProps {
  visible: boolean;
  accounts: AccountItem[];
  activeAccountId: string;
  onSelectAccount: (account: AccountItem) => void;
  onOpenNewAccount: () => void;
  onClose: () => void;
}

export const SwitchAccountModal: React.FC<SwitchAccountModalProps> = ({
  visible,
  accounts,
  activeAccountId,
  onSelectAccount,
  onOpenNewAccount,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const [selectedTab, setSelectedTab] = useState<'Demo' | 'Real'>('Demo');

  const filteredAccounts = accounts.filter((acc) => acc.type === selectedTab);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.sheetContainer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Accounts</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={22} color="#111827" />
            </TouchableOpacity>
          </View>

          {/* Real vs Demo Segmented Tabs */}
          <View style={styles.tabsWrapper}>
            <TouchableOpacity
              style={[styles.tabBtn, selectedTab === 'Demo' && styles.tabBtnActive]}
              activeOpacity={0.8}
              onPress={() => setSelectedTab('Demo')}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  selectedTab === 'Demo' ? styles.tabBtnTextActive : styles.tabBtnTextInactive,
                ]}
              >
                Demo
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, selectedTab === 'Real' && styles.tabBtnActive]}
              activeOpacity={0.8}
              onPress={() => setSelectedTab('Real')}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  selectedTab === 'Real' ? styles.tabBtnTextActive : styles.tabBtnTextInactive,
                ]}
              >
                Real
              </Text>
            </TouchableOpacity>
          </View>

          {/* Accounts List */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          >
            {filteredAccounts.map((item) => {
              const isActive = item.id === activeAccountId;

              return (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.75}
                  onPress={() => {
                    onSelectAccount(item);
                    onClose();
                  }}
                  style={[styles.accountCard, isActive && styles.accountCardSelected]}
                >
                  <View style={styles.cardLeft}>
                    <Text style={styles.accountNumber}>
                      {item.plan} # {item.accountNumber}
                    </Text>

                    {/* Chips */}
                    <View style={styles.chipsRow}>
                      <View
                        style={[
                          styles.chip,
                          item.type === 'Demo' ? styles.demoChip : styles.realChip,
                        ]}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            item.type === 'Demo' ? styles.demoChipText : styles.realChipText,
                          ]}
                        >
                          {item.type}
                        </Text>
                      </View>

                      <View style={styles.chip}>
                        <Text style={styles.chipText}>{item.server}</Text>
                      </View>

                      <View style={styles.chip}>
                        <Text style={styles.chipText}>{item.plan}</Text>
                      </View>
                    </View>

                    {/* Balance */}
                    <Text style={styles.balance}>
                      {item.balance} {item.currency}
                    </Text>
                  </View>

                  {/* Active Selection Checkmark */}
                  {isActive ? (
                    <View style={styles.checkCircle}>
                      <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    </View>
                  ) : (
                    <View style={styles.emptyCircle} />
                  )}
                </TouchableOpacity>
              );
            })}

            {/* Open New Account Button */}
            <TouchableOpacity
              style={styles.openNewBtn}
              activeOpacity={0.8}
              onPress={() => {
                onClose();
                onOpenNewAccount();
              }}
            >
              <Ionicons name="add" size={20} color="#111827" style={{ marginRight: 8 }} />
              <Text style={styles.openNewBtnText}>Open new account</Text>
            </TouchableOpacity>
          </ScrollView>
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
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsWrapper: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  tabBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tabBtnTextActive: {
    color: '#111827',
  },
  tabBtnTextInactive: {
    color: '#6B7280',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    padding: 16,
    marginBottom: 12,
  },
  accountCardSelected: {
    borderColor: '#111827',
  },
  cardLeft: {
    flex: 1,
  },
  accountNumber: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 6,
  },
  chipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  chip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 6,
  },
  demoChip: {
    backgroundColor: '#E6F7EC',
  },
  realChip: {
    backgroundColor: '#FFF8E1',
  },
  chipText: {
    fontSize: 11,
    color: '#4B5563',
    fontWeight: '600',
  },
  demoChipText: {
    color: '#0A8754',
  },
  realChipText: {
    color: '#B45309',
  },
  balance: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  checkCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  emptyCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    marginLeft: 12,
  },
  openNewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#D1D5DB',
    borderRadius: 16,
    paddingVertical: 14,
    marginTop: 8,
  },
  openNewBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
});
