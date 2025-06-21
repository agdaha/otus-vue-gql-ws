<script setup>
import { computed } from 'vue'
import { useAuth } from '../composables/useAuth'

const props = defineProps({
  message: {
    type: Object,
    required: true
  },
  isOwner: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['edit', 'delete'])

const { user } = useAuth()

const canEdit = computed(() => props.isOwner || user.value.role === 'admin')
const canDelete = computed(() => props.isOwner || user.value.role === 'admin')

const showEditHistory = ref(false)
</script>

<template>
  <div class="message">
    <div class="message-header">
      <span class="sender">{{ message.sender.username }}</span>
      <span class="time">{{ new Date(message.created_at).toLocaleTimeString() }}</span>
      
      <div v-if="canEdit || canDelete" class="message-actions">
        <button v-if="canEdit" @click="emit('edit', message)">Edit</button>
        <button v-if="canDelete" @click="emit('delete', message.id)">Delete</button>
        <button v-if="message.edits.length" @click="showEditHistory = !showEditHistory">
          History ({{ message.edits.length }})
        </button>
      </div>
    </div>
    
    <div class="message-content">{{ message.content }}</div>
    
    <div v-if="showEditHistory" class="edit-history">
      <div v-for="(edit, index) in message.edits" :key="index" class="edit">
        <div class="edit-content">{{ edit.content }}</div>
        <div class="edit-time">{{ new Date(edit.edited_at).toLocaleString() }}</div>
      </div>
    </div>
  </div>
</template>