import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View, StyleSheet, Image, Text, TextInput, Pressable,
  useWindowDimensions, Platform, KeyboardAvoidingView, Animated, Easing, ScrollView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import FullBG from '../components/FullBG';
import { launchImageLibrary, Asset } from 'react-native-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFS from 'react-native-fs';

type Props = NativeStackScreenProps<RootStackParamList, 'Registration'>;

const BASE_W = 375;
const BASE_H = 812;
const GOLD = '#E89E01';
const PANEL = 'rgba(35, 11, 6, 0.85)';
const PROFILE_KEY = '@profile:v1';

type Profile = { name: string; photoUri: string | null };

export default function RegistrationScreen({ navigation }: Props) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const [photo, setPhoto] = useState<Asset | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [name, setName] = useState('');

  const k = Math.min(width / BASE_W, height / BASE_H);
  const sized = (baseW: number, baseH: number) => {
    const maxW = Math.min(width * 0.86, baseW * k * 1.15);
    const w = Math.min(baseW * k, maxW);
    const h = (baseH / baseW) * w;
    return { width: Math.round(w), height: Math.round(h) };
  };

  const S = useMemo(() => ({
    title: sized(260, 54),
    photo: sized(260, 260),
    input: sized(300, 56),
    btn: sized(332, 80),
    vGapLg: Math.max(16, Math.round(22 * k)),
    radiusLg: Math.round(22 * k),
    radiusSm: Math.round(16 * k),
    footnote: Math.max(11, Math.round(12 * k)),
  }), [k, width, height]);

  const aTitle = useRef(new Animated.Value(0)).current;
  const aPhoto = useRef(new Animated.Value(0)).current;
  const aNick = useRef(new Animated.Value(0)).current;
  const aNote = useRef(new Animated.Value(0)).current;
  const aBtn = useRef(new Animated.Value(0)).current;
  const btnScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    aTitle.setValue(0); aPhoto.setValue(0); aNick.setValue(0); aNote.setValue(0);
    Animated.stagger(120, [
      Animated.timing(aTitle, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(aPhoto, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(aNick,  { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(aNote,  { toValue: 1, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    Animated.timing(aBtn, {
      toValue: name.trim().length > 0 ? 1 : 0,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [name, aBtn]);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(PROFILE_KEY);
        if (raw) {
          const p: Profile = JSON.parse(raw);
          setName(p.name || '');
          setPhotoUri(p.photoUri || null);
        }
      } catch {}
    })();
  }, []);

  useEffect(() => {
    const t = setTimeout(async () => {
      const payload: Profile = { name: name.trim(), photoUri };
      try { await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(payload)); } catch {}
    }, 150);
    return () => clearTimeout(t);
  }, [name, photoUri]);

  const persistAsset = async (asset: Asset): Promise<string | null> => {
    if (!asset.uri) return null;
    try {
      const ext = (asset.fileName?.split('.').pop() || 'jpg').toLowerCase();
      const destPath = `${RNFS.DocumentDirectoryPath}/profile.${ext}`;
      await RNFS.copyFile(asset.uri, destPath);
      return Platform.OS === 'ios' ? `file://${destPath}` : destPath;
    } catch {
      return asset.uri; 
    }
  };

  const pickPhoto = async () => {
    const res = await launchImageLibrary({ mediaType: 'photo', selectionLimit: 1, quality: 0.9 });
    if (!res.didCancel && res.assets && res.assets.length) {
      const asset = res.assets[0];
      const local = await persistAsset(asset);
      setPhoto(asset);
      setPhotoUri(local);
    }
  };

  const onContinue = () =>
    navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });

  const animFromTop = {
    opacity: aTitle,
    transform: [{ translateY: aTitle.interpolate({ inputRange: [0, 1], outputRange: [-18, 0] }) }],
  };
  const animFromLeft = {
    opacity: aPhoto,
    transform: [{ translateX: aPhoto.interpolate({ inputRange: [0, 1], outputRange: [-40 * k, 0] }) }],
  };
  const animFromRight = {
    opacity: aNick,
    transform: [{ translateX: aNick.interpolate({ inputRange: [0, 1], outputRange: [40 * k, 0] }) }],
  };
  const animNote = {
    opacity: aNote,
    transform: [{ translateY: aNote.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
  };
  const animBtn = {
    opacity: aBtn,
    transform: [
      { translateY: aBtn.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) },
      { scale: aBtn.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1] }) },
    ],
  };
  const onPressIn = () => Animated.spring(btnScale, { toValue: 0.97, useNativeDriver: true }).start();
  const onPressOut = () => Animated.spring(btnScale, { toValue: 1, useNativeDriver: true }).start();

  return (
    <FullBG>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView
          bounces={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingTop: insets.top + 20,
            paddingBottom: insets.bottom + 24,
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: height - (insets.top + insets.bottom),
          }}
        >
          <Animated.Image source={require('../assets/title.png')} style={[S.title, animFromTop, { alignSelf: 'center' }]} resizeMode="contain" />
          <View style={{ height: S.vGapLg }} />
          <Animated.Text style={[styles.sectionLabel, animFromTop]}>Your photo</Animated.Text>

          <Animated.View style={animFromLeft}>
            <Pressable onPress={pickPhoto} style={[styles.photoBox, { width: S.photo.width, height: S.photo.height, borderRadius: S.radiusLg }]}>
              {(photoUri) ? (
                <Image source={{ uri: photoUri }} style={{ width: '100%', height: '100%', borderRadius: S.radiusLg }} resizeMode="cover" />
              ) : (
                <View style={styles.photoInner}>
                  <Image source={require('../assets/camera.png')} style={{ width: 44 * k, height: 44 * k }} resizeMode="contain" />
                </View>
              )}
            </Pressable>
          </Animated.View>

          <View style={{ height: S.vGapLg }} />
          <Animated.Text style={[styles.sectionLabel, animFromRight]}>Nickname</Animated.Text>

          <Animated.View style={animFromRight}>
            <View style={[styles.inputWrap, { width: S.input.width, height: S.input.height, borderRadius: S.radiusSm }]}>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Your nickname"
                placeholderTextColor="rgba(255,255,255,0.5)"
                style={styles.input}
                autoCapitalize="characters"
                maxLength={16}
                returnKeyType="done"
              />
            </View>
          </Animated.View>

          <View style={{ height: S.vGapLg }} />
          <Animated.Text style={[styles.note, { fontSize: S.footnote }, animNote]}>
            All data remains anonymous.{'\n'}We do not collect any personal information.
          </Animated.Text>

          {name.trim().length > 0 && (
            <Animated.View style={[{ marginTop: S.vGapLg }, animBtn]}>
              <Pressable onPressIn={onPressIn} onPressOut={onPressOut} onPress={onContinue}>
                <Animated.Image
                  source={require('../assets/Gro1.png')}
                  style={[S.btn, { alignSelf: 'center', transform: [{ scale: btnScale }] }]}
                  resizeMode="contain"
                />
              </Pressable>
            </Animated.View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </FullBG>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  sectionLabel: { color: '#FFFFFF', fontSize: 16, fontWeight: '600', textAlign: 'center' },
  photoBox: {
    backgroundColor: GOLD, overflow: 'hidden', borderWidth: 2, borderColor: GOLD,
    elevation: 6, shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 6 },
  },
  photoInner: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  inputWrap: { backgroundColor: PANEL, borderWidth: 2, borderColor: GOLD, paddingHorizontal: 18, justifyContent: 'center' },
  input: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 1, textAlign: 'center' },
  note: { color: GOLD, textAlign: 'center', opacity: 0.9, lineHeight: 18 },
});
