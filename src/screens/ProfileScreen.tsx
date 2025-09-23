import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
  DeviceEventEmitter,
  useWindowDimensions,
  ImageSourcePropType,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FullBG from '../components/FullBG';
import { stopMusic } from '../native/Music';

const ImagePicker = require('react-native-image-picker');

const GOLD = '#E89E01';
const PROFILE_KEY = '@profile:v1';
const SETTINGS_KEY = '@settings:v1';
const MEDI_KEYS = ['@createdMeditations:v1', '@myMeditations:v1', '@customMeditations:v1'];

type SavedMeditation = { id: string; name: string; minutes: number; createdAt: number };
type ProfileData = { name?: string; avatarUri?: string };

const TITLE_IMG: {
  profile: ImageSourcePropType;
  settings: ImageSourcePropType;
  my: ImageSourcePropType;
} = {
  profile: require('../assets/Profile.png'),
  settings: require('../assets/settings.png'),
  my: require('../assets/My_meditations.png'),
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
  if (source) {
    return (
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
    );
  }
  return (
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

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { width, height } = useWindowDimensions();

  const kBase = Math.min(width / 375, height / 812);
  const k = Math.max(0.82, Math.min(1.1, kBase));

  const AVATAR = Math.round(56 * k);
  const CHIP = Math.round(58 * k);
  const TITLE_W = Math.min(Math.round(260 * k), Math.round(width * 0.8));
  const TITLE_H = Math.max(36, Math.round(58 * k));

  const LIST_MAX_HEIGHT = Math.max(
    Math.round(180 * k) - 30,
    Math.min(Math.round(height * 0.34), Math.round(height - (insets.top + tabBarHeight + 280 * k))) - 30
  );

  const [name, setName] = useState('ANON');
  const [editText, setEditText] = useState('ANON');
  const [editing, setEditing] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | undefined>(undefined);

  const [musicOn, setMusicOn] = useState(true);
  const [notifOn, setNotifOn] = useState(true);
  const [items, setItems] = useState<SavedMeditation[]>([]);

  const aIn = useRef(new Animated.Value(0)).current;
  const aTitle1 = useRef(new Animated.Value(0)).current;
  const aTitle2 = useRef(new Animated.Value(0)).current;
  const aTitle3 = useRef(new Animated.Value(0)).current;
  const aList = useRef(new Animated.Value(0)).current;

  const toastA = useRef(new Animated.Value(0)).current;
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    aIn.setValue(0); aTitle1.setValue(0); aTitle2.setValue(0); aTitle3.setValue(0); aList.setValue(0);
    Animated.sequence([
      Animated.timing(aIn, { toValue: 1, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.stagger(120, [
        Animated.timing(aTitle1, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(aTitle2, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(aTitle3, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
      Animated.timing(aList, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [aIn, aTitle1, aTitle2, aTitle3, aList]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    toastA.stopAnimation();
    toastA.setValue(0);
    Animated.sequence([
      Animated.timing(toastA, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(2300),
      Animated.timing(toastA, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start();
  };

  const loadProfile = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(PROFILE_KEY);
      const p = (raw ? JSON.parse(raw) : {}) as ProfileData;
      const nm = (p?.name || 'ANON').toUpperCase();
      setName(nm);
      setEditText(nm);
      if (p?.avatarUri) setAvatarUri(p.avatarUri);
    } catch {}
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(SETTINGS_KEY);
      const s = raw ? (JSON.parse(raw) as { musicOn?: boolean; notifOn?: boolean }) : {};
      const m = typeof s.musicOn === 'boolean' ? s.musicOn : true;
      const n = typeof s.notifOn === 'boolean' ? s.notifOn : true;
      setMusicOn(m);
      setNotifOn(n);
    } catch {}
  }, []);

  const loadMeditations = useCallback(async () => {
    try {
      const all: SavedMeditation[] = [];
      for (const key of MEDI_KEYS) {
        const raw = await AsyncStorage.getItem(key);
        if (raw) {
          const arr = JSON.parse(raw) as SavedMeditation[];
          if (Array.isArray(arr)) all.push(...arr);
        }
      }
      const map = new Map<string, SavedMeditation>();
      all.forEach((it) => map.set(it.id, it));
      const merged = Array.from(map.values()).sort((a, b) => b.createdAt - a.createdAt);
      setItems(merged);
    } catch {}
  }, []);

  useEffect(() => {
    loadProfile();
    loadSettings();
    loadMeditations();
  }, [loadProfile, loadSettings, loadMeditations]);

  useFocusEffect(
    useCallback(() => {
      loadMeditations();
    }, [loadMeditations])
  );

  const saveProfile = async (next: Partial<ProfileData>) => {
    try {
      const raw = (await AsyncStorage.getItem(PROFILE_KEY)) || '{}';
      const prev = JSON.parse(raw) as ProfileData;
      const merged = { ...prev, ...next };
      await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(merged));
    } catch {}
  };

  const onSaveName = async () => {
    const val = (editText || '').trim() || 'ANON';
    const up = val.toUpperCase();
    setName(up);
    setEditing(false);
    await saveProfile({ name: val });
    DeviceEventEmitter.emit('profile:nameChanged', up);
    showToast('Name saved');
  };

  const pickAvatar = async () => {
    try {
      const res = await ImagePicker.launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        selectionLimit: 1,
      });
      const uri: string | undefined = res?.assets?.[0]?.uri;
      if (uri) {
        setAvatarUri(uri);
        await saveProfile({ avatarUri: uri });
        showToast('Avatar updated');
      }
    } catch {}
  };

  const saveSettings = async (m: boolean, n: boolean) => {
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify({ musicOn: m, notifOn: n }));
    } catch {}
  };

  const toggleMusic = (v: boolean) => {
    setMusicOn(v);
    void saveSettings(v, notifOn);
    DeviceEventEmitter.emit('settings:musicOnChanged', v);
    if (!v) {
      void stopMusic();
      showToast('Music: OFF');
    } else {
      showToast('Music: ON');
    }
  };

  const toggleNotif = (v: boolean) => {
    setNotifOn(v);
    void saveSettings(musicOn, v);
    showToast(`Notifications: ${v ? 'ON' : 'OFF'}`);
  };

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}.${mm}.${yyyy}`;
  };

  const fadeIn = (v: Animated.Value) => v.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const slideUp = (v: Animated.Value, dist = 20) =>
    v.interpolate({ inputRange: [0, 1], outputRange: [dist, 0] });

  return (
    <FullBG>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.container,
            {
              paddingTop: insets.top + Math.round(24 * k),
              paddingHorizontal: Math.round(18 * k),
              paddingBottom: insets.bottom + tabBarHeight + Math.round(12 * k),
              rowGap: Math.round(12 * k),
            },
          ]}
          bounces={false}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={{
              width: '100%',
              opacity: fadeIn(aIn),
              transform: [
                { translateY: slideUp(aIn, 18) },
                { scale: aIn.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1] }) },
              ],
            }}
          >
            <TitleImage
              source={TITLE_IMG.profile}
              fallbackText="Profile"
              width={TITLE_W}
              height={TITLE_H}
              animatedOpacity={fadeIn(aTitle1)}
              animatedTranslate={slideUp(aTitle1, 14)}
            />

            <View style={[styles.profileRow, { marginTop: Math.round(14 * k) }]}>
              <Pressable onPress={pickAvatar}>
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={[styles.avatar, { width: AVATAR, height: AVATAR, borderRadius: Math.round(14 * k) }]} />
                ) : (
                  <Image source={require('../assets/image.png')} style={[styles.avatar, { width: AVATAR, height: AVATAR, borderRadius: Math.round(14 * k) }]} />
                )}
              </Pressable>

              <View style={[styles.nameBox, { height: Math.round(50 * k), borderRadius: Math.round(14 * k), paddingHorizontal: Math.round(14 * k) }]}>
                {editing ? (
                  <TextInput
                    value={editText}
                    onChangeText={setEditText}
                    placeholder="YOUR NAME"
                    placeholderTextColor="rgba(255,255,255,0.5)"
                    style={[styles.nameInput, { fontSize: Math.round(18 * k) }]}
                    maxLength={20}
                    returnKeyType="done"
                    onSubmitEditing={onSaveName}
                  />
                ) : (
                  <Text style={[styles.nameText, { fontSize: Math.round(18 * k) }]}>{name}</Text>
                )}
              </View>

              {editing ? (
                <Pressable
                  onPress={onSaveName}
                  style={[
                    styles.editBtn,
                    styles.saveBtn,
                    { width: Math.round(50 * k), height: Math.round(50 * k), borderRadius: Math.round(14 * k) },
                  ]}
                  hitSlop={10}
                >
                  <Text style={[styles.editIcon, { fontSize: Math.round(18 * k) }]}>✓</Text>
                </Pressable>
              ) : (
                <Pressable
                  onPress={() => {
                    setEditText(name);
                    setEditing(true);
                  }}
                  style={[styles.editBtn, { width: Math.round(50 * k), height: Math.round(50 * k), borderRadius: Math.round(14 * k) }]}
                  hitSlop={10}
                >
                  <Text style={[styles.editIcon, { fontSize: Math.round(18 * k) }]}>✎</Text>
                </Pressable>
              )}
            </View>

            <View style={{ height: Math.round(10 * k) }} />
            <TitleImage
              source={TITLE_IMG.settings}
              fallbackText="Settings"
              width={TITLE_W}
              height={TITLE_H}
              animatedOpacity={fadeIn(aTitle2)}
              animatedTranslate={slideUp(aTitle2, 14)}
            />

            <View style={[styles.settingRow, { marginTop: Math.round(10 * k) }]}>
              <Text style={[styles.settingLabel, { fontSize: Math.round(16 * k) }]}>Music meditation</Text>
              <View style={[styles.chipsRow, { columnGap: Math.round(10 * k) }]}>
                <Chip label="OFF" size={CHIP} active={!musicOn} onPress={() => toggleMusic(false)} />
                <Chip label="ON"  size={CHIP} active={musicOn}  onPress={() => toggleMusic(true)} />
              </View>
            </View>

            <View style={[styles.settingRow, { marginTop: Math.round(10 * k) }]}>
              <Text style={[styles.settingLabel, { fontSize: Math.round(16 * k) }]}>Notification</Text>
              <View style={[styles.chipsRow, { columnGap: Math.round(10 * k) }]}>
                <Chip label="OFF" size={CHIP} active={!notifOn} onPress={() => toggleNotif(false)} />
                <Chip label="ON"  size={CHIP} active={notifOn}  onPress={() => toggleNotif(true)} />
              </View>
            </View>

            <View style={{ height: Math.round(12 * k) }} />
            <TitleImage
              source={TITLE_IMG.my}
              fallbackText="My meditations"
              width={TITLE_W}
              height={TITLE_H}
              animatedOpacity={fadeIn(aTitle3)}
              animatedTranslate={slideUp(aTitle3, 14)}
            />

            <Animated.View
              style={[
                styles.myListWrap,
                {
                  maxHeight: LIST_MAX_HEIGHT,
                  marginTop: Math.round(8 * k),
                  marginBottom: Math.round(8 * k),
                  borderRadius: Math.round(16 * k),
                  borderWidth: 2,
                  opacity: fadeIn(aList),
                  transform: [{ translateY: slideUp(aList, 12) }],
                },
              ]}
            >
              {items.length === 0 ? (
                <View style={[styles.emptyBox, { paddingVertical: Math.round(20 * k) }]}>
                  <Text style={styles.emptyText}>No meditations</Text>
                </View>
              ) : (
                <ScrollView
                  style={styles.myList}
                  contentContainerStyle={[styles.myListContent, { padding: Math.round(12 * k) }]}
                  nestedScrollEnabled
                  showsVerticalScrollIndicator
                  contentInset={{ bottom: Math.max(8, tabBarHeight / 2) }}
                >
                  {items.map((it) => (
                    <View key={it.id} style={[styles.card, { borderRadius: Math.round(16 * k), padding: Math.round(14 * k), marginBottom: Math.round(10 * k) }]}>
                      <View style={styles.cardHeader}>
                        <Text style={[styles.cardTitle, { fontSize: Math.round(16 * k) }]} numberOfLines={1}>
                          {it.name}
                        </Text>
                        <Text style={[styles.cardDate, { fontSize: Math.round(12 * k) }]}>{formatDate(it.createdAt)}</Text>
                      </View>
                      <Text style={[styles.cardSubtitle, { fontSize: Math.round(12 * k) }]}>Duration: {it.minutes} minutes</Text>
                      <View style={[styles.progressOuter, { height: Math.max(6, Math.round(8 * k)), borderRadius: Math.round(6 * k) }]}>
                        <View style={styles.progressInner} />
                      </View>
                    </View>
                  ))}
                </ScrollView>
              )}
            </Animated.View>
          </Animated.View>
        </ScrollView>

        <Animated.View
          pointerEvents="none"
          style={[
            styles.toast,
            {
              left: Math.round(18 * k),
              right: Math.round(18 * k),
              bottom: Math.round(24 * k) + insets.bottom,
              opacity: toastA,
              transform: [{ translateY: toastA.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
            },
          ]}
        >
          <Text style={styles.toastText}>{toastMsg}</Text>
        </Animated.View>
      </KeyboardAvoidingView>
    </FullBG>
  );
}

function Chip({
  label,
  active,
  onPress,
  size,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  size: number;
}) {
  return (
    <Pressable onPress={onPress}>
      <View
        style={[
          styles.chip,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: active ? GOLD : 'rgba(35,11,6,0.85)',
            borderColor: GOLD,
          },
        ]}
      >
        <Text style={[styles.chipText, { color: active ? '#2c1206' : '#fff' }]}>{label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {},
  profileRow: { flexDirection: 'row', alignItems: 'center', columnGap: 12 },
  avatar: { width: 56, height: 56, borderRadius: 14 },
  nameBox: {
    flex: 1,
    height: 50,
    borderWidth: 2,
    borderColor: GOLD,
    backgroundColor: 'rgba(35,11,6,0.85)',
    justifyContent: 'center',
  },
  nameText: { color: '#fff', fontWeight: '800' },
  nameInput: { color: '#fff', fontWeight: '800', padding: 0 },
  editBtn: {
    borderWidth: 2,
    borderColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(35,11,6,0.85)',
  },
  saveBtn: { backgroundColor: GOLD, borderColor: GOLD },
  editIcon: { color: GOLD, fontWeight: '900' },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  settingLabel: { color: '#fff', fontWeight: '700' },
  chipsRow: { flexDirection: 'row' },
  chip: { borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  chipText: { fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },
  myListWrap: {
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(0,0,0,0.28)',
    overflow: 'hidden',
  },
  myList: {},
  myListContent: {},
  emptyBox: {
    alignItems: 'center',
  },
  emptyText: { color: 'rgba(255,255,255,0.75)', fontWeight: '700' },
  card: { borderWidth: 2, borderColor: GOLD, backgroundColor: 'rgba(35,11,6,0.85)' },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  cardTitle: { flex: 1, color: '#fff', fontWeight: '800' },
  cardDate: { color: 'rgba(255,255,255,0.7)', marginLeft: 8 },
  cardSubtitle: { color: 'rgba(255,255,255,0.85)', fontWeight: '700' },
  progressOuter: {
    marginTop: 8,
    borderWidth: 2,
    borderColor: GOLD,
    backgroundColor: 'rgba(0,0,0,0.35)',
    overflow: 'hidden',
  },
  progressInner: { height: '100%', backgroundColor: GOLD },
  toast: {
    position: 'absolute',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
  },
  toastText: { color: '#fff', fontWeight: '700' },
});