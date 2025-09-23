import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Image,
  Text,
  Pressable,
  ScrollView,
  useWindowDimensions,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FullBG from '../components/FullBG';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../navigation/types';

const BASE_W = 375;
const BASE_H = 812;
const GOLD = '#E89E01';
const PROFILE_KEY = '@profile:v1';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [name, setName] = useState<string>('FRIEND');

  const nav = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(PROFILE_KEY);
        if (raw) {
          const p = JSON.parse(raw) as { name?: string };
          if (p?.name) setName(p.name.toUpperCase());
        }
      } catch {}
    })();
  }, []);

  const k = Math.min(width / BASE_W, height / BASE_H);
  const sized = (w: number, h: number) => {
    const W = Math.min(w * k, width * 0.9);
    return { width: Math.round(W), height: Math.round((h / w) * W) };
  };

  const S = useMemo(
    () => ({
      topIcon: { width: Math.round(52 * k), height: Math.round(52 * k) },
      eight: sized(275, 282),
    
      card: { width: Math.round(105 * k), height: Math.round(161 * k) },
  
      cardGreen: {
        width: Math.round(105 * 1.12 * k),
        height: Math.round(161 * 1.12 * k),
      },
      gapLG: Math.max(16, Math.round(22 * k)),
      gapSM: Math.max(8, Math.round(12 * k)),
      padH: Math.max(16, Math.round(20 * k)),
    }),
    [k, width, height]
  );

  const aHeader = useRef(new Animated.Value(0)).current;
  const aEight = useRef(new Animated.Value(0)).current;
  const aChoose = useRef(new Animated.Value(0)).current;
  const aCard1 = useRef(new Animated.Value(0)).current; 
  const aCard2 = useRef(new Animated.Value(0)).current; 
  const aCard3 = useRef(new Animated.Value(0)).current; 

  useEffect(() => {
    [aHeader, aEight, aChoose, aCard1, aCard2, aCard3].forEach(v => v.setValue(0));
    Animated.stagger(120, [
      Animated.timing(aHeader, { toValue: 1, duration: 480, easing: Easing.out(Easing.back(1.2)), useNativeDriver: true }),
      Animated.timing(aEight,  { toValue: 1, duration: 440, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(aChoose, { toValue: 1, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(aCard1, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(aCard2, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(aCard3, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
    ]).start();
  }, [aHeader, aEight, aChoose, aCard1, aCard2, aCard3]);

  const goCategory = (key: 'calm' | 'energy' | 'break') => {
    nav.navigate('CategoryMeditation', { category: key });
  };

  const headerStyle = {
    opacity: aHeader,
    transform: [
      { translateY: aHeader.interpolate({ inputRange: [0, 1], outputRange: [-30, 0] }) },
      { scale: aHeader.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) },
    ],
  };

  const eightStyle = {
    opacity: aEight,
    transform: [{ translateY: aEight.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }],
  };

  const chooseStyle = {
    opacity: aChoose,
    transform: [{ translateX: aChoose.interpolate({ inputRange: [0, 1], outputRange: [-60, 0] }) }],
  };

  const cardStyleLeft = {
    opacity: aCard1,
    transform: [{ translateX: aCard1.interpolate({ inputRange: [0, 1], outputRange: [-80, 0] }) }],
  };
  const cardStyleBottom = {
    opacity: aCard2,
    transform: [{ translateY: aCard2.interpolate({ inputRange: [0, 1], outputRange: [70, 0] }) }],
  };
  const cardStyleRight = {
    opacity: aCard3,
    transform: [{ translateX: aCard3.interpolate({ inputRange: [0, 1], outputRange: [80, 0] }) }],
  };

  return (
    <FullBG>
      <ScrollView
        contentContainerStyle={[
          styles.container,
          {
          
            paddingTop: insets.top + 16 + (Platform.OS === 'android' ? 20 : 0),
            paddingBottom: insets.bottom + 24,
            paddingHorizontal: S.padH,
            minHeight: height,
          },
        ]}
        bounces={false}
      >
        <Animated.View style={[styles.headerRow, headerStyle]}>
          <Image source={require('../assets/image.png')} style={S.topIcon} resizeMode="contain" />
          <Text style={[styles.hello, { marginLeft: 10 }]}>
            HELLO, <Text style={styles.helloName}>{name}</Text>
          </Text>
        </Animated.View>

        <View style={{ height: S.gapLG }} />

        <Animated.Image
          source={require('../assets/eight.png')}
          style={[S.eight, { alignSelf: 'center' }, eightStyle]}
          resizeMode="contain"
        />

        <View style={{ height: S.gapLG }} />

        <Animated.Text style={[styles.choose, chooseStyle]}>CHOOSE A CATEGORY:</Animated.Text>

        <View style={{ height: S.gapSM }} />

        <View style={styles.cardsRow}>
          <Animated.View style={cardStyleLeft}>
            <Pressable onPress={() => goCategory('calm')} style={styles.cardWrap} hitSlop={8}>
              <Image source={require('../assets/dragon_blue.png')} style={S.card} resizeMode="contain" />
            </Pressable>
          </Animated.View>

          <Animated.View style={cardStyleBottom}>
            <Pressable onPress={() => goCategory('energy')} style={styles.cardWrap} hitSlop={8}>
              <Image source={require('../assets/dragon_yellow.png')} style={S.card} resizeMode="contain" />
            </Pressable>
          </Animated.View>

          <Animated.View style={cardStyleRight}>
            <Pressable onPress={() => goCategory('break')} style={styles.cardWrap} hitSlop={8}>
              <Image source={require('../assets/dragon_green.png')} style={S.cardGreen} resizeMode="contain" />
            </Pressable>
          </Animated.View>
        </View>
      </ScrollView>
    </FullBG>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center' },
  headerRow: { width: '100%', flexDirection: 'row', alignItems: 'center' },
  hello: {
    color: GOLD,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowRadius: 6,
    textShadowOffset: { width: 0, height: 2 },
  },
  helloName: { color: GOLD, fontSize: 22, fontWeight: '900', letterSpacing: 1.8 },
  choose: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  cardsRow: { width: '100%', marginTop: 8, flexDirection: 'row', justifyContent: 'space-between' },
  cardWrap: { alignItems: 'center', justifyContent: 'center' },
});
