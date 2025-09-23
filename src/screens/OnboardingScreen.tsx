import React, { useMemo, useRef, useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Image,
  Pressable,
  ScrollView,
  useWindowDimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Animated,
  Easing,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import FullBG from '../components/FullBG';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

const BASE_W = 375;
const BASE_H = 812;

const slides = [
  { topImg: require('../assets/image1.png'), textImg: require('../assets/Group1.png'), btnImg: require('../assets/Gro1.png') },
  { topImg: require('../assets/image2.png'), textImg: require('../assets/Group2.png'), btnImg: require('../assets/Gro2.png') },
  { topImg: require('../assets/image3.png'), textImg: require('../assets/Group3.png'), btnImg: require('../assets/Gro3.png') },
];

export default function OnboardingScreen({ navigation }: Props) {
  const { width, height } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const [page, setPage] = useState(0);

  const k = Math.min(width / BASE_W, height / BASE_H);
  const sized = (baseW: number, baseH: number) => {
    const maxW = Math.min(width * 0.92, baseW * k * 1.1);
    const w = Math.min(baseW * k, maxW);
    const h = (baseH / baseW) * w;
    return { width: Math.round(w), height: Math.round(h) };
  };

  const S = useMemo(() => {
    return {
      topImage: sized(300, 449),
      textImage: sized(334, 174),
      btnImage: sized(332, 80),
      vGap: Math.max(16, Math.round(24 * k)),
      dot: Math.max(6, Math.round(8 * k)),
      dotGap: Math.max(6, Math.round(8 * k)),
    };
  }, [k, width, height]);

  const dx = Math.round(80 * k);
  const appearTop = useRef(new Animated.Value(0)).current;
  const appearText = useRef(new Animated.Value(0)).current;
  const appearBtn = useRef(new Animated.Value(0)).current;
  const btnScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    appearTop.setValue(0);
    appearText.setValue(0);
    appearBtn.setValue(0);
    Animated.sequence([
      Animated.timing(appearTop, { toValue: 1, duration: 360, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(appearText, { toValue: 1, duration: 360, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(appearBtn, { toValue: 1, duration: 360, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [page, appearTop, appearText, appearBtn]);

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / width);
    setPage(idx);
  };

  const goNext = () => {
    if (page < slides.length - 1) {
      scrollRef.current?.scrollTo({ x: (page + 1) * width, animated: true });
      setPage(p => Math.min(p + 1, slides.length - 1));
    } else {
      navigation.replace('Registration');
    }
  };

  const onPressIn = () => Animated.spring(btnScale, { toValue: 0.96, useNativeDriver: true }).start();
  const onPressOut = () => Animated.spring(btnScale, { toValue: 1, useNativeDriver: true }).start();

  const dirBase = page % 2 === 0 ? 1 : -1;
  const fromRight = (v: Animated.Value) => ({
    opacity: v,
    transform: [{ translateX: v.interpolate({ inputRange: [0, 1], outputRange: [dx, 0] }) }],
  });
  const fromLeft = (v: Animated.Value) => ({
    opacity: v,
    transform: [{ translateX: v.interpolate({ inputRange: [0, 1], outputRange: [-dx, 0] }) }],
  });
  const animForTop = dirBase > 0 ? fromRight(appearTop) : fromLeft(appearTop);
  const animForText = dirBase > 0 ? fromLeft(appearText) : fromRight(appearText);
  const animForBtn = dirBase > 0 ? fromRight(appearBtn) : fromLeft(appearBtn);

  return (
    <FullBG>
      <View style={styles.wrapper}>
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onMomentumEnd}
          style={styles.scroll}
        >
          {slides.map((s, idx) => {
            const active = idx === page;
            return (
              <View key={idx} style={[styles.page, { width }]}>
                <View style={styles.center}>
                  {active ? (
                    <Animated.Image source={s.topImg} style={[S.topImage, animForTop]} resizeMode="contain" />
                  ) : (
                    <Image source={s.topImg} style={S.topImage} resizeMode="contain" />
                  )}
                  <View style={{ height: S.vGap }} />
                  {active ? (
                    <Animated.Image source={s.textImg} style={[S.textImage, animForText]} resizeMode="contain" />
                  ) : (
                    <Image source={s.textImg} style={S.textImage} resizeMode="contain" />
                  )}
                  <View style={{ height: S.vGap }} />
                  <Pressable onPress={goNext} onPressIn={onPressIn} onPressOut={onPressOut} hitSlop={8} style={styles.btnWrap}>
                    {active ? (
                      <Animated.Image
                        source={s.btnImg}
                        style={[S.btnImage, animForBtn, { transform: [...(animForBtn.transform || []), { scale: btnScale }] }]}
                        resizeMode="contain"
                      />
                    ) : (
                      <Image source={s.btnImg} style={S.btnImage} resizeMode="contain" />
                    )}
                  </Pressable>
                </View>
              </View>
            );
          })}
        </ScrollView>

        <View style={styles.dotsRow}>
          {slides.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  width: S.dot,
                  height: S.dot,
                  marginHorizontal: S.dotGap / 2,
                  opacity: page === i ? 1 : 0.35,
                  transform: [{ scale: page === i ? 1.2 : 1 }],
                },
              ]}
            />
          ))}
        </View>
      </View>
    </FullBG>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  scroll: { flex: 1 },
  page: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  center: { alignItems: 'center', justifyContent: 'center' },
  btnWrap: { alignItems: 'center', justifyContent: 'center' },
  dotsRow: { position: 'absolute', alignSelf: 'center', bottom: 18, flexDirection: 'row' },
  dot: { borderRadius: 999, backgroundColor: '#FFFFFF' },
});
