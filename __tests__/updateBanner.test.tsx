/**
 * 무선 업데이트 배너의 상태 전환.
 *
 * 배너는 useUpdates() 가 주는 상태에 따라 무엇을 보일지 정하는 상태 기계라,
 * 실기기 없이도 대부분 확인할 수 있다. 실제 다운로드 속도와 reloadAsync 로 인한
 * 재시작만 기기에서 봐야 한다.
 */
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Updates from 'expo-updates';
import { UpdateBanner } from '../src/components/common/UpdateBanner';

const METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

// jest.setup.tsx 의 목이 노출하는 테스트 전용 훅.
const updates = Updates as unknown as {
  __setState: (next: { isEnabled?: boolean; useUpdates?: Record<string, unknown> }) => void;
  reloadAsync: jest.Mock;
};

function show() {
  return render(
    <SafeAreaProvider initialMetrics={METRICS}>
      <UpdateBanner />
    </SafeAreaProvider>
  );
}

/** SafeAreaProvider 는 항상 남으므로, 그 안이 비었는지로 판단한다. */
function rendersNothing(view: ReturnType<typeof show>) {
  const tree = view.toJSON() as { children: unknown } | null;
  return tree === null || tree.children === null;
}

describe('UpdateBanner', () => {
  it('아무 일도 없으면 아무것도 그리지 않는다', () => {
    expect(rendersNothing(show())).toBe(true);
  });

  it('개발 빌드에서는 그리지 않는다', () => {
    updates.__setState({ isEnabled: false, useUpdates: { isUpdatePending: true } });
    expect(rendersNothing(show())).toBe(true);
  });

  it('받는 중이면 진행률을 보여준다', () => {
    updates.__setState({ useUpdates: { isDownloading: true, downloadProgress: 0.42 } });
    expect(show().getByText('새 버전 받는 중 42%')).toBeTruthy();
  });

  it('진행률을 모르면 퍼센트를 지어내지 않는다', () => {
    updates.__setState({ useUpdates: { isDownloading: true, downloadProgress: undefined } });
    const { getByText, queryByText } = show();
    expect(getByText('새 버전 받는 중')).toBeTruthy();
    expect(queryByText(/%/)).toBeNull();
  });

  it('진행률이 범위를 벗어나도 0~100 으로 자른다', () => {
    updates.__setState({ useUpdates: { isDownloading: true, downloadProgress: 1.4 } });
    expect(show().getByText('새 버전 받는 중 100%')).toBeTruthy();
  });

  it('다 받으면 적용 버튼이 뜨고, 눌러야 재시작한다', async () => {
    updates.__setState({ useUpdates: { isUpdatePending: true } });
    const { getByText } = show();

    // 아직 저절로 재시작하지 않는다 — 입력 중이던 내용이 날아가면 안 된다.
    expect(updates.reloadAsync).not.toHaveBeenCalled();

    fireEvent.press(getByText('지금 적용'));
    await waitFor(() => expect(updates.reloadAsync).toHaveBeenCalled());
  });

  it('실패하면 안내를 띄우고 닫을 수 있다', () => {
    updates.__setState({ useUpdates: { downloadError: new Error('boom') } });
    const view = show();
    expect(view.getByText('업데이트를 받지 못했습니다')).toBeTruthy();
    fireEvent.press(view.getByText('닫기'));
    expect(view.queryByText('업데이트를 받지 못했습니다')).toBeNull();
    expect(rendersNothing(view)).toBe(true);
  });

  it('받는 중과 적용 대기가 겹치면 적용 버튼을 우선한다', () => {
    updates.__setState({ useUpdates: { isDownloading: true, isUpdatePending: true } });
    expect(show().getByText('지금 적용')).toBeTruthy();
  });
});
