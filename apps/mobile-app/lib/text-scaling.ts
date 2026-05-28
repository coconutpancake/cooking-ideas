import { Text, TextInput, type TextInputProps, type TextProps } from 'react-native';

const SYSTEM_TEXT_SCALING = {
  allowFontScaling: true,
  maxFontSizeMultiplier: 1.4,
} satisfies Pick<TextProps, 'allowFontScaling' | 'maxFontSizeMultiplier'>;

type ComponentWithDefaultProps<TProps> = {
  defaultProps?: Partial<TProps>;
};

export function configureSystemTextScaling() {
  const textComponent = Text as unknown as ComponentWithDefaultProps<TextProps>;
  const textInputComponent = TextInput as unknown as ComponentWithDefaultProps<TextInputProps>;

  textComponent.defaultProps = {
    ...textComponent.defaultProps,
    ...SYSTEM_TEXT_SCALING,
  };
  textInputComponent.defaultProps = {
    ...textInputComponent.defaultProps,
    ...SYSTEM_TEXT_SCALING,
  };
}
