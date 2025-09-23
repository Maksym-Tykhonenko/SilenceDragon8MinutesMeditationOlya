import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, Pressable, ImageBackground, useWindowDimensions,
  Animated, Easing, Share, DeviceEventEmitter,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect, StackActions } from '@react-navigation/native';
import type { HomeStackParamList } from '../navigation/types';
import FullBG from '../components/FullBG';
import { playCategory, stopMusic } from '../native/Music';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

const CAT_STATS_KEY = '@categoryStats:v1';
const SETTINGS_KEY = '@settings:v1';

type Props = NativeStackScreenProps<HomeStackParamList, 'CategoryMeditation'>;
type CatKey = 'calm' | 'energy' | 'break';

const GOLD = '#E89E01';
const BASE_W = 375;
const BASE_H = 812;

const quotes: Record<CatKey, string[]> = {
  calm: [
    'Breathing Wave — deep, even breathing.',
    'Silence Within — focus on inner peace.',
    'Forest Whisper — nature sounds meditation.',
    'Inner Light — warm glow visualization.',
  ],
  energy: [
    'Morning Start — 8 minutes to wake up.',
    'Dragon Fire — energizing breath.',
    'Concentration — focus on one object.',
    'Power of Intention — repeat affirmations.',
  ],
  break: [
    'Relaxation — release body tension.',
    'Imagination Walk — peaceful place.',
    'Letting Go — observe thoughts.',
    'Relaxing Melody — gentle harmonies.',
  ],
};

const introDragon: Record<CatKey, any> = {
  calm: require('../assets/dragon_blue_big.png'),
  energy: require('../assets/dragon_yellow_big.png'),
  break: require('../assets/dragon_green_big.png'),
};
const tallDragon: Record<CatKey, any> = {
  calm: require('../assets/dragon_blue_tall.png'),
  energy: require('../assets/dragon_yellow_tall.png'),
  break: require('../assets/dragon_green_tall.png'),
};

export default function CategoryMeditationScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const routeCat = route.params?.category;
  const category: CatKey = (routeCat ?? 'calm') as CatKey;

  const { width, height } = useWindowDimensions();
  const kBase = Math.min(width / BASE_W, height / BASE_H);
  const k = Math.max(0.75, kBase);

  const sized = (w: number, h: number, clamp = 0.9) => {
    const W = Math.min(w * k, width * clamp);
    return { width: Math.round(W), height: Math.round((h / w) * W) };
  };

  const S = useMemo(
    () => ({
      introDragon: sized(271, 420, 0.88),
      meditateDragon: sized(289, 444, 0.9),
      resBtn: sized(280, 80, 0.8),
      btn: sized(322, 80, 0.9),
      padH: Math.max(12, Math.round(18 * k)),
      gapLG: Math.max(12, Math.round(20 * k)),
      gapSM: Math.max(6, Math.round(10 * k)),
      textFS: Math.max(13, Math.round(15 * k)),
      timerW: Math.min(220 * k, 260),
      timerH: Math.max(42, Math.round(48 * k)),
      timerFS: Math.max(18, Math.round(20 * k)),
      bottomPadding: tabBarHeight + Math.round(20 * k),
    }),
    [k, width, height, tabBarHeight]
  );

  const [step, setStep] = useState<'intro' | 'meditate' | 'result'>('intro');
  const [remain, setRemain] = useState(8 * 60);

  const todayQuote = useMemo(() => {
    const d = new Date();
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${category}`;
    const code = [...key].reduce((s, ch) => s + ch.charCodeAt(0), 0);
    const list = quotes[category];
    return list[code % list.length];
  }, [category]);

  const aIntroDragon = useRef(new Animated.Value(0)).current;
  const aIntroText   = useRef(new Animated.Value(0)).current;
  const aIntroBtn    = useRef(new Animated.Value(0)).current;

  const aMedDragon = useRef(new Animated.Value(0)).current;
  const aMedTimer  = useRef(new Animated.Value(0)).current;
  const aPulse     = useRef(new Animated.Value(0)).current;
  const aFloat     = useRef(new Animated.Value(0)).current;

  const aResDragon = useRef(new Animated.Value(0)).current;
  const aResText   = useRef(new Animated.Value(0)).current;
  const aResBtns   = useRef(new Animated.Value(0)).current;

  const recordedRef = useRef(false);
  const musicOnRef  = useRef(true);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(SETTINGS_KEY);
        const s = raw ? (JSON.parse(raw) as { musicOn?: boolean }) : {};
        musicOnRef.current = s.musicOn !== false;
      } catch {}
    })();
  }, []);

  const applyMusic = useCallback((isFocused: boolean) => {
    if (!isFocused) return;
    if (step === 'meditate') {
      musicOnRef.current ? playCategory(category) : stopMusic();
    } else {
      stopMusic();
    }
  }, [step, category]);

  useFocusEffect(
    useCallback(() => {
      applyMusic(true);
      return () => {
        stopMusic();
      };
    }, [applyMusic])
  );

  useEffect(() => {
    const unsub = navigation.addListener('blur', () => {
      const state: any = navigation.getState?.();
      if (state?.type === 'stack' && navigation.canGoBack()) {
        navigation.dispatch(StackActions.popToTop());
      }
    });
    return unsub;
  }, [navigation]);

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('settings:musicOnChanged', (v: boolean) => {
      musicOnRef.current = v;
      applyMusic(true);
    });
    return () => sub.remove();
  }, [applyMusic]);

  useEffect(() => {
    if (step === 'intro') {
      aIntroDragon.setValue(0); aIntroText.setValue(0); aIntroBtn.setValue(0);
      Animated.parallel([
        Animated.timing(aIntroDragon, { toValue: 1, duration: 520, easing: Easing.out(Easing.back(1.2)), useNativeDriver: true }),
        Animated.sequence([Animated.delay(120), Animated.timing(aIntroText, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true })]),
        Animated.sequence([Animated.delay(220), Animated.timing(aIntroBtn, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true })]),
      ]).start();
    } else if (step === 'meditate') {
      aMedDragon.setValue(0); aMedTimer.setValue(0);
      Animated.parallel([
        Animated.timing(aMedDragon, { toValue: 1, duration: 520, easing: Easing.out(Easing.back(1.2)), useNativeDriver: true }),
        Animated.sequence([Animated.delay(160), Animated.timing(aMedTimer, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true })]),
      ]).start();
    } else {
      aResDragon.setValue(0); aResText.setValue(0); aResBtns.setValue(0);
      Animated.parallel([
        Animated.timing(aResDragon, { toValue: 1, duration: 520, easing: Easing.out(Easing.back(1.2)), useNativeDriver: true }),
        Animated.sequence([Animated.delay(140), Animated.timing(aResText, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true })]),
        Animated.sequence([Animated.delay(240), Animated.timing(aResBtns, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true })]),
      ]).start();
    }
  }, [step, aIntroDragon, aIntroText, aIntroBtn, aMedDragon, aMedTimer, aResDragon, aResText, aResBtns]);

  useEffect(() => {
    if (step !== 'meditate') recordedRef.current = false;
  }, [step]);

  useEffect(() => {
    if (step !== 'meditate') return;
    setRemain(8 * 60);
    const id = setInterval(() => setRemain(t => (t > 0 ? t - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [step]);

  useEffect(() => {
    if (remain === 0 && step === 'meditate' && !recordedRef.current) {
      recordedRef.current = true;
      (async () => {
        const raw = await AsyncStorage.getItem(CAT_STATS_KEY);
        const obj: Partial<Record<CatKey, number>> = raw ? JSON.parse(raw) : {};
        obj[category] = (obj[category] || 0) + 1;
        await AsyncStorage.setItem(CAT_STATS_KEY, JSON.stringify(obj));
        setStep('result');
      })();
    }
  }, [remain, step, category]);

  useEffect(() => {
    if (step !== 'meditate') {
      aPulse.stopAnimation(); aPulse.setValue(0);
      aFloat.stopAnimation(); aFloat.setValue(0);
      return;
    }
    aPulse.setValue(0); aFloat.setValue(0);
    Animated.loop(
      Animated.sequence([
        Animated.timing(aPulse, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(aPulse, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(aFloat, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(aFloat, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
  }, [step, aPulse, aFloat]);

  const mmss = (sec: number) => {
    const m = Math.floor(sec / 60).toString();
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const onShare = () => Share.share({ message: `I completed 8 minutes of meditation 🐉` });

  const onTryAgainToHome = () => {
    navigation.popToTop();
  };

  if (step === 'meditate') {
    return (
      <ImageBackground source={require('../assets/meditation_background.png')} resizeMode="cover" style={styles.flex}>
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFillObject,
            {
              opacity: aPulse.interpolate({ inputRange: [0, 1], outputRange: [0.05, 0.22] }),
              backgroundColor: 'rgba(232,158,1,0.28)',
              transform: [{ scale: aPulse.interpolate({ inputRange: [0, 1], outputRange: [1.0, 1.03] }) }],
            },
          ]}
        />
        <View
          style={[
            styles.meditateWrap,
            {
              paddingHorizontal: S.padH,
              paddingTop: insets.top,
              paddingBottom: S.bottomPadding,
            },
          ]}
        >
          <Animated.Image
            source={tallDragon[category]}
            resizeMode="contain"
            style={{
              width: S.meditateDragon.width,
              height: S.meditateDragon.height,
              alignSelf: 'center',
              opacity: aMedDragon,
              transform: [
                { translateY: aMedDragon.interpolate({ inputRange: [0, 1], outputRange: [-60, 0] }) },
                { scale: aMedDragon.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) },
                { translateY: aFloat.interpolate({ inputRange: [0, 1], outputRange: [-8, 8] }) },
                { rotate: aFloat.interpolate({ inputRange: [0, 1], outputRange: ['-2deg', '2deg'] }) as any },
              ],
            }}
          />
          <Animated.View
            style={[
              styles.timerBox,
              {
                width: S.timerW,
                height: S.timerH,
                opacity: aMedTimer,
                transform: [{ translateY: aMedTimer.interpolate({ inputRange: [0, 1], outputRange: [50, 0] }) }],
              },
            ]}
          >
            <Text style={[styles.timerText, { fontSize: S.timerFS }]}>{mmss(remain)}</Text>
          </Animated.View>
        </View>
      </ImageBackground>
    );
  }

  if (step === 'result') {
    return (
      <FullBG>
        <View
          style={[
            styles.introWrap,
            {
              paddingHorizontal: S.padH,
              paddingTop: insets.top,
              paddingBottom: S.bottomPadding,
            },
          ]}
        >
          <Animated.Image
            source={introDragon[category]}
            style={{
              width: S.introDragon.width,
              height: S.introDragon.height,
              alignSelf: 'center',
              opacity: aResDragon,
              transform: [
                { translateY: aResDragon.interpolate({ inputRange: [0, 1], outputRange: [-70, 0] }) },
                { scale: aResDragon.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) },
              ],
            }}
            resizeMode="contain"
          />
          <View style={{ height: S.gapLG }} />
          <Animated.Text
            style={[
              styles.quote,
              { fontSize: S.textFS, opacity: aResText, transform: [{ translateX: aResText.interpolate({ inputRange: [0, 1], outputRange: [80, 0] }) }] },
            ]}
          >
            (completed)
          </Animated.Text>

          <View style={{ height: S.gapLG }} />
          <View style={{ gap: S.gapSM, alignItems: 'center' }}>
            <Pressable onPress={onTryAgainToHome} hitSlop={10} style={{ alignItems: 'center' }}>
              <Animated.Image
                source={require('../assets/try_again.png')}
                style={{
                  width: S.resBtn.width,
                  height: S.resBtn.height,
                  opacity: aResBtns,
                  transform: [{ translateY: aResBtns.interpolate({ inputRange: [0, 1], outputRange: [50, 0] }) }],
                }}
                resizeMode="contain"
              />
            </Pressable>
            <Pressable onPress={onShare} hitSlop={10} style={{ alignItems: 'center' }}>
              <Animated.Image
                source={require('../assets/share.png')}
                style={{
                  width: S.resBtn.width,
                  height: S.resBtn.height,
                  opacity: aResBtns,
                  transform: [{ translateY: aResBtns.interpolate({ inputRange: [0, 1], outputRange: [50, 0] }) }],
                }}
                resizeMode="contain"
              />
            </Pressable>
          </View>
        </View>
      </FullBG>
    );
  }

  return (
    <FullBG>
      <View
        style={[
          styles.introWrap,
          {
            paddingHorizontal: S.padH,
            paddingTop: insets.top,
            paddingBottom: S.bottomPadding,
          },
        ]}
      >
        <Animated.Image
          source={introDragon[category]}
          style={{
            width: S.introDragon.width,
            height: S.introDragon.height,
            alignSelf: 'center',
            opacity: aIntroDragon,
            transform: [
              { translateY: aIntroDragon.interpolate({ inputRange: [0, 1], outputRange: [-80, 0] }) },
              { scale: aIntroDragon.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) },
            ],
          }}
          resizeMode="contain"
        />
        <View style={{ height: S.gapLG }} />
        <Animated.Text
          style={[
            styles.quote,
            { fontSize: S.textFS, opacity: aIntroText, transform: [{ translateX: aIntroText.interpolate({ inputRange: [0, 1], outputRange: [90, 0] }) }] },
          ]}
        >
          {todayQuote}
        </Animated.Text>
        <View style={{ height: S.gapLG }} />
        <Pressable onPress={() => setStep('meditate')} hitSlop={10} style={{ alignItems: 'center' }}>
          <Animated.Image
            source={require('../assets/Gro3.png')}
            style={{
              width: S.btn.width,
              height: S.btn.height,
              opacity: aIntroBtn,
              transform: [{ translateY: aIntroBtn.interpolate({ inputRange: [0, 1], outputRange: [60, 0] }) }],
            }}
            resizeMode="contain"
          />
        </Pressable>
      </View>
    </FullBG>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  introWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  meditateWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  quote: { color: '#FFFFFF', textAlign: 'center', lineHeight: 20, opacity: 0.9 },
  meditateTitle: { color: GOLD, fontWeight: '900', letterSpacing: 2, textAlign: 'center', marginTop: 6 },
  timerBox: {
    borderWidth: 3,
    borderColor: GOLD,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    marginTop: 10,
  },
  timerText: { color: '#2E6B3B', fontWeight: '900', letterSpacing: 1 },
});