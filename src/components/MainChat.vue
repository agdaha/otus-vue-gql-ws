<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { useChannels } from '../composables/useChannels'
import { useMessages } from '../composables/useMessages'
import ChatMessage from '../components/ChatMessage.vue'

const route = useRoute()
const { user } = useAuth()
const { channels, currentChannel } = useChannels()
const { messages, fetchMessages, sendMessage, editMessage, deleteMessage, subscribeToMessages } = useMessages()

const newMessage = ref('')
const editingMessageId = ref(null)
const editMessageContent = ref('')

const channelId = computed(() => route.params.channelId)

onMounted(async () => {
  await fetchMessages(channelId.value)
  const unsubscribe = subscribeToMessages(channelId.value)
  
  onUnmounted(() => {
    unsubscribe()
  })
})

watch(channelId, async (newId) => {
  if (newId) {
    await fetchMessages(newId)
  }
})

const handleSendMessage = async () => {
  if (!newMessage.value.trim()) return
  
  await sendMessage(channelId.value, newMessage.value, user.value.id)
  newMessage.value = ''
}

const startEditMessage = (message) => {
  editingMessageId.value = message.id
  editMessageContent.value = message.content
}

const cancelEdit = () => {
  editingMessageId.value = null
  editMessageContent.value = ''
}

const saveEdit = async () => {
  if (!editMessageContent.value.trim()) return
  
  await editMessage(editingMessageId.value, editMessageContent.value, user.value.id)
  cancelEdit()
}

const handleDeleteMessage = async (messageId) => {
  if (confirm('Are you sure you want to delete this message?')) {
    await deleteMessage(messageId)
  }
}
</script>

<template>
  <div class="chat-container">
    <div class="messages">
      <ChatMessage
        v-for="message in messages"
        :key="message.id"
        :message="message"
        :is-owner="message.sender_id === user.id"
        @edit="startEditMessage"
        @delete="handleDeleteMessage"
      />
    </div>
    
    <div v-if="editingMessageId" class="edit-form">
      <textarea v-model="editMessageContent" />
      <button @click="saveEdit">Save</button>
      <button @click="cancelEdit">Cancel</button>
    </div>
    
    <div class="message-input">
      <textarea v-model="newMessage" @keyup.enter="handleSendMessage" />
      <button @click="handleSendMessage">Send</button>
    </div>
  </div>
</template>