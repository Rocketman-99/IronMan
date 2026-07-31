/**
 * 직접 만든 달력(`src/components/common/DatePicker.tsx`) 동작 확인.
 *
 * 네이티브 날짜 선택기를 쓰면 APK 재빌드가 필요해 손으로 만들었는데,
 * 그러면 윤년·월 시작 요일·연도 이동 같은 걸 전부 우리가 책임져야 한다.
 * 실기기 없이 확인할 수 있는 건 이 계산 부분이라 여기서 잡는다.
 */
import { render, fireEvent } from '@testing-library/react-native';
import { DatePicker } from '../src/components/common/DatePicker';

function open(value: string, onChange = jest.fn()) {
  const view = render(<DatePicker value={value} onChange={onChange} />);
  fireEvent.press(view.getByText(value));
  return { ...view, onChange };
}

describe('DatePicker', () => {
  it('값이 있는 달을 열어 보여준다', () => {
    const { getByText } = open('2026-07-15');
    expect(getByText('2026년 7월')).toBeTruthy();
  });

  it('날짜를 누르면 KST YYYY-MM-DD 로 돌려준다', () => {
    const { getByText, onChange } = open('2026-07-15');
    fireEvent.press(getByText('20'));
    expect(onChange).toHaveBeenCalledWith('2026-07-20');
  });

  it('한 자리 월·일을 0으로 채운다', () => {
    const { getByText, onChange } = open('2026-03-15');
    fireEvent.press(getByText('7'));
    expect(onChange).toHaveBeenCalledWith('2026-03-07');
  });

  it('윤년 2월은 29일까지 있다', () => {
    const { getByText, onChange } = open('2024-02-10');
    fireEvent.press(getByText('29'));
    expect(onChange).toHaveBeenCalledWith('2024-02-29');
  });

  it('평년 2월에는 29일이 없다', () => {
    const { queryByText } = open('2026-02-10');
    expect(queryByText('29')).toBeNull();
  });

  it('1월에서 이전 달을 누르면 작년 12월로 간다', () => {
    const { getByText, getByTestId, onChange } = open('2026-01-15');
    fireEvent.press(getByTestId('datepicker-prev'));
    expect(getByText('2025년 12월')).toBeTruthy();
    fireEvent.press(getByText('31'));
    expect(onChange).toHaveBeenCalledWith('2025-12-31');
  });

  it('12월에서 다음 달을 누르면 내년 1월로 간다', () => {
    const { getByText, getByTestId, onChange } = open('2026-12-15');
    fireEvent.press(getByTestId('datepicker-next'));
    expect(getByText('2027년 1월')).toBeTruthy();
    fireEvent.press(getByText('1'));
    expect(onChange).toHaveBeenCalledWith('2027-01-01');
  });

  it('연도 목록에서 수십 년 전을 한 번에 고를 수 있다', () => {
    const { getByText, onChange } = open('2026-07-15');
    fireEvent.press(getByText('2026년 7월')); // 연도 목록 열기
    fireEvent.press(getByText('1995'));
    expect(getByText('1995년 7월')).toBeTruthy();
    fireEvent.press(getByText('3'));
    expect(onChange).toHaveBeenCalledWith('1995-07-03');
  });

  it('비우기 버튼은 clearable 일 때만 나온다', () => {
    const onChange = jest.fn();
    const view = render(<DatePicker value="2026-07-15" onChange={onChange} clearable />);
    fireEvent.press(view.getByText('2026-07-15'));
    fireEvent.press(view.getByText('지우기'));
    expect(onChange).toHaveBeenCalledWith('');

    const plain = render(<DatePicker value="2026-07-15" onChange={jest.fn()} />);
    fireEvent.press(plain.getByText('2026-07-15'));
    expect(plain.queryByText('지우기')).toBeNull();
  });
});
