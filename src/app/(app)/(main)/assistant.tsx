import { Feather } from '@expo/vector-icons'
import { useEffect, useRef, useState } from 'react'
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { trpc } from '@/__rpc/react'
import { SafeAreaView } from '@/components/SafeAreaView'
import { useUserStore } from '@/hooks/useUser'
import { authClient } from '@/lib/auth-client'
import { cn } from '@/lib/utils'

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
}

const SUGGESTED_PROMPTS = [
  'How much did I spend on food this month?',
  "What's my biggest expense this week?",
  'Am I over budget anywhere?',
]

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'welcome',
    role: 'assistant',
    content:
      'Hi! Ask me anything about your spending or budgets from the last 30 days.',
  },
]

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'

  // Removed scale. Professional apps don't bounce their text elements.
  const opacity = useSharedValue(0)
  const translateY = useSharedValue(12)

  useEffect(() => {
    // Crisp, Apple-style cubic easing curve. No jitter, no bounce.
    opacity.value = withTiming(1, {
      duration: 250,
      easing: Easing.out(Easing.cubic),
    })

    translateY.value = withTiming(0, {
      duration: 250,
      easing: Easing.out(Easing.cubic),
    })
  }, [opacity, translateY])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }))

  return (
    <Animated.View
      style={animatedStyle}
      className={cn('mb-2.5 max-w-[84%]', isUser ? 'self-end' : 'self-start')}
    >
      <View
        className={cn(
          'rounded-2xl px-3.5 py-2.5',
          isUser
            ? 'rounded-br-md bg-primary'
            : 'rounded-bl-md border border-border bg-card',
        )}
      >
        <Text
          className={cn(
            'font-brand text-sm leading-5',
            isUser ? 'text-primary-foreground' : 'text-card-foreground',
          )}
        >
          {message.content}
        </Text>
      </View>
    </Animated.View>
  )
}

// ... Keep your TypingDot and TypingBubble functions exactly the same ...
function TypingDot({ delay }: { delay: number }) {
  const opacity = useSharedValue(0.3)
  const translateY = useSharedValue(0)

  useEffect(() => {
    const timeout = setTimeout(() => {
      opacity.value = withTiming(1, { duration: 300 }, () => {
        opacity.value = withTiming(0.3, { duration: 300 })
      })

      translateY.value = withTiming(-3, { duration: 300 }, () => {
        translateY.value = withTiming(0, { duration: 300 })
      })
    }, delay)

    return () => clearTimeout(timeout)
  }, [delay, opacity, translateY])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }))

  return (
    <Animated.View
      style={animatedStyle}
      className="size-1.5 rounded-full bg-muted-foreground"
    />
  )
}

function TypingBubble() {
  return (
    <View className="mb-2.5 self-start rounded-2xl rounded-bl-md border border-border bg-card px-4 py-3">
      <View className="flex-row items-center gap-1">
        <TypingDot delay={0} />
        <TypingDot delay={120} />
        <TypingDot delay={240} />
      </View>
    </View>
  )
}

function SuggestedPrompt({
  prompt,
  onPress,
}: {
  prompt: string
  onPress: () => void
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="self-start rounded-xl border border-border bg-card px-3.5 py-2.5"
    >
      <Text className="font-brand text-muted-foreground text-xs">{prompt}</Text>
    </TouchableOpacity>
  )
}

export default function AssistantScreen() {
  const user = authClient.useSession().data?.user
  const { currency } = useUserStore()
  const insets = useSafeAreaInsets() // Grabbing dynamic device insets

  const { refetch: refetchTransactions } =
    trpc.transactions.getTransactions.useQuery({})
  const { refetch: refetchBudget } = trpc.budget.getBudget.useQuery()
  const { mutateAsync: askAssistant, isPending: sending } =
    trpc.ai.askAssistant.useMutation()

  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES)
  const [input, setInput] = useState('')

  const listRef = useRef<FlatList<ChatMessage>>(null)

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated: true })
    })
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: input focus causes layout changes
  useEffect(() => {
    scrollToBottom()
  }, [messages.length, sending])

  const sendMessage = async (text: string) => {
    const question = text.trim()

    if (!question || sending || !user) return

    const userMessage: ChatMessage = {
      // eslint-disable-next-line react-hooks/purity
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      role: 'user',
      content: question,
    }
    setMessages((current) => [...current, userMessage])
    setInput('')

    const [{ data: transactions = [] }, { data: budget = null }] =
      await Promise.all([refetchTransactions(), refetchBudget()])

    await askAssistant(
      { question, transactions, budget, currency },
      {
        onSuccess: (reply) => {
          setMessages((current) => [
            ...current,
            {
              id: `assistant-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
              role: 'assistant',
              content: reply,
            },
          ])
        },
        onError: (error) => {
          console.error('Assistant error:', error)

          setMessages((current) => [
            ...current,
            {
              id: `error-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
              role: 'assistant',
              content:
                "Sorry, I couldn't answer that right now. Please try again.",
            },
          ])
        },
      },
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View className="px-5 pt-3 pb-3">
        <View className="flex-row items-center gap-2.5">
          <View className="size-9 items-center justify-center rounded-xl bg-primary/10">
            <Feather name="message-circle" size={17} color="#FFF" />
          </View>
          <View>
            <Text className="font-brand-bold text-foreground text-xl">
              Assistant
            </Text>
            <Text className="font-brand text-muted-foreground text-xs">
              Ask about your finances
            </Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <MessageBubble message={item} />}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 8,
            paddingBottom: 12,
          }}
          ListFooterComponent={sending ? <TypingBubble /> : null}
          // Forces layout shifts to keep the bottom visible when keyboard pops
          onContentSizeChange={scrollToBottom}
          onLayout={scrollToBottom}
        />

        {/* Suggested prompts */}
        {messages.length === 1 && !sending && (
          <View className="gap-2 px-5 pb-2">
            {SUGGESTED_PROMPTS.map((prompt) => (
              <SuggestedPrompt
                key={prompt}
                prompt={prompt}
                onPress={() => sendMessage(prompt)}
              />
            ))}
          </View>
        )}

        {/* Composer */}
        <View
          // We use dynamic insets here so it respects the home indicator line on iPhones,
          // but seamlessly moves up without massive gaps when the keyboard is open.
          style={{ paddingBottom: Math.max(insets.bottom, 12) }}
          className="flex-row items-end justify-center gap-2 border-border border-t bg-background px-5 pt-2"
        >
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Ask about your money..."
            placeholderTextColor="#8A8D96"
            editable={!sending}
            multiline
            maxLength={500}
            textAlignVertical="center"
            className="max-h-24 min-h-11 flex-1 rounded-[22px] border border-border bg-card px-4 py-2.5 font-brand text-card-foreground text-sm"
            onSubmitEditing={() => sendMessage(input)}
            returnKeyType="send"
          />

          <TouchableOpacity
            onPress={() => sendMessage(input)}
            disabled={sending || !input.trim()}
            activeOpacity={0.8}
            className={cn(
              'mb-0.5 size-11 items-center justify-center rounded-full',
              sending || !input.trim() ? 'bg-primary/40' : 'bg-primary',
            )}
          >
            <Feather name="arrow-up" size={17} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
