import { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSchool } from '../context/SchoolContext';
import { colors, radius, shadowCard } from '../theme';

/**
 * First screen the app shows on launch. It stays up while AuthContext reads
 * AsyncStorage and verifies the saved token, so the parent never sees a flash
 * of the dashboard before being routed to the right place.
 */
export default function SplashScreen() {
  const { school } = useSchool();

  const fade = useRef(new Animated.Value(0)).current;
  const lift = useRef(new Animated.Value(16)).current;
  const pulse = useRef(new Animated.Value(0.96)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 480,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(lift, {
        toValue: 0,
        duration: 480,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    // Gentle breathing pulse on the logo while we work in the background.
    const breathe = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 950,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.96,
          duration: 950,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    breathe.start();

    return () => breathe.stop();
  }, [fade, lift, pulse]);

  return (
    <View style={styles.container}>
      <View style={styles.bgBlobOne} />
      <View style={styles.bgBlobTwo} />

      <Animated.View
        style={[
          styles.center,
          { opacity: fade, transform: [{ translateY: lift }, { scale: pulse }] },
        ]}
      >
        <View style={[styles.logoWrap, shadowCard]}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.name}>{school?.name || 'Elmax Academy'}</Text>
        <Text style={styles.sub}>Parent Portal</Text>
      </Animated.View>

      <View style={styles.footer}>
        <ActivityIndicator size="small" color={colors.iconBlue} />
        <Text style={styles.footerText}>Getting things ready…</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
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
    bottom: -90,
    left: -90,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#F3F7FD',
    opacity: 0.9,
  },
  center: {
    alignItems: 'center',
  },
  logoWrap: {
    width: 132,
    height: 132,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    marginBottom: 22,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.3,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  sub: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 5,
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  footerText: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '500',
  },
});
