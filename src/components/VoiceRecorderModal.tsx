import Feather from '@expo/vector-icons/Feather'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
} from 'expo-audio'
import { BlurView } from 'expo-blur'
import { File } from 'expo-file-system'
import { LinearGradient } from 'expo-linear-gradient'
import { useEffect, useState } from 'react'
import { Modal, Text, TouchableOpacity, View } from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import { trpc } from '@/__rpc/react'
import { AI_GRADIENT, RECORDING_GRADIENT } from '@/constants/theme'
import { VoiceTransaction } from '@/lib/ai'
import { GradientIconButton } from './GradientIconButton'

type Status = 'idle' | 'recording' | 'processing' | 'error'

const ORB_SIZE = 96

function PulseRing({ active }: { active: boolean }) {
  const progress = useSharedValue(0)

  useEffect(() => {
    if (!active) {
      progress.value = 0
      return
    }

    progress.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 0 }),
        withTiming(1, {
          duration: 1600,
          easing: Easing.out(Easing.ease),
        }),
      ),
      -1,
      false,
    )
  }, [active, progress])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: (1 - progress.value) * 0.45,
    transform: [
      {
        scale: 1 + progress.value * 0.9,
      },
    ],
  }))

  return (
    <Animated.View
      style={animatedStyle}
      className="absolute size-24 rounded-full border-2 border-primary"
    />
  )
}

function ProcessingRing() {
  const rotation = useSharedValue(0)

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 1100,
        easing: Easing.linear,
      }),
      -1,
      false,
    )
  }, [rotation])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }))

  return (
    <Animated.View
      style={animatedStyle}
      className="absolute size-24 rounded-full"
    >
      <LinearGradient
        colors={[AI_GRADIENT[1], AI_GRADIENT[0], 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: ORB_SIZE,
          height: ORB_SIZE,
          borderRadius: ORB_SIZE / 2,
          padding: 3,
        }}
      >
        <View className="flex-1 rounded-full bg-background" />
      </LinearGradient>
    </Animated.View>
  )
}

function formatDuration(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

export function VoiceRecorderModal({
  visible,
  onClose,
  onExtracted,
}: {
  visible: boolean
  onClose: () => void
  onExtracted: (result: VoiceTransaction) => void
}) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY)

  const [status, setStatus] = useState<Status>('idle')
  const [seconds, setSeconds] = useState(0)

  const orbScale = useSharedValue(1)

  const handleClose = () => {
    setStatus('idle')
    setSeconds(0)
    onClose()
  }

  /*
   * Reset whenever the modal closes.
   */
  useEffect(() => {
    if (!visible) {
      return
    }

    const setupAudio = async () => {
      try {
        const { granted } = await requestRecordingPermissionsAsync()

        if (!granted) {
          setStatus('error')
          return
        }

        await setAudioModeAsync({
          allowsRecording: true,
          playsInSilentMode: true,
        })
      } catch (error) {
        console.error('Audio setup failed:', error)
        setStatus('error')
      }
    }

    setupAudio()
  }, [visible])

  /*
   * Recording timer.
   */
  useEffect(() => {
    if (status !== 'recording') return

    const interval = setInterval(() => {
      setSeconds((current) => current + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [status])

  /*
   * Subtle breathing animation while recording.
   */
  useEffect(() => {
    if (status === 'recording') {
      orbScale.value = withRepeat(
        withSequence(
          withTiming(1.08, {
            duration: 550,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(1, {
            duration: 550,
            easing: Easing.inOut(Easing.ease),
          }),
        ),
        -1,
        false,
      )

      return
    }

    orbScale.value = withTiming(1, { duration: 200 })
  }, [status, orbScale])

  const orbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: orbScale.value }],
  }))
  const { mutateAsync: extractTransactionFromVoice } =
    trpc.ai.extractTransactionFromVoice.useMutation()

  const startRecording = async () => {
    try {
      setSeconds(0)

      await recorder.prepareToRecordAsync()
      recorder.record()

      setStatus('recording')
    } catch (error) {
      console.error('Recording failed to start:', error)
      setStatus('error')
    }
  }

  const stopRecording = async () => {
    if (status !== 'recording') return

    setStatus('processing')

    await recorder.stop()

    const uri = recorder.uri

    if (!uri) {
      throw new Error('No recording captured')
    }

    const file = new File(uri)
    const base64 = await file.base64()

    await extractTransactionFromVoice(
      {
        base64Audio: base64,
        mimeType: 'audio/m4a',
      },
      {
        onSuccess: (data) => {
          onExtracted(data)
          handleClose()
        },
        onError: (error) => {
          console.error('Voice extraction failed:', error)
          setStatus('error')
        },
      },
    )
  }

  const isProcessing = status === 'processing'
  const isRecording = status === 'recording'

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={isProcessing ? undefined : handleClose}
    >
      <View className="flex-1 justify-end">
        {/* Background */}
        <BlurView intensity={45} tint="dark" className="absolute inset-0" />

        {/* Bottom sheet */}
        <LinearGradient
          colors={['#1C1E2E', '#0F1020']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          className="overflow-hidden rounded-t-[28px] px-6 pt-3 pb-10"
        >
          {/* Drag handle */}
          <View className="mb-7 items-center">
            <View className="h-1 w-10 rounded-full bg-white/15" />
          </View>

          {status === 'error' ? (
            <ErrorState onClose={handleClose} />
          ) : (
            <>
              {/* Header */}
              <View className="items-center">
                <View className="mb-2 flex-row items-center gap-1.5">
                  <MaterialCommunityIcons
                    name="robot-outline"
                    size={15}
                    color="#0E9C79"
                  />

                  <Text className="font-brand-semibold text-[11px] text-primary uppercase">
                    AI voice log
                  </Text>
                </View>

                <Text className="font-brand-semibold text-lg text-white">
                  {isRecording
                    ? 'Listening…'
                    : isProcessing
                      ? 'Understanding that…'
                      : 'Tell me about a transaction'}
                </Text>

                <Text className="mt-2 text-center font-brand text-sm text-white/50 leading-5">
                  {isRecording
                    ? 'Speak naturally about your transaction'
                    : isProcessing
                      ? 'Transcribing and extracting the details'
                      : 'Just describe what you spent or received'}
                </Text>
              </View>

              {/* Example / timer */}
              <View className="mt-6 items-center">
                {isRecording ? (
                  <View className="rounded-full bg-white/5 px-4 py-2">
                    <Text className="font-brand-semibold text-sm text-white tabular-nums">
                      {formatDuration(seconds)}
                    </Text>
                  </View>
                ) : isProcessing ? (
                  <View className="rounded-full bg-white/5 px-4 py-2">
                    <Text className="font-brand text-white/60 text-xs">
                      This may take a moment
                    </Text>
                  </View>
                ) : (
                  <View className="rounded-2xl bg-white/5 px-4 py-3">
                    <Text className="text-center font-brand text-white/50 text-xs italic">
                      “I spent 400 on groceries yesterday”
                    </Text>
                  </View>
                )}
              </View>

              {/* Voice orb */}
              <View className="mt-9 h-32 items-center justify-center">
                {isRecording && (
                  <>
                    <PulseRing active />
                    <PulseRing active />
                  </>
                )}

                {status === 'idle' && <PulseRing active />}

                {isProcessing && <ProcessingRing />}

                <Animated.View style={orbStyle}>
                  <GradientIconButton
                    icon={isRecording ? 'square' : 'mic'}
                    colors={
                      isRecording
                        ? RECORDING_GRADIENT
                        : [AI_GRADIENT[1], AI_GRADIENT[0]]
                    }
                    disabled={isProcessing}
                    onPress={isRecording ? stopRecording : startRecording}
                  />
                </Animated.View>
              </View>

              {/* Status text */}
              <View className="mt-7 min-h-10 items-center justify-center">
                {isRecording ? (
                  <View className="flex-row items-center gap-2">
                    <View className="size-2 rounded-full bg-destructive" />
                    <Text className="font-brand-semibold text-white/60 text-xs">
                      Recording
                    </Text>
                  </View>
                ) : isProcessing ? (
                  <View className="flex-row items-center gap-2">
                    <MaterialCommunityIcons
                      name="auto-fix"
                      size={15}
                      color="#fff"
                    />
                    <Text className="font-brand-semibold text-white/60 text-xs">
                      Extracting transaction details
                    </Text>
                  </View>
                ) : (
                  <Text className="font-brand text-white/40 text-xs">
                    Tap the microphone to start
                  </Text>
                )}
              </View>

              {/* Cancel */}
              <TouchableOpacity
                onPress={handleClose}
                disabled={isProcessing}
                activeOpacity={0.7}
                className="mt-7 items-center py-2"
              >
                <Text
                  className={
                    isProcessing
                      ? 'font-brand text-sm text-white/20'
                      : 'font-brand-semibold text-sm text-white/45'
                  }
                >
                  Cancel
                </Text>
              </TouchableOpacity>
            </>
          )}
        </LinearGradient>
      </View>
    </Modal>
  )
}

function ErrorState({ onClose }: { onClose: () => void }) {
  return (
    <View className="items-center py-5">
      <View className="size-14 items-center justify-center rounded-full bg-destructive/10">
        <Feather name="alert-circle" size={27} color="#FF6B4A" />
      </View>

      <Text className="mt-5 font-brand-semibold text-lg text-white">
        Something went wrong
      </Text>

      <Text className="mt-2 max-w-75 text-center font-brand text-sm text-white/50 leading-5">
        We couldn&apos;t process your recording. Check your microphone
        permission and try again.
      </Text>

      <TouchableOpacity
        onPress={onClose}
        activeOpacity={0.8}
        className="mt-7 rounded-xl bg-white/10 px-7 py-3.5"
      >
        <Text className="font-brand-semibold text-sm text-white">Close</Text>
      </TouchableOpacity>
    </View>
  )
}
