// Mock react-native-reanimated so component tests don't need a native runtime.
// Animated.View renders as a plain View; animations are no-ops.
jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');
  const Animated = { View };
  return {
    __esModule: true,
    default: Animated,
    useSharedValue: (val: unknown) => ({ value: val }),
    useAnimatedStyle: () => ({}),
    withTiming: (val: unknown) => val,
    interpolate: (_val: unknown, _input: number[], output: number[]) => output[0],
  };
});
