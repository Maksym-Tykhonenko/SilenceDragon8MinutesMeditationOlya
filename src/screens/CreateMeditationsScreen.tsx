import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TextInput,
  Pressable,
  useWindowDimensions,
  Animated,
  Easing,
  Share,
  DeviceEventEmitter,
} from 'react-native';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FullBG from '../components/FullBG';
import { playCategory, stopMusic } from '../native/Music';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SETTINGS_KEY = '@settings:v1';
const CREATED_KEY = '@createdMeditations:v1';

type Step = 'form' | 'meditate' | 'result';

const GOLD = '#E89E01';
const BASE_W = 375;
const BASE_H = 812;

export default function CreateMeditationsScreen() {
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();

  const { width, height } = useWindowDimensions();
  const kBase = Math.min(width / BASE_W, height / BASE_H);
  const k = Math.max(0.78, kBase);

  const sized = (w: number, h: number, clamp = 0.9) => {
    const W = Math.min(w * k, width * clamp);
    return { width: Math.round(W), height: Math.round((h / w) * W) };
  };

  const S = useMemo(
    () => ({
      title: sized(240, 64, 0.86),
      inputW: Math.min(Math.round(300 * k), Math.round(width * 0.86)),
      inputH: Math.max(48, Math.round(56 * k)),
      chip: Math.max(54, Math.round(58 * k)),
      gapLG: Math.max(16, Math.round(22 * k)),
      gapSM: Math.max(8, Math.round(12 * k)),
      padH: Math.max(16, Math.round(20 * k)),
      startBtn: sized(320, 88, 0.92),
      eight: sized(210, 210, 0.7),
      timerW: Math.min(240 * k, 270),
      timerH: Math.max(44, Math.round(52 * k)),
      timerFS: Math.max(18, Math.round(20 * k)),
      titleFS: Math.max(16, Math.round(20 * k)),
    }),
    [k, width, height]
  );

  const [step, setStep] = useState<Step>('form');
  const [name, setName] = useState('');
  const [minutes, setMinutes] = useState<8 | 12 | 20>(8);
  const [remain, setRemain] = useState(minutes * 60);

  const stepRef = useRef<Step>(step);
  const minutesRef = useRef<typeof minutes>(minutes);
  useEffect(() => { stepRef.current = step; }, [step]);
  useEffect(() => { minutesRef.current = minutes; }, [minutes]);

  const aFormTitle = useRef(new Animated.Value(0)).current;
  const aFormName = useRef(new Animated.Value(0)).current;
  const aChips = useRef(new Animated.Value(0)).current;
  const aStart = useRef(new Animated.Value(0)).current;

  const aMedTitle = useRef(new Animated.Value(0)).current;
  const aTimer = useRef(new Animated.Value(0)).current;

  const aResEight = useRef(new Animated.Value(0)).current;
  const aResTitle = useRef(new Animated.Value(0)).current;
  const aResBtns = useRef(new Animated.Value(0)).current;

  const aPulse1 = useRef(new Animated.Value(0)).current;
  const aPulse2 = useRef(new Animated.Value(0)).current;

  const savedOnceRef = useRef(false);
  const musicOnRef = useRef(true);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(SETTINGS_KEY);
        const s = raw ? (JSON.parse(raw) as { musicOn?: boolean }) : {};
        musicOnRef.current = s.musicOn !== false;
      } catch {}
    })();

    const sub = DeviceEventEmitter.addListener('settings:musicOnChanged', (v: boolean) => {
      musicOnRef.current = v;
    
      if (isFocused && stepRef.current === 'meditate') {
        v ? playCategory('calm') : stopMusic();
      }
    });
    return () => sub.remove();
  }, [isFocused]);

  useEffect(() => {
    if (step === 'form') {
      [aFormTitle, aFormName, aChips, aStart].forEach(v => v.setValue(0));
      Animated.stagger(120, [
        Animated.timing(aFormTitle, { toValue: 1, duration: 520, easing: Easing.out(Easing.back(1.2)), useNativeDriver: true }),
        Animated.timing(aFormName, { toValue: 1, duration: 460, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(aChips, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(aStart, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start();
    } else if (step === 'meditate') {
      aMedTitle.setValue(0); aTimer.setValue(0);
      Animated.parallel([
        Animated.timing(aMedTitle, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(aTimer, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start();
    } else {
      aResEight.setValue(0); aResTitle.setValue(0); aResBtns.setValue(0);
      Animated.parallel([
        Animated.timing(aResEight, { toValue: 1, duration: 520, easing: Easing.out(Easing.back(1.2)), useNativeDriver: true }),
        Animated.timing(aResTitle, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(aResBtns, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start();
    }
  }, [step, aFormTitle, aFormName, aChips, aStart, aMedTitle, aTimer, aResEight, aResTitle, aResBtns]);

  const saveCreatedMeditation = useCallback(async () => {
    if (savedOnceRef.current) return;
    savedOnceRef.current = true;
    const item = {
      id: String(Date.now()),
      name: name.trim() || 'My meditation',
      minutes: minutesRef.current,
      createdAt: Date.now(),
    };
    const raw = await AsyncStorage.getItem(CREATED_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    arr.unshift(item);
    await AsyncStorage.setItem(CREATED_KEY, JSON.stringify(arr));
  }, [name]);

  useEffect(() => {
    if (step === 'form') savedOnceRef.current = false;
  }, [step]);

  useEffect(() => {
    if (!isFocused) { stopMusic(); return; }
    if (step === 'meditate') {
      musicOnRef.current ? playCategory('calm') : stopMusic();
    } else {
      stopMusic();
    }
  }, [step, isFocused]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        if (stepRef.current === 'meditate') {
          savedOnceRef.current = false;
          setRemain(minutesRef.current * 60);
          setStep('form');
        }
        stopMusic();
      };
    }, [])
  );

  useEffect(() => {
    if (step !== 'meditate') return;
    setRemain(minutes * 60);
    const id = setInterval(() => setRemain(s => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [step, minutes]);

  useEffect(() => {
    if (remain === 0 && step === 'meditate') {
      (async () => {
        await saveCreatedMeditation();
        setStep('result');
      })();
    }
  }, [remain, step, saveCreatedMeditation]);

  useEffect(() => {
    if (step !== 'meditate') {
      aPulse1.stopAnimation(); aPulse1.setValue(0);
      aPulse2.stopAnimation(); aPulse2.setValue(0);
      return;
    }
    aPulse1.setValue(0);
    aPulse2.setValue(0);
    Animated.loop(
      Animated.sequence([
        Animated.timing(aPulse1, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(aPulse1, { toValue: 0, duration: 1200, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.delay(600),
        Animated.timing(aPulse2, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(aPulse2, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    ).start();
  }, [step, aPulse1, aPulse2]);

  const mmss = (sec: number) => {
    const m = Math.floor(sec / 60).toString();
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const onShare = () => Share.share({ message: `I created "${name || 'My meditation'}" for ${minutes} minutes ✨` });

  const handleTryAgain = () => {
    stopMusic();
    savedOnceRef.current = false;
    setRemain(minutes * 60);
    setStep('form');
  };

  if (step === 'meditate') {
    return (
      <View style={styles.flex}>
        <ImageBackground source={require('../assets/meditation_background.png')} style={styles.flex} resizeMode="cover">
          <Animated.View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFillObject,
              {
                opacity: aPulse1.interpolate({ inputRange: [0, 1], outputRange: [0.10, 0.38] }),
                transform: [{ scale: aPulse1.interpolate({ inputRange: [0, 1], outputRange: [1.00, 1.08] }) }],
                backgroundColor: 'rgba(232,158,1,0.22)',
              },
            ]}
          />
          <Animated.View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFillObject,
              {
                opacity: aPulse2.interpolate({ inputRange: [0, 1], outputRange: [0.06, 0.24] }),
                transform: [{ scale: aPulse2.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1.05] }) }],
                backgroundColor: 'rgba(232,158,1,0.18)',
              },
            ]}
          />

          <View
            style={[
              styles.meditateLayout,
              {
                paddingTop: insets.top + 20,
                paddingBottom: insets.bottom + 100,
                paddingHorizontal: S.padH,
              },
            ]}
          >
            <Animated.Text
              numberOfLines={1}
              style={{
                color: GOLD,
                fontWeight: '900',
                letterSpacing: 2,
                fontSize: S.titleFS,
                textAlign: 'center',
                opacity: aMedTitle,
                marginTop: 20,
                transform: [{ translateY: aMedTitle.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }],
              }}
            >
              {name || 'SWAG MEDIT'}
            </Animated.Text>

            <Animated.View
              style={[
                styles.timerBox,
                {
                  width: S.timerW,
                  height: S.timerH,
                  opacity: aTimer,
                  marginBottom: 20,
                  transform: [{ translateY: aTimer.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }],
                },
              ]}
            >
              <Text style={[styles.timerText, { fontSize: S.timerFS }]}>{mmss(remain)}</Text>
            </Animated.View>
          </View>
        </ImageBackground>
      </View>
    );
  }

  if (step === 'result') {
  
    return (
      <FullBG>
        <View style={[styles.center, { paddingHorizontal: S.padH, gap: S.gapLG, paddingTop: insets.top, paddingBottom: insets.bottom + 20 }]}>
          <Animated.Image
            source={require('../assets/eight.png')}
            style={{
              width: S.eight.width,
              height: S.eight.height,
              opacity: aResEight,
              transform: [
                { translateY: aResEight.interpolate({ inputRange: [0, 1], outputRange: [-60, 0] }) },
                { scale: aResEight.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) },
              ],
            }}
            resizeMode="contain"
          />
          <Animated.Text
            numberOfLines={1}
            style={{
              color: GOLD,
              fontWeight: '900',
              letterSpacing: 1.4,
              fontSize: S.titleFS,
              opacity: aResTitle,
              textAlign: 'center',
            }}
          >
            {name || 'SWAG MEDIT'}
          </Animated.Text>
          <Animated.Text
            style={{
              color: '#fff',
              opacity: aResTitle,
              fontSize: Math.max(13, S.titleFS - 4),
              textAlign: 'center',
            }}
          >
            (completed)
          </Animated.Text>

          <View style={{ height: S.gapLG }} />

          <View style={{ gap: S.gapSM, alignItems: 'center' }}>
            <Pressable onPress={handleTryAgain} hitSlop={10} style={{ alignItems: 'center' }}>
              <Animated.Image
                source={require('../assets/try_again.png')}
                style={{
                  width: S.startBtn.width,
                  height: S.startBtn.height,
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
                  width: S.startBtn.width,
                  height: S.startBtn.height,
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
      <View style={[styles.center, { paddingHorizontal: S.padH, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <Animated.Image
          source={require('../assets/create_title.png')}
          style={{
            width: S.title.width,
            height: S.title.height,
            opacity: aFormTitle,
            transform: [
              { translateY: aFormTitle.interpolate({ inputRange: [0, 1], outputRange: [-40, 0] }) },
              { scale: aFormTitle.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) },
            ],
          }}
          resizeMode="contain"
        />

        <View style={{ height: S.gapLG }} />

        <Animated.Text style={{ color: '#fff', fontSize: S.titleFS, fontWeight: '700', opacity: aFormName, marginBottom: S.gapSM / 2 }}>
          Meditation name
        </Animated.Text>

        <Animated.View
          style={{
            width: S.inputW,
            height: S.inputH,
            borderRadius: 16,
            borderWidth: 2,
            borderColor: GOLD,
            backgroundColor: 'rgba(35,11,6,0.85)',
            justifyContent: 'center',
            paddingHorizontal: 16,
            opacity: aFormName,
          }}
        >
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Meditation name"
            placeholderTextColor="rgba(255,255,255,0.5)"
            style={{ color: '#fff', fontSize: 16, fontWeight: '700', textAlign: 'center' }}
            maxLength={28}
          />
        </Animated.View>

        <View style={{ height: S.gapLG }} />

        <Animated.Text style={{ color: '#fff', fontSize: S.titleFS, fontWeight: '700', opacity: aChips, marginBottom: S.gapSM / 2 }}>
          Duration
        </Animated.Text>

        <Animated.View style={{ flexDirection: 'row', gap: S.gapSM, opacity: aChips }}>
          {[8, 12, 20].map((m) => {
            const active = minutes === (m as 8 | 12 | 20);
            return (
              <Pressable key={m} onPress={() => setMinutes(m as 8 | 12 | 20)}>
                <View
                  style={[
                    styles.chip,
                    {
                      width: S.chip,
                      height: S.chip,
                      borderRadius: S.chip / 2,
                      borderColor: GOLD,
                      backgroundColor: active ? GOLD : 'rgba(35,11,6,0.85)',
                    },
                  ]}
                >
                  <Text style={[styles.chipText, { color: active ? '#2c1206' : '#fff' }]}>{m}</Text>
                </View>
              </Pressable>
            );
          })}
        </Animated.View>

        <View style={{ height: S.gapLG * 1.4 }} />

        <Pressable disabled={!name.trim()} onPress={() => setStep('meditate')} style={{ opacity: name.trim() ? 1 : 0.5 }}>
          <Animated.Image
            source={require('../assets/start.png')}
            style={{
              width: S.startBtn.width,
              height: S.startBtn.height,
              opacity: aStart,
              transform: [{ translateY: aStart.interpolate({ inputRange: [0, 1], outputRange: [50, 0] }) }],
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  meditateLayout: { flex: 1, justifyContent: 'space-between', alignItems: 'center' },
  chip: { borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  chipText: { fontSize: 18, fontWeight: '900', letterSpacing: 0.5 },
  timerBox: {
    borderWidth: 3,
    borderColor: GOLD,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  timerText: { color: '#2E6B3B', fontWeight: '900', letterSpacing: 1 },
});
