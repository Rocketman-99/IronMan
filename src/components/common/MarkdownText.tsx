import React from 'react';
import { View, Text, StyleSheet, type StyleProp, type TextStyle } from 'react-native';
import { colors } from '../../utils/theme';

/**
 * AI 응답에 섞여 오는 마크다운을 렌더한다.
 *
 * 모델은 `**굵게**`, `# 제목`, `- 목록` 을 자연스럽게 쓰는데, 그냥 <Text> 에 넣으면
 * 기호가 그대로 보인다. 라이브러리를 쓰지 않고 RN <Text> 만으로 처리하므로
 * 네이티브 변경이 없고 `eas update` 로 바로 나간다.
 *
 * 지원 범위는 프롬프트(`t.aiPrompt.formatting`)에서 모델에게 지시하는 범위와 같다 —
 * 굵게 · 기울임 · 인라인 코드 · 제목 · 순서 있는/없는 목록. 표와 코드블록은 다루지 않는다.
 */

interface MarkdownTextProps {
  children: string;
  /** 본문 기본 스타일. 제목·목록도 이 스타일을 물려받는다. */
  style?: StyleProp<TextStyle>;
}

type Inline = { text: string; bold?: boolean; italic?: boolean; code?: boolean };

/** 한 줄을 굵게/기울임/코드 조각으로 쪼갠다. */
function parseInline(line: string): Inline[] {
  const out: Inline[] = [];
  // **굵게** | *기울임* | `코드`
  const pattern = /(\*\*[^*]+\*\*|\*[^*\n]+\*|`[^`\n]+`)/g;
  let last = 0;
  let m: RegExpExecArray | null;

  while ((m = pattern.exec(line)) !== null) {
    if (m.index > last) out.push({ text: line.slice(last, m.index) });
    const tok = m[0];
    if (tok.startsWith('**')) out.push({ text: tok.slice(2, -2), bold: true });
    else if (tok.startsWith('`')) out.push({ text: tok.slice(1, -1), code: true });
    else out.push({ text: tok.slice(1, -1), italic: true });
    last = m.index + tok.length;
  }
  if (last < line.length) out.push({ text: line.slice(last) });
  return out.length > 0 ? out : [{ text: line }];
}

function InlineRun({ parts, base }: { parts: Inline[]; base?: StyleProp<TextStyle> }) {
  return (
    <>
      {parts.map((p, i) => (
        <Text
          key={i}
          style={[
            base,
            p.bold && styles.bold,
            p.italic && styles.italic,
            p.code && styles.code,
          ]}
        >
          {p.text}
        </Text>
      ))}
    </>
  );
}

export function MarkdownText({ children, style }: MarkdownTextProps) {
  const lines = (children ?? '').split('\n');

  return (
    <View>
      {lines.map((raw, i) => {
        const line = raw.trimEnd();

        if (line.trim() === '') return <View key={i} style={styles.blank} />;

        // # 제목 — 단계가 깊을수록 작게
        const heading = line.match(/^(#{1,3})\s+(.*)$/);
        if (heading) {
          const level = heading[1].length;
          return (
            <Text
              key={i}
              style={[
                style,
                styles.heading,
                level === 1 ? styles.h1 : level === 2 ? styles.h2 : styles.h3,
              ]}
            >
              <InlineRun parts={parseInline(heading[2])} />
            </Text>
          );
        }

        // - 목록 / * 목록
        const bullet = line.match(/^\s*[-*]\s+(.*)$/);
        if (bullet) {
          return (
            <View key={i} style={styles.listRow}>
              <Text style={[style, styles.bulletMark]}>•</Text>
              <Text style={[style, styles.listBody]}>
                <InlineRun parts={parseInline(bullet[1])} base={style} />
              </Text>
            </View>
          );
        }

        // 1. 번호 목록
        const numbered = line.match(/^\s*(\d+)\.\s+(.*)$/);
        if (numbered) {
          return (
            <View key={i} style={styles.listRow}>
              <Text style={[style, styles.bulletMark]}>{numbered[1]}.</Text>
              <Text style={[style, styles.listBody]}>
                <InlineRun parts={parseInline(numbered[2])} base={style} />
              </Text>
            </View>
          );
        }

        return (
          <Text key={i} style={style}>
            <InlineRun parts={parseInline(line)} base={style} />
          </Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bold: { fontWeight: '700' },
  italic: { fontStyle: 'italic' },
  code: {
    fontFamily: 'monospace',
    color: colors.gold,
  },
  heading: { fontWeight: '700', marginTop: 6, marginBottom: 2 },
  h1: { fontSize: 17 },
  h2: { fontSize: 15 },
  h3: { fontSize: 14 },
  listRow: { flexDirection: 'row', alignItems: 'flex-start' },
  bulletMark: { marginRight: 6 },
  listBody: { flex: 1 },
  blank: { height: 6 },
});
