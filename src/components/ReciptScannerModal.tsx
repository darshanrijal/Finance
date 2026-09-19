import Feather from '@expo/vector-icons/Feather'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { CameraView, type FlashMode, useCameraPermissions } from 'expo-camera'
import * as ImagePicker from 'expo-image-picker'
import { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Modal,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from './SafeAreaView'

interface ReciptScannerModalProps {
  visible: boolean
  onClose: () => void
  onCaptured: (base64: string, mimetype: string) => void
}

export default function ReciptScannerModal({
  onCaptured,
  onClose,
  visible,
}: ReciptScannerModalProps) {
  const cameraRef = useRef<CameraView>(null)

  const [permission, requestPermission] = useCameraPermissions()
  const [capturing, setCapturing] = useState(false)
  const [flash, setFlash] = useState<FlashMode>('off')

  useEffect(() => {
    if (visible && !permission?.granted) {
      requestPermission()
    }
  }, [permission?.granted, requestPermission, visible])

  const handleCapture = async () => {
    if (!cameraRef.current || capturing) return

    try {
      setCapturing(true)

      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.6,
      })

      if (photo.base64) {
        onCaptured(photo.base64, 'image/jpeg')
      }
    } finally {
      setCapturing(false)
    }
  }

  const handlePickFromLibrary = async () => {
    const libraryPermission =
      await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!libraryPermission.granted) {
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      base64: true,
    })

    if (result.canceled) {
      return
    }

    const asset = result.assets?.[0]
    if (asset?.base64 && asset.mimeType) {
      onCaptured(asset.base64, asset.mimeType)
    }
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-black">
        {permission?.granted ? (
          <View className="flex-1">
            {/* Camera */}
            <CameraView
              ref={cameraRef}
              style={{ flex: 1 }}
              facing="back"
              flash={flash}
            />

            {/* Camera UI overlay */}
            <View className="absolute inset-0">
              {/* Top darkness */}
              <View className="absolute inset-x-0 top-0 h-40 bg-black/40" />

              {/* Bottom darkness */}
              <View className="absolute inset-x-0 bottom-0 h-52 bg-black/55" />

              <SafeAreaView
                edges={['top', 'bottom']}
                className="absolute inset-0"
              >
                {/* Header */}
                <View className="flex-row items-center justify-between px-5 pt-3">
                  <TouchableOpacity
                    onPress={onClose}
                    activeOpacity={0.7}
                    className="size-11 items-center justify-center rounded-full bg-black/45"
                  >
                    <Feather name="x" size={21} color="#fff" />
                  </TouchableOpacity>

                  <View className="items-center">
                    <Text className="font-brand-semibold text-base text-white">
                      Scan receipt
                    </Text>

                    <View className="mt-1 flex-row items-center gap-1.5">
                      <MaterialCommunityIcons
                        name="robot-outline"
                        size={14}
                        color="#fff"
                      />

                      <Text className="font-brand text-[11px] text-white/70">
                        AI powered
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={() =>
                      setFlash((current) => (current === 'off' ? 'on' : 'off'))
                    }
                    activeOpacity={0.7}
                    className="size-11 items-center justify-center rounded-full bg-black/45"
                  >
                    <Feather
                      name={flash === 'on' ? 'zap' : 'zap-off'}
                      size={19}
                      color="#fff"
                    />
                  </TouchableOpacity>
                </View>

                {/* Center instruction */}
                <View className="flex-1 items-center justify-end pb-10">
                  <View className="flex-row items-center gap-2 rounded-full bg-black/50 px-4 py-2.5">
                    <MaterialCommunityIcons
                      name="receipt-text-outline"
                      size={17}
                      color="#fff"
                    />

                    <Text className="font-brand-semibold text-white text-xs">
                      Align the receipt inside the frame
                    </Text>
                  </View>

                  <Text className="mt-3 text-center font-brand text-white/60 text-xs">
                    Keep the receipt flat and make sure the text is readable
                  </Text>
                </View>

                {/* Bottom controls */}
                <View className="px-8 pb-6">
                  <View className="flex-row items-center justify-between">
                    {/* Gallery */}
                    <TouchableOpacity
                      onPress={handlePickFromLibrary}
                      disabled={capturing}
                      activeOpacity={0.7}
                      className="size-12 items-center justify-center rounded-xl bg-white/15"
                    >
                      <Feather name="image" size={20} color="#fff" />
                    </TouchableOpacity>

                    {/* Shutter */}
                    <TouchableOpacity
                      onPress={handleCapture}
                      disabled={capturing}
                      activeOpacity={0.8}
                      className="size-20.5 items-center justify-center rounded-full border-4 border-white/90"
                    >
                      <View className="size-16 items-center justify-center rounded-full bg-white">
                        {capturing && (
                          <ActivityIndicator size="small" color="#000" />
                        )}
                      </View>
                    </TouchableOpacity>

                    {/* Keeps shutter centered */}
                    <View className="size-12" />
                  </View>

                  <View className="mt-5 items-center">
                    <View className="flex-row items-center gap-2">
                      <MaterialCommunityIcons
                        name="auto-fix"
                        size={14}
                        color="#fff"
                      />

                      <Text className="font-brand text-[11px] text-white/60">
                        We&apos;ll automatically extract the amount and details
                      </Text>
                    </View>
                  </View>
                </View>
              </SafeAreaView>
            </View>
          </View>
        ) : (
          <SafeAreaView
            edges={['top', 'bottom']}
            className="flex-1 items-center justify-center px-8"
          >
            <View className="size-16 items-center justify-center rounded-2xl bg-white/10">
              <Feather name="camera" size={28} color="#fff" />
            </View>

            <Text className="mt-5 text-center font-brand-semibold text-lg text-white">
              Camera access is required
            </Text>

            <Text className="mt-2 text-center font-brand text-sm text-white/60 leading-5">
              Allow camera access to scan your receipts.
            </Text>

            {permission?.canAskAgain && (
              <TouchableOpacity
                onPress={requestPermission}
                activeOpacity={0.8}
                className="mt-6 rounded-xl bg-primary px-6 py-3.5"
              >
                <Text className="font-brand-semibold text-primary-foreground text-sm">
                  Allow camera access
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.7}
              className="mt-3 px-5 py-3"
            >
              <Text className="font-brand-semibold text-sm text-white/70">
                Cancel
              </Text>
            </TouchableOpacity>
          </SafeAreaView>
        )}
      </View>
    </Modal>
  )
}
