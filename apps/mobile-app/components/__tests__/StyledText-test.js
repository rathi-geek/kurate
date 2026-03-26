import React from 'react';
import { render } from '@testing-library/react-native';
import { MonoText } from '../StyledText';

jest.mock('../Themed', () => ({
  Text: ({ children, style, testID }) => (
    <text style={style} testID={testID}>
      {children}
    </text>
  ),
}));

describe('<MonoText />', () => {
  it('renders correctly', () => {
    const { getByTestId } = render(<MonoText>Test Text</MonoText>);
    const textElement = getByTestId('mono-text');
    expect(textElement).toBeTruthy();
    expect(textElement.props.children).toBe('Test Text');
    expect(textElement.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ fontFamily: 'SpaceMono' }),
      ]),
    );
  });
});
