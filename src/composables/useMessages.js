// src/composables/useMessages.js
import { ref } from 'vue'
import { supabase } from '../supabase'

export const useMessages = () => {
  const messages = ref([])
  const error = ref(null)
  const loading = ref(false)

  const fetchMessages = async (channelId) => {
    loading.value = true
    try {
      const { data, error: fetchError } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles(id, username, avatar_url),
          edits:message_edits(content, edited_at)
        `)
        .eq('channel_id', channelId)
        .is('deleted_at', null)
        .order('created_at', { ascending: true })
      
      if (fetchError) throw fetchError
      
      messages.value = data
    } catch (err) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  const sendMessage = async (channelId, content, userId) => {
    loading.value = true
    try {
      const { data, error: sendError } = await supabase
        .from('messages')
        .insert({
          channel_id: channelId,
          sender_id: userId,
          content
        })
        .select()
        .single()
      
      if (sendError) throw sendError
      
      messages.value.push(data)
      return data
    } catch (err) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  const editMessage = async (messageId, newContent, userId) => {
    loading.value = true
    try {
      // Сначала сохраняем текущую версию в историю редактирования
      const { data: currentMessage } = await supabase
        .from('messages')
        .select('content')
        .eq('id', messageId)
        .single()
      
      if (currentMessage) {
        await supabase
          .from('message_edits')
          .insert({
            message_id: messageId,
            content: currentMessage.content,
            edited_by: userId
          })
      }
      
      // Обновляем сообщение
      const { data, error: updateError } = await supabase
        .from('messages')
        .update({
          content: newContent,
          updated_at: new Date().toISOString()
        })
        .eq('id', messageId)
        .select(`
          *,
          sender:profiles(id, username, avatar_url),
          edits:message_edits(content, edited_at)
        `)
        .single()
      
      if (updateError) throw updateError
      
      const index = messages.value.findIndex(msg => msg.id === messageId)
      if (index !== -1) {
        messages.value[index] = data
      }
      return data
    } catch (err) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  const deleteMessage = async (messageId) => {
    loading.value = true
    try {
      const { error: deleteError } = await supabase
        .from('messages')
        .update({
          deleted_at: new Date().toISOString()
        })
        .eq('id', messageId)
      
      if (deleteError) throw deleteError
      
      messages.value = messages.value.filter(msg => msg.id !== messageId)
    } catch (err) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  const subscribeToMessages = (channelId) => {
    const subscription = supabase
      .channel(`messages_changes:${channelId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${channelId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            messages.value.push(payload.new)
          } else if (payload.eventType === 'UPDATE') {
            const index = messages.value.findIndex(msg => msg.id === payload.new.id)
            if (index !== -1) {
              messages.value[index] = payload.new
            }
          } else if (payload.eventType === 'DELETE') {
            messages.value = messages.value.filter(msg => msg.id !== payload.old.id)
          }
        }
      )
      .subscribe()
    
    return () => {
      supabase.removeChannel(subscription)
    }
  }

  return {
    messages,
    error,
    loading,
    fetchMessages,
    sendMessage,
    editMessage,
    deleteMessage,
    subscribeToMessages
  }
}