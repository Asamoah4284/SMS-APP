import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useSchool } from '../context/SchoolContext';
import { colors, radius, shadowCard } from '../theme';

export default function AuthScreen() {
  const { lookupByPhone, selectChild, lookupPhone, lookupToken, childrenList, clearLookupCache } = useAuth();
  const { school } = useSchool();
  const insets = useSafeAreaInsets();

  const heroFade = useRef(new Animated.Value(0)).current;
  const heroLift = useRef(new Animated.Value(14)).current;
  const cardFade = useRef(new Animated.Value(0)).current;
  const cardLift = useRef(new Animated.Value(20)).current;
  const resultPulse = useRef(new Animated.Value(1)).current;
  const confettiRingScale = useRef(new Animated.Value(0.35)).current;
  const confettiRingOpacity = useRef(new Animated.Value(0)).current;
  const confettiSparkOpacity = useRef(new Animated.Value(0)).current;
  const childRowAnims = useRef([]).current;

  const [phone, setPhone] = useState(lookupPhone || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // After a successful lookup we hold the children list + token here
  // Initialize with stored lookup result to support switching child
  const [result, setResult] = useState(
    lookupToken && childrenList 
      ? { children: childrenList, token: lookupToken }
      : null
  );
  const [selecting, setSelecting] = useState(null); // studentId being selected

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(heroFade, {
          toValue: 1,
          duration: 420,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(heroLift, {
          toValue: 0,
          duration: 420,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(cardFade, {
          toValue: 1,
          duration: 380,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(cardLift, {
          toValue: 0,
          duration: 380,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [cardFade, cardLift, heroFade, heroLift]);

  useEffect(() => {
    if (!result?.children?.length) {
      childRowAnims.length = 0;
      return;
    }

    childRowAnims.length = 0;
    result.children.forEach(() => childRowAnims.push(new Animated.Value(0)));

    confettiRingScale.setValue(0.35);
    confettiRingOpacity.setValue(0);
    confettiSparkOpacity.setValue(0);

    Animated.parallel([
      Animated.sequence([
        Animated.timing(resultPulse, {
          toValue: 1.03,
          duration: 180,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(resultPulse, {
          toValue: 1,
          duration: 180,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(confettiRingOpacity, {
          toValue: 0.6,
          duration: 120,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(confettiRingScale, {
          toValue: 1.25,
          duration: 480,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(confettiSparkOpacity, {
            toValue: 1,
            duration: 120,
            useNativeDriver: true,
          }),
          Animated.timing(confettiSparkOpacity, {
            toValue: 0,
            duration: 320,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.delay(120),
          Animated.timing(confettiRingOpacity, {
            toValue: 0,
            duration: 280,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      ]),
      Animated.stagger(
        80,
        childRowAnims.map((anim) =>
          Animated.timing(anim, {
            toValue: 1,
            duration: 300,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          })
        )
      ),
    ]).start();
  }, [
    result,
    resultPulse,
    confettiRingScale,
    confettiRingOpacity,
    confettiSparkOpacity,
    childRowAnims,
  ]);

  const handleLookup = async () => {
    if (!phone.trim()) {
      setError('Please enter your phone number.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const data = await lookupByPhone(phone.trim());
      setResult(data);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectChild = async (child) => {
    setSelecting(child.studentId);
    try {
      await selectChild(
        {
          id: child.id,
          studentId: child.studentId,
          firstName: child.firstName,
          lastName: child.lastName,
          class: child.class,
        },
        result.token
      );
      // Navigation switches automatically via AuthContext state change in RootNavigator
    } catch {
      setSelecting(null);
    }
  };

  const linkedClasses = result
    ? new Set(result.children.map((c) => c.class?.name).filter(Boolean)).size
    : 0;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.bgBlobOne} />
      <View style={styles.bgBlobTwo} />

      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo area — show school branding if available */}
        <Animated.View
          style={[
            styles.logoWrap,
            {
              opacity: heroFade,
              transform: [{ translateY: heroLift }],
            },
          ]}
        >
          <View style={styles.logoIcon}>
            {school?.logo ? (
              <Image
                source={{ uri: school.logo }}
                style={styles.schoolLogo}
                resizeMode="contain"
              />
            ) : (
              <Ionicons name="school-outline" size={32} color={colors.iconBlue} />
            )}
          </View>
          <Text style={styles.appName}>Deacons Academy Foundation</Text>
          <Text style={styles.portalText}>Parent Portal</Text>
        </Animated.View>

        {/* Phone lookup card */}
        {!result && (
          <Animated.View
            style={[
              styles.card,
              shadowCard,
              {
                opacity: cardFade,
                transform: [{ translateY: cardLift }],
              },
            ]}
          >
            <Text style={styles.cardTitle}>Find your children</Text>
            <Text style={styles.cardSub}>
              Enter the phone number you used when enrolling your child.
            </Text>

            <View style={styles.tipRow}>
              <Ionicons name="shield-checkmark-outline" size={15} color={colors.iconBlue} />
              <Text style={styles.tipText}>Secure parent lookup for your linked students</Text>
            </View>

            {!!error && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={15} color={colors.red} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <View style={styles.inputWrap}>
              <Ionicons
                name="call-outline"
                size={18}
                color={colors.textSoft}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="e.g. 0241234567"
                placeholderTextColor={colors.textSoft}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={(v) => { setPhone(v); setError(''); }}
                returnKeyType="done"
                onSubmitEditing={handleLookup}
                autoFocus
              />
            </View>

            <Pressable
              style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
              onPress={handleLookup}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.btnText}>Find My Children</Text>
              )}
            </Pressable>
          </Animated.View>
        )}

        {/* Children list */}
        {result && (
          <Animated.View style={[styles.card, shadowCard, { transform: [{ scale: resultPulse }] }]}>
            <View pointerEvents="none" style={styles.burstLayer}>
              <Animated.View
                style={[
                  styles.burstRing,
                  {
                    opacity: confettiRingOpacity,
                    transform: [{ scale: confettiRingScale }],
                  },
                ]}
              />
              <Animated.View style={[styles.burstDot, styles.burstDotTop, { opacity: confettiSparkOpacity }]} />
              <Animated.View style={[styles.burstDot, styles.burstDotRight, { opacity: confettiSparkOpacity }]} />
              <Animated.View style={[styles.burstDot, styles.burstDotBottom, { opacity: confettiSparkOpacity }]} />
              <Animated.View style={[styles.burstDot, styles.burstDotLeft, { opacity: confettiSparkOpacity }]} />
              <Animated.View style={[styles.burstDot, styles.burstDotTopLeft, { opacity: confettiSparkOpacity }]} />
              <Animated.View style={[styles.burstDot, styles.burstDotBottomRight, { opacity: confettiSparkOpacity }]} />
            </View>

            <Text style={styles.cardTitle}>
              {result.children.length === 1
                ? '1 child found'
                : `${result.children.length} children found`}
            </Text>
            <Text style={styles.cardSub}>Tap to view your child's dashboard.</Text>

            <View style={styles.resultHeaderStrip}>
              <View style={styles.resultStatCard}>
                <Text style={styles.resultStatNumber}>{result.children.length}</Text>
                <Text style={styles.resultStatLabel}>Students</Text>
              </View>
              <View style={styles.resultStatCard}>
                <Text style={styles.resultStatNumber}>{linkedClasses}</Text>
                <Text style={styles.resultStatLabel}>Classes</Text>
              </View>
              <View style={styles.resultStatCard}>
                <Ionicons name="sparkles-outline" size={15} color={colors.iconBlue} />
                <Text style={styles.resultStatLabel}>Ready</Text>
              </View>
            </View>

            <View style={styles.childList}>
              {result.children.map((child, index) => {
                const rowAnim = childRowAnims[index] || new Animated.Value(1);
                return (
                  <Animated.View
                    key={child.id}
                    style={{
                      opacity: rowAnim,
                      transform: [
                        {
                          translateY: rowAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [10, 0],
                          }),
                        },
                      ],
                    }}
                  >
                    <Pressable
                      style={({ pressed }) => [
                        styles.childRow,
                        pressed && styles.childRowPressed,
                        selecting && selecting !== child.studentId && styles.childRowDimmed,
                      ]}
                      onPress={() => handleSelectChild(child)}
                      disabled={!!selecting}
                    >
                      {/* Avatar */}
                      <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                          {child.firstName[0]}{child.lastName[0]}
                        </Text>
                      </View>

                      <View style={styles.childInfo}>
                        <Text style={styles.childName}>
                          {child.firstName} {child.lastName}
                        </Text>
                        <View style={styles.metaRow}>
                          <View style={styles.classChip}>
                            <Text style={styles.classChipText}>{child.class?.name ?? 'No class'}</Text>
                          </View>
                          <Text style={styles.childMeta}>{child.studentId}</Text>
                        </View>
                      </View>

                      {selecting === child.studentId ? (
                        <ActivityIndicator size="small" color={colors.iconBlue} />
                      ) : (
                        <Ionicons
                          name="chevron-forward"
                          size={18}
                          color={colors.textSoft}
                        />
                      )}
                    </Pressable>
                  </Animated.View>
                );
              })}
            </View>

            <Pressable
              style={styles.backLink}
              onPress={() => { 
                setResult(null); 
                setPhone(''); 
                setError(''); 
                setSelecting(null); 
                clearLookupCache();
              }}
            >
              <Text style={styles.backLinkText}>Use a different number</Text>
            </Pressable>
          </Animated.View>
        )}

        {!!school?.motto && (
          <View style={styles.footerMottoWrap}>
            <Text style={styles.footerMotto}>{school.motto}</Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  bgBlobOne: {
    position: 'absolute',
    top: -70,
    right: -80,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#E6EEF9',
    opacity: 0.8,
  },
  bgBlobTwo: {
    position: 'absolute',
    top: 160,
    left: -90,
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: '#F3F7FD',
    opacity: 0.9,
  },

  // Logo
  logoWrap: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoIcon: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    backgroundColor: colors.iconBlueMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  appName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.3,
  },
  portalText: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
  },

  // Card
  card: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  cardSub: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 16,
    lineHeight: 18,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: radius.sm,
    backgroundColor: '#EEF4FF',
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    color: colors.text,
    fontWeight: '500',
  },

  // Error
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: colors.red,
    lineHeight: 17,
  },

  // Input
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 46,
    fontSize: 15,
    color: colors.text,
    fontWeight: '500',
  },

  // Button
  btn: {
    height: 48,
    backgroundColor: colors.iconBlue,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPressed: {
    opacity: 0.85,
  },
  btnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },

  // Children list
  childList: {
    gap: 6,
    marginTop: 2,
  },
  resultHeaderStrip: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  burstLayer: {
    position: 'absolute',
    top: 20,
    right: 22,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  burstRing: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#93C5FD',
  },
  burstDot: {
    position: 'absolute',
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#60A5FA',
  },
  burstDotTop: { top: -8 },
  burstDotRight: { right: -8 },
  burstDotBottom: { bottom: -8 },
  burstDotLeft: { left: -8 },
  burstDotTopLeft: { top: -5, left: -5 },
  burstDotBottomRight: { bottom: -5, right: -5 },
  resultStatCard: {
    flex: 1,
    minHeight: 52,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#F8FAFD',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  resultStatNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  resultStatLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
  },
  childRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
    paddingHorizontal: 10,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: '#FCFDFF',
  },
  childRowPressed: {
    backgroundColor: '#F3F7FD',
  },
  childRowDimmed: {
    opacity: 0.45,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.iconBlueMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.iconBlue,
  },
  childInfo: {
    flex: 1,
  },
  childName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  childMeta: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
  },
  metaRow: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  classChip: {
    backgroundColor: '#E9F1FF',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  classChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.iconBlue,
  },

  // Back link
  backLink: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 4,
  },
  backLinkText: {
    fontSize: 13,
    color: colors.iconBlue,
    fontWeight: '600',
  },
  footerMottoWrap: {
    marginTop: 20,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  footerMotto: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
