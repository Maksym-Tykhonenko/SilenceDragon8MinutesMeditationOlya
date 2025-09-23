import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Share,
  Animated,
  Easing,
  Alert,
  ScrollView,
  Image,
  useWindowDimensions,
  ImageSourcePropType,
  DeviceEventEmitter,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FullBG from '../components/FullBG';
import { useFocusEffect } from '@react-navigation/native';

type SavedMeditation = { id: string; name: string; minutes: number; createdAt: number };
type CatKey = 'calm' | 'energy' | 'break';
type CatStats = Partial<Record<CatKey, number>>;

const GOLD = '#E89E01';

const CREATED_KEY = '@createdMeditations:v1';
const CAT_STATS_KEY = '@categoryStats:v1';
const MEDI_KEYS_TO_RESET = ['@createdMeditations:v1', '@myMeditations:v1', '@customMeditations:v1'];

const FAV_LABEL: Record<CatKey, string> = {
  calm: 'CALM SOUL',
  energy: 'FOCUS ENERGY',
  break: 'BREAK THE ROUTINE',
};

const TITLE_IMG: {
  statistics: ImageSourcePropType;
  total: ImageSourcePropType;
  sessions: ImageSourcePropType;
  favorite: ImageSourcePropType;
} = {
  statistics: require('../assets/Statistics.png'),
  total: require('../assets/Total_meditation_time.png'),
  sessions: require('../assets/Number_of_completed_sessions.png'),
  favorite: require('../assets/Favorite_category.png'),
};

const BTN_IMG: {
  share: ImageSourcePropType;
  reset: ImageSourcePropType;
} = {
  share: require('../assets/share.png'),                
  reset: require('../assets/Reset_statistics.png'),
};

function TitleImage({
  source,
  fallbackText,
  width,
  height,
  animatedOpacity,
  animatedTranslate,
}: {
  source?: ImageSourcePropType;
  fallbackText: string;
  width: number;
  height: number;
  animatedOpacity: Animated.AnimatedInterpolation<number>;
  animatedTranslate: Animated.AnimatedInterpolation<number>;
}) {
  return source ? (
    <Animated.Image
      source={source}
      resizeMode="contain"
      style={{
        width,
        height,
        alignSelf: 'center',
        opacity: animatedOpacity,
        transform: [{ translateY: animatedTranslate }],
      }}
    />
  ) : (
    <Animated.Text
      style={{
        color: GOLD,
        fontSize: Math.round(height * 0.45),
        fontWeight: '900',
        letterSpacing: 2,
        textAlign: 'center',
        textShadowColor: 'rgba(0,0,0,0.45)',
        textShadowRadius: 6,
        textShadowOffset: { width: 0, height: 2 },
        opacity: animatedOpacity,
        transform: [{ translateY: animatedTranslate }],
      }}
    >
      {fallbackText.toUpperCase()}
    </Animated.Text>
  );
}

export default function StatsScreen() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const kBase = Math.min(width / 375, height / 812);
  const k = Math.max(0.82, Math.min(1.1, kBase));

  const TITLE_W = Math.min(Math.round(270 * k), Math.round(width * 0.86));
  const TITLE_H = Math.max(36, Math.round(56 * k));
  const SEC_TITLE_W = Math.min(Math.round(260 * k), Math.round(width * 0.84));
  const SEC_TITLE_H = Math.max(30, Math.round(48 * k));

  const BTN_W = Math.min(Math.round(320 * k), Math.round(width * 0.9));
  const BTN_H = Math.max(48, Math.round(72 * k));

  const [totalMinutes, setTotalMinutes] = useState(0);
  const [sessionCount, setSessionCount] = useState(0);
  const [fav, setFav] = useState<string>('…');

  const aIn = useRef(new Animated.Value(0)).current;       
  const aTitle = useRef(new Animated.Value(0)).current;   
  const aSec1 = useRef(new Animated.Value(0)).current;    
  const aSec2 = useRef(new Animated.Value(0)).current;     
  const aSec3 = useRef(new Animated.Value(0)).current;     
  const aBtns = useRef(new Animated.Value(0)).current;     

  useEffect(() => {
    [aIn, aTitle, aSec1, aSec2, aSec3, aBtns].forEach(v => v.setValue(0));
    Animated.sequence([
      Animated.timing(aIn, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(aTitle, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.stagger(120, [
        Animated.timing(aSec1, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(aSec2, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(aSec3, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
      Animated.timing(aBtns, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [aIn, aTitle, aSec1, aSec2, aSec3, aBtns]);

  const loadStats = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(CREATED_KEY);
      const arr: SavedMeditation[] = raw ? JSON.parse(raw) : [];
      const minutes = arr.reduce((s, it) => s + (Number(it.minutes) || 0), 0);

      let catSessions = 0;
      let favCat: string = '…';
      const csRaw = await AsyncStorage.getItem(CAT_STATS_KEY);
      if (csRaw) {
        const cs: CatStats = JSON.parse(csRaw);
        const entries = (Object.entries(cs) as [CatKey, number][])
          .filter(([, v]) => typeof v === 'number');
        catSessions = entries.reduce((s, [, v]) => s + v, 0);
        if (entries.length) {
          const [bestKey] = entries.sort((a, b) => b[1] - a[1])[0];
          favCat = FAV_LABEL[bestKey];
        }
      }

      setTotalMinutes(minutes);
      setSessionCount(arr.length + catSessions);
      setFav(favCat);
    } catch {
      setTotalMinutes(0);
      setSessionCount(0);
      setFav('…');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [loadStats])
  );

  const shareStats = async () => {
    const msg =
      `My meditation stats:\n` +
      `• Total time: ${totalMinutes} minutes\n` +
      `• Sessions: ${sessionCount}\n` +
      `• Favorite: ${fav === '…' ? '—' : fav}`;
    try {
      await Share.share({ message: msg });
    } catch {}
  };

  const resetStats = () => {
    Alert.alert(
      'Reset statistics',
      'Are you sure you want to reset all statistics and saved meditations?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem(CREATED_KEY);
              await AsyncStorage.removeItem(CAT_STATS_KEY);
              await Promise.all(MEDI_KEYS_TO_RESET.map(k => AsyncStorage.removeItem(k)));
              DeviceEventEmitter.emit('meditations:reset');
            } finally {
              loadStats();
            }
          },
        },
      ]
    );
  };

  const fadeIn = (v: Animated.Value) => v.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const slideUp = (v: Animated.Value, dist = 18) =>
    v.interpolate({ inputRange: [0, 1], outputRange: [dist, 0] });

  const valueAnimStyle = [
    styles.value,
    {
      transform: [{ scale: aIn.interpolate({ inputRange: [0, 1], outputRange: [0.985, 1] }) }],
      opacity: aIn,
    } as any,
  ] as any;

  return (
    <FullBG>
      <ScrollView
        contentContainerStyle={[
          styles.container,
          {
            paddingTop: insets.top + Math.round(24 * k),
            paddingBottom: insets.bottom + Math.round(28 * k),
            paddingHorizontal: Math.round(22 * k),
          },
        ]}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
  
        <TitleImage
          source={TITLE_IMG.statistics}
          fallbackText="Statistics"
          width={TITLE_W}
          height={TITLE_H}
          animatedOpacity={fadeIn(aTitle)}
          animatedTranslate={slideUp(aTitle, 14)}
        />

        <View style={{ height: Math.round(16 * k) }} />

        <View style={styles.section}>
          <TitleImage
            source={TITLE_IMG.total}
            fallbackText="Total meditation time"
            width={SEC_TITLE_W}
            height={SEC_TITLE_H}
            animatedOpacity={fadeIn(aSec1)}
            animatedTranslate={slideUp(aSec1, 12)}
          />
          <View style={{ height: Math.round(8 * k) }} />
          <Animated.Text style={valueAnimStyle}>{totalMinutes} MINUTES</Animated.Text>
        </View>

        <View style={styles.section}>
          <TitleImage
            source={TITLE_IMG.sessions}
            fallbackText="Number of completed sessions"
            width={SEC_TITLE_W}
            height={SEC_TITLE_H}
            animatedOpacity={fadeIn(aSec2)}
            animatedTranslate={slideUp(aSec2, 12)}
          />
          <View style={{ height: Math.round(8 * k) }} />
          <Animated.Text style={valueAnimStyle}>{sessionCount}</Animated.Text>
        </View>

        <View style={styles.section}>
          <TitleImage
            source={TITLE_IMG.favorite}
            fallbackText="Favorite category"
            width={SEC_TITLE_W}
            height={SEC_TITLE_H}
            animatedOpacity={fadeIn(aSec3)}
            animatedTranslate={slideUp(aSec3, 12)}
          />
          <View style={{ height: Math.round(8 * k) }} />
          <Animated.Text style={valueAnimStyle}>{fav}</Animated.Text>
        </View>

        <View style={{ height: Math.round(22 * k) }} />

        <Animated.View
          style={{
            opacity: fadeIn(aBtns),
            transform: [{ translateY: slideUp(aBtns, 16) }],
            gap: Math.round(12 * k),
            alignItems: 'center',
          }}
        >
          <Pressable onPress={shareStats} hitSlop={10} style={{ alignItems: 'center' }}>
            <Image source={BTN_IMG.share} resizeMode="contain" style={{ width: BTN_W, height: BTN_H }} />
          </Pressable>

          <Pressable onPress={resetStats} hitSlop={10} style={{ alignItems: 'center' }}>
            <Image source={BTN_IMG.reset} resizeMode="contain" style={{ width: BTN_W, height: BTN_H }} />
          </Pressable>
        </Animated.View>
      </ScrollView>
    </FullBG>
  );
}

const styles = StyleSheet.create({
  container: {},
  section: { marginBottom: 18 },
  value: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1.2,
    textAlign: 'center',
  },
});
