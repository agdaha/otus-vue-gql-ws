// src/composables/useChannels.js
import { ref } from 'vue'
import { supabase } from '../supabase'

export const useChannels = () => {
  const channels = ref([])
  const currentChannel = ref(null)
  const error = ref(null)
  const loading = ref(false)

  const fetchChannels = async () => {
    loading.value = true
    try {
      const { data, error: fetchError } = await supabase
        .from('channels')
        .select('*')
        .order('created_at', { ascending: true })
      
      if (fetchError) throw fetchError
      
      channels.value = data
      // Убедимся, что public channel существует
      if (!data.some(ch => ch.name === 'public')) {
        await createChannel('public', 'Public channel', true)
      }
      if (!data.some(ch => ch.name === 'support')) {
        await createChannel('support', 'Support channel', false)
      }
    } catch (err) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  const createChannel = async (name, description, isPublic) => {
    loading.value = true
    try {
      const { data, error: createError } = await supabase
        .from('channels')
        .insert({
          name,
          description,
          is_public: isPublic
        })
        .select()
        .single()
      
      if (createError) throw createError
      
      channels.value.push(data)
      return data
    } catch (err) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  const updateChannel = async (id, updates) => {
    loading.value = true
    try {
      const { data, error: updateError } = await supabase
        .from('channels')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (updateError) throw updateError
      
      const index = channels.value.findIndex(ch => ch.id === id)
      if (index !== -1) {
        channels.value[index] = data
      }
      return data
    } catch (err) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  const deleteChannel = async (id) => {
    loading.value = true
    try {
      const { error: deleteError } = await supabase
        .from('channels')
        .delete()
        .eq('id', id)
      
      if (deleteError) throw deleteError
      
      channels.value = channels.value.filter(ch => ch.id !== id)
    } catch (err) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  const subscribeToChannels = () => {
    const subscription = supabase
      .channel('channels_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'channels'
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            channels.value.push(payload.new)
          } else if (payload.eventType === 'UPDATE') {
            const index = channels.value.findIndex(ch => ch.id === payload.new.id)
            if (index !== -1) {
              channels.value[index] = payload.new
            }
          } else if (payload.eventType === 'DELETE') {
            channels.value = channels.value.filter(ch => ch.id !== payload.old.id)
          }
        }
      )
      .subscribe()
    
    return () => {
      supabase.removeChannel(subscription)
    }
  }

  return {
    channels,
    currentChannel,
    error,
    loading,
    fetchChannels,
    createChannel,
    updateChannel,
    deleteChannel,
    subscribeToChannels
  }
}