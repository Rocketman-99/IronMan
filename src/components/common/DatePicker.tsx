import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../utils/theme';
import { t } from '../../i18n/ko';

/**
 * 의존성 없는 달력 선택기.
 *
 * 날짜를 전부 YYYY-MM-DD 로 손으로 치게 하던 걸 대체한다. 네이티브 날짜 선택기
 * (@react-native-community/datetimepicker)를 쓰면 APK 재빌드가 필요하므로,
 * RN 기본 요소만으로 만들어 `eas update` 로 나갈 수 있게 했다.
 *
 * 값은 앱 전체와 같은 KST 기준 'YYYY-MM-DD' 문자열이다.
 */

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** 비우기 버튼을 보일지. 선택 항목인 날짜에 쓴다. */
  clearable?: boolean;
}

function todayKST(): Date {
  return new Date(Date.now() + 9 * 60 * 60 * 1000);
}

function toISO(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export function DatePicker({ value, onChange, placeholder, clearable = false }: DatePickerProps) {
  const [open, setOpen] = useState(false);

  // 달력이 열릴 때 보여줄 달 — 값이 있으면 그 달, 없으면 이번 달
  const initial = value ? new Date(value + 'T00:00:00+09:00') : todayKST();
  const safeInitial = Number.isNaN(initial.getTime()) ? todayKST() : initial;
  const [year, setYear] = useState(safeInitial.getUTCFullYear());
  const [month, setMonth] = useState(safeInitial.getUTCMonth());
  /** 연도 목록을 펼친 상태. 생년월일처럼 수십 년 전을 고를 때 필요하다. */
  const [pickingYear, setPickingYear] = useState(false);

  const firstWeekday = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const todayISO = todayKST().toISOString().slice(0, 10);

  const cells: (number | null)[] = [
    ...Array<null>(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  function shiftMonth(delta: number) {
    const next = new Date(Date.UTC(year, month + delta, 1));
    setYear(next.getUTCFullYear());
    setMonth(next.getUTCMonth());
  }

  function pick(day: number) {
    onChange(toISO(year, month, day));
    setOpen(false);
  }

  // 최근 연도가 위로 오게 내림차순. 목표일(가까운 미래)과 생년월일(과거) 둘 다
  // 이 목록 하나로 닿는다.
  const thisYear = todayKST().getUTCFullYear();
  const yearOptions = Array.from({ length: 111 }, (_, i) => thisYear + 10 - i);

  function openCalendar() {
    setOpen(true);
    setPickingYear(false);
  }

  return (
    <>
      <TouchableOpacity style={styles.field} onPress={openCalendar} activeOpacity={0.7}>
        <Text style={[styles.fieldText, !value && styles.fieldPlaceholder]}>
          {value || placeholder || t.profile.birthDateFormat}
        </Text>
        <Ionicons name="calendar-outline" size={18} color={colors.textMuted} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setOpen(false)}>
          {/* 달력 본체를 눌렀을 때 닫히지 않도록 이벤트를 막는다 */}
          <TouchableOpacity style={styles.sheet} activeOpacity={1} onPress={() => {}}>
            <View style={styles.header}>
              <TouchableOpacity
                testID="datepicker-prev"
                onPress={() => shiftMonth(-1)}
                style={[styles.navBtn, pickingYear && styles.navBtnHidden]}
                disabled={pickingYear}
              >
                <Ionicons name="chevron-back" size={20} color={colors.text} />
              </TouchableOpacity>
              {/* 라벨을 누르면 연도 목록. 달 화살표만으로는 생년월일에 닿을 수 없다. */}
              <TouchableOpacity onPress={() => setPickingYear((v) => !v)} style={styles.monthBtn}>
                <Text style={styles.monthLabel}>
                  {t.datePicker.yearMonth.replace('{y}', String(year)).replace('{m}', String(month + 1))}
                </Text>
                <Ionicons
                  name={pickingYear ? 'chevron-up' : 'chevron-down'}
                  size={14}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
              <TouchableOpacity
                testID="datepicker-next"
                onPress={() => shiftMonth(1)}
                style={[styles.navBtn, pickingYear && styles.navBtnHidden]}
                disabled={pickingYear}
              >
                <Ionicons name="chevron-forward" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            {pickingYear ? (
              <ScrollView style={styles.yearList}>
                <View style={styles.yearGrid}>
                  {yearOptions.map((y) => (
                    <TouchableOpacity
                      key={y}
                      style={[styles.yearCell, y === year && styles.cellSelected]}
                      onPress={() => {
                        setYear(y);
                        setPickingYear(false);
                      }}
                    >
                      <Text style={[styles.cellText, y === year && styles.cellTextSelected]}>{y}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            ) : (
              <>
                <View style={styles.weekRow}>
                  {t.weekday.map((w) => (
                    <Text key={w} style={styles.weekday}>
                      {w}
                    </Text>
                  ))}
                </View>

                <View style={styles.grid}>
                  {cells.map((day, i) => {
                    if (day === null) return <View key={`b${i}`} style={styles.cell} />;
                    const iso = toISO(year, month, day);
                    const selected = iso === value;
                    const isToday = iso === todayISO;
                    return (
                      <TouchableOpacity
                        key={iso}
                        style={[styles.cell, selected && styles.cellSelected]}
                        onPress={() => pick(day)}
                      >
                        <Text
                          style={[
                            styles.cellText,
                            isToday && styles.cellToday,
                            selected && styles.cellTextSelected,
                          ]}
                        >
                          {day}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.action}
                onPress={() => {
                  onChange(todayISO);
                  setOpen(false);
                }}
              >
                <Text style={styles.actionText}>{t.datePicker.today}</Text>
              </TouchableOpacity>
              {clearable && (
                <TouchableOpacity
                  style={styles.action}
                  onPress={() => {
                    onChange('');
                    setOpen(false);
                  }}
                >
                  <Text style={styles.actionText}>{t.datePicker.clear}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.action} onPress={() => setOpen(false)}>
                <Text style={styles.actionText}>{t.common.cancel}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldText: { fontSize: 15, color: colors.text },
  fieldPlaceholder: { color: colors.textMuted },
  backdrop: {
    flex: 1,
    backgroundColor: '#000000AA',
    justifyContent: 'center',
    padding: 24,
  },
  sheet: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  navBtn: { padding: 8 },
  navBtnHidden: { opacity: 0 },
  monthBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4 },
  monthLabel: { color: colors.text, fontSize: 16, fontWeight: '700' },
  yearList: { maxHeight: 240 },
  yearGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  yearCell: {
    width: `${100 / 3}%`,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  weekRow: { flexDirection: 'row', marginBottom: 4 },
  weekday: { flex: 1, textAlign: 'center', color: colors.textMuted, fontSize: 11, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  cellSelected: { backgroundColor: colors.primary },
  cellText: { color: colors.text, fontSize: 14 },
  cellToday: { color: colors.gold, fontWeight: '800' },
  cellTextSelected: { color: '#fff', fontWeight: '800' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 4, marginTop: 8 },
  action: { paddingHorizontal: 14, paddingVertical: 10 },
  actionText: { color: colors.primary, fontWeight: '700', fontSize: 14 },
});
